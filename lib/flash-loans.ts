import { Prisma } from "@prisma/client";
import { flashLoan, packages } from "@/config/rewards";
import { addZonedCalendarDays, addZonedMonths, zonedDateKey, zonedDaysUntil } from "@/lib/clock";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "@/lib/treasury";
import { asNumber } from "@/lib/utils";
import { debitAvailable } from "@/lib/wallets";

export type LoanStatus = "OUTSTANDING" | "RECOVERED";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type OutstandingLoanView = {
  id: string;
  applicationId: string;
  requested: number;
  approved: number;
  principal: number;
  repaid: number;
  remaining: number;
  recoveredPct: number;
  status: LoanStatus;
  approvedAt: Date;
  recoveredAt: Date | null;
  coolingUntil: Date | null;
  packageActivationId: string | null;
};

export type LoanDeskSnapshot = {
  pendingApplication: {
    id: string;
    requested: number;
    createdAt: Date;
    note: string | null;
  } | null;
  outstanding: OutstandingLoanView | null;
  lastRecovered: OutstandingLoanView | null;
  coolingUntil: Date | null;
  coolingActive: boolean;
  coolingDaysLeft: number;
  canApply: boolean;
  canActivateLoan: boolean;
  applyBlockedReason: string | null;
  approveBlockedReason: string | null;
  networkAvailable: number;
  networkIsLiability: boolean;
};

function dec(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

export function remainingPrincipal(loan: { principal: Prisma.Decimal | string | number; repaid: Prisma.Decimal | string | number }) {
  return Math.max(0, asNumber(loan.principal) - asNumber(loan.repaid));
}

/** Unpaid loan books must not enlarge the desk 2× / 3× principal basis. */
export function isUnpaidLoanActivation(row: {
  fundingSource: string;
  flashLoan?: { status: string; principal: Prisma.Decimal | string | number; repaid: Prisma.Decimal | string | number } | null;
}) {
  if (row.fundingSource !== "LOAN") return false;
  if (!row.flashLoan) return true;
  return row.flashLoan.status === "OUTSTANDING" || remainingPrincipal(row.flashLoan) > 0;
}

export function toLoanView(loan: {
  id: string;
  applicationId: string;
  requested: Prisma.Decimal | string | number;
  approved: Prisma.Decimal | string | number;
  principal: Prisma.Decimal | string | number;
  repaid: Prisma.Decimal | string | number;
  status: string;
  approvedAt: Date;
  recoveredAt: Date | null;
  coolingUntil: Date | null;
  activation?: { id: string } | null;
}): OutstandingLoanView {
  const principal = asNumber(loan.principal);
  const repaid = asNumber(loan.repaid);
  const remaining = Math.max(0, principal - repaid);
  return {
    id: loan.id,
    applicationId: loan.applicationId,
    requested: asNumber(loan.requested),
    approved: asNumber(loan.approved),
    principal,
    repaid,
    remaining,
    recoveredPct: principal > 0 ? Math.min(100, (repaid / principal) * 100) : 0,
    status: loan.status === "RECOVERED" ? "RECOVERED" : "OUTSTANDING",
    approvedAt: loan.approvedAt,
    recoveredAt: loan.recoveredAt,
    coolingUntil: loan.coolingUntil,
    packageActivationId: loan.activation?.id ?? null,
  };
}

export async function getOutstandingLoan(userId: string, db: DbClient = prisma) {
  return db.flashLoan.findFirst({
    where: { userId, status: "OUTSTANDING" },
    include: { activation: { select: { id: true } } },
    orderBy: { approvedAt: "asc" },
  });
}

export async function getLatestRecoveredLoan(userId: string, db: DbClient = prisma) {
  return db.flashLoan.findFirst({
    where: { userId, status: "RECOVERED" },
    include: { activation: { select: { id: true } } },
    orderBy: { recoveredAt: "desc" },
  });
}

export function coolingGate(recovered: { coolingUntil: Date | null } | null, now = new Date()) {
  if (!recovered?.coolingUntil) {
    return { active: false, until: null as Date | null, daysLeft: 0 };
  }
  const daysLeft = zonedDaysUntil(recovered.coolingUntil, now);
  return {
    active: daysLeft > 0,
    until: recovered.coolingUntil,
    daysLeft: Math.max(0, daysLeft),
  };
}

export async function getLoanDeskSnapshot(userId: string, now = new Date()): Promise<LoanDeskSnapshot> {
  const [pending, outstandingRow, recoveredRow, network] = await Promise.all([
    prisma.flashLoanApplication.findFirst({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    getOutstandingLoan(userId),
    getLatestRecoveredLoan(userId),
    prisma.walletBalance.findUnique({
      where: { userId_type: { userId, type: "NETWORK" } },
    }),
  ]);

  const outstanding = outstandingRow ? toLoanView(outstandingRow) : null;
  const lastRecovered = recoveredRow ? toLoanView(recoveredRow) : null;
  const cooling = coolingGate(recoveredRow, now);
  const networkAvailable = asNumber(network?.available ?? 0);

  let applyBlockedReason: string | null = null;
  if (pending) applyBlockedReason = "A flash-loan application is already pending review.";
  else if (outstanding) applyBlockedReason = "An outstanding flash loan must be recovered first.";

  let approveBlockedReason: string | null = null;
  if (outstanding) approveBlockedReason = "An outstanding flash loan is already on this desk.";
  else if (cooling.active && cooling.until) {
    approveBlockedReason = `Cooling period until ${zonedDateKey(cooling.until)} (recovery + ${flashLoan.coolingMonths} months).`;
  }

  return {
    pendingApplication: pending
      ? {
          id: pending.id,
          requested: asNumber(pending.requested),
          createdAt: pending.createdAt,
          note: pending.note,
        }
      : null,
    outstanding,
    lastRecovered,
    coolingUntil: cooling.until,
    coolingActive: cooling.active,
    coolingDaysLeft: cooling.daysLeft,
    canApply: !applyBlockedReason,
    canActivateLoan: Boolean(outstanding && !outstanding.packageActivationId),
    applyBlockedReason,
    approveBlockedReason,
    networkAvailable,
    networkIsLiability: networkAvailable < 0 || Boolean(outstanding && outstanding.remaining > 0),
  };
}

export async function applyForFlashLoan(input: {
  userId: string;
  amount: number;
  note?: string;
}) {
  const cfg = packages[0];
  if (!Number.isFinite(input.amount) || input.amount < flashLoan.minAmountUsd) {
    throw new Error(`Request at least $${flashLoan.minAmountUsd}.`);
  }
  if (input.amount > flashLoan.maxAmountUsd) {
    throw new Error(`Request at most $${flashLoan.maxAmountUsd.toLocaleString()}.`);
  }

  const snap = await getLoanDeskSnapshot(input.userId);
  if (!snap.canApply && snap.applyBlockedReason) {
    throw new Error(snap.applyBlockedReason);
  }

  return prisma.flashLoanApplication.create({
    data: {
      userId: input.userId,
      requested: dec(input.amount.toFixed(2)),
      status: "PENDING",
      note: input.note?.trim() || `Flash loan request for package from $${cfg.minAmountUsd}`,
    },
  });
}

async function assertCanApproveLoan(userId: string, db: DbClient, now = new Date()) {
  const outstanding = await getOutstandingLoan(userId, db);
  if (outstanding) {
    throw new Error("An outstanding flash loan is already on this desk.");
  }
  const recovered = await getLatestRecoveredLoan(userId, db);
  const cooling = coolingGate(recovered, now);
  if (cooling.active && cooling.until) {
    throw new Error(
      `Cooling period until ${zonedDateKey(cooling.until)} (recovery + ${flashLoan.coolingMonths} months).`,
    );
  }
}

export async function rejectFlashLoanApplication(input: {
  applicationId: string;
  actorId: string;
  note?: string;
}) {
  const reviewedAt = new Date();
  const claimed = await prisma.flashLoanApplication.updateMany({
    where: { id: input.applicationId, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewedAt,
      reviewedBy: input.actorId,
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    },
  });
  if (claimed.count !== 1) {
    const existing = await prisma.flashLoanApplication.findUnique({
      where: { id: input.applicationId },
    });
    if (!existing) throw new Error("Application not found.");
    throw new Error("This application has already been reviewed.");
  }
  return prisma.flashLoanApplication.findUniqueOrThrow({ where: { id: input.applicationId } });
}

/**
 * Approve any amount between the Pro minimum and the requested figure.
 * Claims the PENDING row inside the same transaction as the FlashLoan + Network debit
 * so concurrent approve/reject cannot double-book or leave a REJECTED row with a loan.
 */
export async function approveFlashLoanApplication(input: {
  applicationId: string;
  actorId: string;
  amount: number;
  note?: string;
}) {
  if (!Number.isFinite(input.amount) || input.amount < flashLoan.minAmountUsd) {
    throw new Error(`Approved amount must be at least $${flashLoan.minAmountUsd}.`);
  }
  if (input.amount > flashLoan.maxAmountUsd) {
    throw new Error(`Approved amount must be at most $${flashLoan.maxAmountUsd.toLocaleString()}.`);
  }

  const approved = Number(input.amount.toFixed(2));
  const reviewedAt = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const application = await tx.flashLoanApplication.findUnique({
        where: { id: input.applicationId },
      });
      if (!application) throw new Error("Application not found.");

      const requested = asNumber(application.requested);
      if (approved - requested > 0.0001) {
        throw new Error(`Approved amount cannot exceed the requested ${requested.toFixed(2)}.`);
      }

      await assertCanApproveLoan(application.userId, tx, reviewedAt);

      const claimed = await tx.flashLoanApplication.updateMany({
        where: { id: application.id, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedAt,
          reviewedBy: input.actorId,
          note: input.note?.trim() || application.note,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("This application has already been reviewed.");
      }

      const loan = await tx.flashLoan.create({
        data: {
          userId: application.userId,
          applicationId: application.id,
          requested: application.requested,
          approved: dec(approved),
          principal: dec(approved),
          repaid: 0,
          status: "OUTSTANDING",
          openDeskKey: application.userId,
        },
      });

      await debitAvailable({
        userId: application.userId,
        type: "NETWORK",
        amount: approved,
        category: "LOAN",
        description: `Flash loan liability ${approved.toFixed(2)} — Network vault`,
        refId: loan.id,
        allowNegative: true,
        db: tx,
      });

      const updated = await tx.flashLoanApplication.findUniqueOrThrow({
        where: { id: application.id },
      });
      return { application: updated, loan };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("An outstanding flash loan is already on this desk.");
    }
    throw error;
  }
}

export function roiStartsOnAfterRecovery(recoveredAt: Date) {
  return addZonedCalendarDays(recoveredAt, 1);
}

export function coolingUntilAfterRecovery(recoveredAt: Date) {
  return addZonedMonths(recoveredAt, flashLoan.coolingMonths);
}

/**
 * Apply a Network-wallet reward credit to the outstanding loan book.
 * Wallet credit already happened; this advances `repaid` and, on full
 * recovery, schedules ROI for the next Asia/Dubai calendar day.
 */
export async function applyNetworkCreditToLoan(
  userId: string,
  creditAmount: Prisma.Decimal | string | number,
  when: Date,
  db: DbClient = prisma,
) {
  const amount = asNumber(creditAmount);
  if (amount <= 0) return null;

  const loan = await getOutstandingLoan(userId, db);
  if (!loan) return null;

  const remaining = remainingPrincipal(loan);
  if (remaining <= 0) return null;

  const applied = Math.min(amount, remaining);
  const nextRepaid = asNumber(loan.repaid) + applied;
  const fullyRecovered = nextRepaid + 0.0001 >= asNumber(loan.principal);

  if (fullyRecovered) {
    const recoveredAt = when;
    const coolingUntil = coolingUntilAfterRecovery(recoveredAt);
    const roiStartsOn = roiStartsOnAfterRecovery(recoveredAt);

    await db.flashLoan.update({
      where: { id: loan.id },
      data: {
        repaid: dec(asNumber(loan.principal).toFixed(4)),
        status: "RECOVERED",
        recoveredAt,
        coolingUntil,
        openDeskKey: null,
      },
    });

    await db.packageActivation.updateMany({
      where: { flashLoanId: loan.id },
      data: { roiStartsOn },
    });

    return {
      loanId: loan.id,
      applied,
      remaining: 0,
      recovered: true,
      roiStartsOn,
      coolingUntil,
    };
  }

  await db.flashLoan.update({
    where: { id: loan.id },
    data: { repaid: dec(nextRepaid.toFixed(4)) },
  });

  return {
    loanId: loan.id,
    applied,
    remaining: remaining - applied,
    recovered: false,
    roiStartsOn: null as Date | null,
    coolingUntil: null as Date | null,
  };
}

export function isLoanPackageRoiPaused(input: {
  fundingSource: string;
  roiStartsOn: Date | null;
  loanStatus?: string | null;
  remaining?: number;
  dateKey: string;
}) {
  if (input.fundingSource === "LOAN") {
    const outstanding =
      input.loanStatus === "OUTSTANDING" || (input.remaining !== undefined && input.remaining > 0);
    if (outstanding) return { paused: true, reason: "loan" as const };
  }
  if (input.roiStartsOn && input.dateKey < zonedDateKey(input.roiStartsOn)) {
    return { paused: true, reason: "hold" as const };
  }
  return { paused: false, reason: null };
}
