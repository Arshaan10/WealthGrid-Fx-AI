import { Prisma } from "@prisma/client";
import {
  caps,
  isNetworkRewardType,
  isTradingRewardType,
  loyalty,
  referrals,
  rewardsClock,
  walletForRewardType,
  walletRouting,
  type RewardType,
} from "@/config/rewards";
import { resolveDailyRatePct } from "@/lib/boosters";
import { isTradingWeekday, parseDateKey, zonedDateKey, zonedIsoWeekKey } from "@/lib/clock";
import {
  applyNetworkCreditToLoan,
  isLoanPackageRoiPaused,
  isUnpaidLoanActivation,
  remainingPrincipal,
} from "@/lib/flash-loans";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "@/lib/treasury";
import { asNumber } from "@/lib/utils";
import { creditWallet } from "@/lib/wallets";

export type CapSnapshot = {
  principal: number;
  tradingEarned: number;
  networkEarned: number;
  tradingCap: number;
  networkCap: number;
  tradingRemaining: number;
  networkRemaining: number;
  tradingRatio: number;
  networkRatio: number;
};

export type RewardCreditResult = {
  paid: boolean;
  skipped: boolean;
  reason?: "weekend" | "cap" | "duplicate" | "zero";
  amount: number;
  wallet: "TRADING" | "NETWORK";
  payoutId?: string;
  loanRecovery?: boolean;
};

export type DailyJobResult = {
  timezone: string;
  dateKey: string;
  tradingDay: boolean;
  tradingCredits: number;
  networkCredits: number;
  skippedWeekend: boolean;
  skippedCap: number;
  skippedDuplicate: number;
  skippedLoan: number;
  skippedRoiHold: number;
  loanRecoveries: number;
  usersTouched: number;
  notes: string[];
};

function dec(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function ledgerCategory(type: RewardType) {
  return type === "DIRECT" || type === "TEAM" ? "REFERRAL" : "REWARD";
}

export async function getCapSnapshot(userId: string, db: DbClient = prisma): Promise<CapSnapshot> {
  const [activations, payoutGroups] = await Promise.all([
    db.packageActivation.findMany({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { flashLoan: true },
    }),
    db.rewardPayout.groupBy({
      by: ["type"],
      where: { userId, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  const principal = activations.reduce((sum, row) => {
    if (isUnpaidLoanActivation(row)) return sum;
    return sum + asNumber(row.amount);
  }, 0);
  let tradingEarned = 0;
  let networkEarned = 0;
  for (const row of payoutGroups) {
    const amount = asNumber(row._sum.amount ?? 0);
    if (isTradingRewardType(row.type)) tradingEarned += amount;
    else if (isNetworkRewardType(row.type)) networkEarned += amount;
  }

  const tradingCap = principal * caps.tradingMultiple;
  const networkCap = principal * caps.networkMultiple;
  const tradingRemaining = Math.max(0, tradingCap - tradingEarned);
  const networkRemaining = Math.max(0, networkCap - networkEarned);

  return {
    principal,
    tradingEarned,
    networkEarned,
    tradingCap,
    networkCap,
    tradingRemaining,
    networkRemaining,
    tradingRatio: tradingCap > 0 ? Math.min(1, tradingEarned / tradingCap) : 0,
    networkRatio: networkCap > 0 ? Math.min(1, networkEarned / networkCap) : 0,
  };
}

async function remainingForType(userId: string, type: RewardType, db: DbClient) {
  const snap = await getCapSnapshot(userId, db);
  return isTradingRewardType(type) ? snap.tradingRemaining : snap.networkRemaining;
}

async function completePackagesIfTradingCapped(userId: string, db: DbClient) {
  const snap = await getCapSnapshot(userId, db);
  if (snap.tradingRemaining > 0.0001) return;
  const active = await db.packageActivation.findMany({
    where: { userId, status: "ACTIVE" },
    include: { flashLoan: true },
  });
  const completable = active.filter((row) => !isUnpaidLoanActivation(row)).map((row) => row.id);
  if (completable.length === 0) return;
  await db.packageActivation.updateMany({
    where: { id: { in: completable } },
    data: { status: "COMPLETED", endsAt: new Date() },
  });
}

/**
 * Book a reward to the correct wallet, enforcing 2× / 3× caps and Mon–Fri trading days.
 * Partial credits are allowed when only a sliver of cap remains.
 */
export async function creditCappedReward(input: {
  userId: string;
  type: RewardType;
  amount: Prisma.Decimal | string | number;
  note: string;
  periodKey?: string;
  createdAt?: Date;
  db?: DbClient;
}): Promise<RewardCreditResult> {
  const db = input.db ?? prisma;
  const wallet = walletForRewardType(input.type);
  const when = input.createdAt ?? new Date();
  const requested = asNumber(input.amount);

  if (requested <= 0) {
    return { paid: false, skipped: true, reason: "zero", amount: 0, wallet };
  }

  if (isTradingRewardType(input.type) && !isTradingWeekday(when, rewardsClock.timezone)) {
    return { paid: false, skipped: true, reason: "weekend", amount: 0, wallet };
  }

  if (input.periodKey) {
    const existing = await db.rewardPayout.findFirst({
      where: { userId: input.userId, type: input.type, periodKey: input.periodKey },
    });
    if (existing) {
      return { paid: false, skipped: true, reason: "duplicate", amount: 0, wallet, payoutId: existing.id };
    }
  }

  const remaining = await remainingForType(input.userId, input.type, db);
  const credit = Math.min(requested, remaining);
  if (credit <= 0) {
    return { paid: false, skipped: true, reason: "cap", amount: 0, wallet };
  }

  const amount = dec(credit.toFixed(4));
  const payout = await db.rewardPayout.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount,
      status: "PAID",
      note: input.note,
      periodKey: input.periodKey,
      createdAt: when,
    },
  });

  await creditWallet({
    userId: input.userId,
    type: wallet,
    amount,
    category: ledgerCategory(input.type),
    description: input.note,
    refId: payout.id,
    createdAt: when,
    db,
  });

  let loanRecovery = false;
  if (isNetworkRewardType(input.type)) {
    const recovery = await applyNetworkCreditToLoan(input.userId, amount, when, db);
    loanRecovery = Boolean(recovery && recovery.applied > 0);
  }

  if (isTradingRewardType(input.type)) {
    await completePackagesIfTradingCapped(input.userId, db);
  }

  return {
    paid: true,
    skipped: false,
    amount: asNumber(amount),
    wallet,
    payoutId: payout.id,
    loanRecovery,
  };
}

async function creditUplineTeam(input: {
  sourceUserId: string;
  dailyAmount: number;
  dateKey: string;
  sourceKey: string;
  when: Date;
  db: DbClient;
}) {
  const results: RewardCreditResult[] = [];
  let currentId: string | null = input.sourceUserId;
  let level = 0;

  while (currentId && level < referrals.teamLevels) {
    const user: { referredById: string | null } | null = await input.db.user.findUnique({
      where: { id: currentId },
      select: { referredById: true },
    });
    const uplineId: string | null = user?.referredById ?? null;
    if (!uplineId) break;

    const pct = referrals.teamTradingPct[level] ?? 0;
    const amount = (input.dailyAmount * pct) / 100;
    if (amount > 0) {
      const result = await creditCappedReward({
        userId: uplineId,
        type: "TEAM",
        amount,
        note: `L${level + 1} team trading ${pct}% of daily credit`,
        periodKey: `TEAM:${input.dateKey}:${input.sourceKey}:L${level + 1}`,
        createdAt: input.when,
        db: input.db,
      });
      results.push(result);
    }

    currentId = uplineId;
    level += 1;
  }

  return results;
}

async function creditWeeklyLoyalty(input: {
  userId: string;
  principal: number;
  when: Date;
  periodKey: string;
  db: DbClient;
}) {
  const amount = (input.principal * loyalty.weeklyPct) / 100;
  return creditCappedReward({
    userId: input.userId,
    type: "LOYALTY",
    amount,
    note: `Weekly loyalty ${loyalty.weeklyPct}% of active principal (Network wallet)`,
    periodKey: input.periodKey,
    createdAt: input.when,
    db: input.db,
  });
}

async function hasLegacyDaily(userId: string, dateKey: string, db: DbClient) {
  return db.rewardPayout.findFirst({
    where: { userId, type: "DAILY", periodKey: `DAILY:${dateKey}` },
    select: { id: true },
  });
}

async function hasLegacyLoyalty(userId: string, weekKey: string, db: DbClient) {
  return db.rewardPayout.findFirst({
    where: { userId, type: "LOYALTY", periodKey: `LOYALTY:${weekKey}` },
    select: { id: true },
  });
}

/**
 * Apply one calendar day's rewards.
 * - Trading (DAILY): Mon–Fri only, Trading wallet, 2× cap
 *   per-package rate from booster tier + live active-direct volume
 *   skipped while a flash loan on that package is unpaid / before roiStartsOn
 * - Team: 24/7, Network wallet, 3× cap — percent of that day's trading credit
 * - Loyalty: 24/7, Network wallet, 3× cap — once per ISO week per package
 * Network reward credits auto-apply to outstanding flash-loan `repaid`.
 */
export async function runDailyRewardJob(input: { date?: Date; actorId?: string | null } = {}): Promise<DailyJobResult> {
  const when = input.date ?? new Date();
  const dateKey = zonedDateKey(when, rewardsClock.timezone);
  const tradingDay = isTradingWeekday(when, rewardsClock.timezone);

  const result: DailyJobResult = {
    timezone: rewardsClock.timezone,
    dateKey,
    tradingDay,
    tradingCredits: 0,
    networkCredits: 0,
    skippedWeekend: !tradingDay,
    skippedCap: 0,
    skippedDuplicate: 0,
    skippedLoan: 0,
    skippedRoiHold: 0,
    loanRecoveries: 0,
    usersTouched: 0,
    notes: [
      walletRouting.trading.copy,
      walletRouting.network.copy,
      rewardsClock.note,
      "Loan-funded packages skip daily ROI while remaining principal > 0; ROI starts the next Asia/Dubai day after recovery.",
      "Booster rates are computed from currently ACTIVE first-line package volume.",
    ],
  };

  const activations = await prisma.packageActivation.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { id: true, name: true } },
      flashLoan: true,
    },
  });

  const touched = new Set<string>();
  const weekKey = zonedIsoWeekKey(when, rewardsClock.timezone);

  for (const activation of activations) {
    const principal = asNumber(activation.amount);
    if (principal <= 0) continue;

    await prisma.$transaction(async (tx) => {
      const pause = isLoanPackageRoiPaused({
        fundingSource: activation.fundingSource,
        roiStartsOn: activation.roiStartsOn,
        loanStatus: activation.flashLoan?.status ?? null,
        remaining: activation.flashLoan ? remainingPrincipal(activation.flashLoan) : 0,
        dateKey,
      });

      if (tradingDay) {
        if (pause.paused) {
          if (pause.reason === "loan") result.skippedLoan += 1;
          else result.skippedRoiHold += 1;
        } else {
          const rate = await resolveDailyRatePct({
            userId: activation.userId,
            boosterTier: activation.boosterTier,
            fundingSource: activation.fundingSource,
            db: tx,
          });
          const daily = (principal * rate.ratePct) / 100;
          const legacy = await hasLegacyDaily(activation.userId, dateKey, tx);
          const dailyResult = legacy
            ? { paid: false as const, skipped: true as const, reason: "duplicate" as const, amount: 0, wallet: "TRADING" as const }
            : await creditCappedReward({
                userId: activation.userId,
                type: "DAILY",
                amount: daily,
                note: `Daily trading ROI ${rate.ratePct}% of ${principal.toFixed(2)} (${rate.tier}, directs ${rate.activeDirectVolume.toFixed(0)}) → Trading wallet`,
                periodKey: `DAILY:${dateKey}:${activation.id}`,
                createdAt: when,
                db: tx,
              });

          if (dailyResult.paid) {
            result.tradingCredits += dailyResult.amount;
            touched.add(activation.userId);
            const teamResults = await creditUplineTeam({
              sourceUserId: activation.userId,
              dailyAmount: dailyResult.amount,
              dateKey,
              sourceKey: activation.id,
              when,
              db: tx,
            });
            for (const team of teamResults) {
              if (team.paid) {
                result.networkCredits += team.amount;
                touched.add(activation.userId);
                if (team.loanRecovery) result.loanRecoveries += 1;
              } else if (team.reason === "cap") result.skippedCap += 1;
              else if (team.reason === "duplicate") result.skippedDuplicate += 1;
            }
          } else if (dailyResult.reason === "cap") result.skippedCap += 1;
          else if (dailyResult.reason === "duplicate") result.skippedDuplicate += 1;
        }
      }

      const legacyLoyalty = await hasLegacyLoyalty(activation.userId, weekKey, tx);
      const loyaltyResult = legacyLoyalty
        ? { paid: false as const, skipped: true as const, reason: "duplicate" as const, amount: 0, wallet: "NETWORK" as const }
        : await creditWeeklyLoyalty({
            userId: activation.userId,
            principal,
            when,
            periodKey: `LOYALTY:${weekKey}:${activation.id}`,
            db: tx,
          });
      if (loyaltyResult.paid) {
        result.networkCredits += loyaltyResult.amount;
        touched.add(activation.userId);
        if ("loanRecovery" in loyaltyResult && loyaltyResult.loanRecovery) result.loanRecoveries += 1;
      } else if (loyaltyResult.reason === "cap") result.skippedCap += 1;
      else if (loyaltyResult.reason === "duplicate") result.skippedDuplicate += 1;
    });
  }

  result.usersTouched = touched.size;
  result.tradingCredits = Number(result.tradingCredits.toFixed(4));
  result.networkCredits = Number(result.networkCredits.toFixed(4));

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: "REWARDS_DAILY_JOB",
      entity: "SYSTEM",
      meta: JSON.stringify({
        dateKey,
        timezone: result.timezone,
        tradingDay,
        tradingCredits: result.tradingCredits,
        networkCredits: result.networkCredits,
        skippedCap: result.skippedCap,
        skippedDuplicate: result.skippedDuplicate,
        skippedLoan: result.skippedLoan,
        skippedRoiHold: result.skippedRoiHold,
        loanRecoveries: result.loanRecoveries,
        usersTouched: result.usersTouched,
      }),
    },
  });

  return result;
}

export function resolveJobDate(raw?: string | null): Date {
  if (!raw) return new Date();
  return parseDateKey(raw);
}
