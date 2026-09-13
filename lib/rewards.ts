import { Prisma } from "@prisma/client";
import {
  caps,
  isNetworkRewardType,
  isTradingRewardType,
  loyalty,
  packages,
  referrals,
  rewardsClock,
  walletForRewardType,
  walletRouting,
  type RewardType,
} from "@/config/rewards";
import { isTradingWeekday, parseDateKey, zonedDateKey, zonedIsoWeekKey } from "@/lib/clock";
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
  const [activationAgg, payoutGroups] = await Promise.all([
    db.packageActivation.aggregate({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      _sum: { amount: true },
    }),
    db.rewardPayout.groupBy({
      by: ["type"],
      where: { userId, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  const principal = asNumber(activationAgg._sum.amount ?? 0);
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
  await db.packageActivation.updateMany({
    where: { userId, status: "ACTIVE" },
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

  if (isTradingRewardType(input.type)) {
    await completePackagesIfTradingCapped(input.userId, db);
  }

  return {
    paid: true,
    skipped: false,
    amount: asNumber(amount),
    wallet,
    payoutId: payout.id,
  };
}

async function creditUplineTeam(input: {
  sourceUserId: string;
  dailyAmount: number;
  dateKey: string;
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
        periodKey: `TEAM:${input.dateKey}:${input.sourceUserId}:L${level + 1}`,
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

async function creditWeeklyLoyalty(input: { userId: string; principal: number; when: Date; db: DbClient }) {
  const weekKey = zonedIsoWeekKey(input.when, rewardsClock.timezone);
  const amount = (input.principal * loyalty.weeklyPct) / 100;
  return creditCappedReward({
    userId: input.userId,
    type: "LOYALTY",
    amount,
    note: `Weekly loyalty ${loyalty.weeklyPct}% of active principal (Network wallet)`,
    periodKey: `LOYALTY:${weekKey}`,
    createdAt: input.when,
    db: input.db,
  });
}

/**
 * Apply one calendar day's rewards.
 * - Trading (DAILY): Mon–Fri only, Trading wallet, 2× cap
 * - Team: 24/7, Network wallet, 3× cap — percent of that day's trading credit
 * - Loyalty: 24/7, Network wallet, 3× cap — once per ISO week
 */
export async function runDailyRewardJob(input: { date?: Date; actorId?: string | null } = {}): Promise<DailyJobResult> {
  const when = input.date ?? new Date();
  const dateKey = zonedDateKey(when, rewardsClock.timezone);
  const tradingDay = isTradingWeekday(when, rewardsClock.timezone);
  const pro = packages[0];

  const result: DailyJobResult = {
    timezone: rewardsClock.timezone,
    dateKey,
    tradingDay,
    tradingCredits: 0,
    networkCredits: 0,
    skippedWeekend: !tradingDay,
    skippedCap: 0,
    skippedDuplicate: 0,
    usersTouched: 0,
    notes: [
      walletRouting.trading.copy,
      walletRouting.network.copy,
      rewardsClock.note,
    ],
  };

  const activations = await prisma.packageActivation.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { id: true, name: true } } },
  });

  const touched = new Set<string>();

  for (const activation of activations) {
    const principal = asNumber(activation.amount);
    if (principal <= 0) continue;

    await prisma.$transaction(async (tx) => {
      if (tradingDay) {
        const daily = (principal * pro.dailyRatePct) / 100;
        const dailyResult = await creditCappedReward({
          userId: activation.userId,
          type: "DAILY",
          amount: daily,
          note: `Daily trading ROI ${pro.dailyRatePct}% of ${principal.toFixed(2)} → Trading wallet`,
          periodKey: `DAILY:${dateKey}`,
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
            when,
            db: tx,
          });
          for (const team of teamResults) {
            if (team.paid) {
              result.networkCredits += team.amount;
              touched.add(activation.userId);
            } else if (team.reason === "cap") result.skippedCap += 1;
            else if (team.reason === "duplicate") result.skippedDuplicate += 1;
          }
        } else if (dailyResult.reason === "cap") result.skippedCap += 1;
        else if (dailyResult.reason === "duplicate") result.skippedDuplicate += 1;
      }

      const loyaltyResult = await creditWeeklyLoyalty({
        userId: activation.userId,
        principal,
        when,
        db: tx,
      });
      if (loyaltyResult.paid) {
        result.networkCredits += loyaltyResult.amount;
        touched.add(activation.userId);
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
