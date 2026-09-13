import { Prisma } from "@prisma/client";
import { boosterTierBySlug, packages, referrals, type BoosterTier, type FundingSource } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { creditCappedReward } from "@/lib/rewards";
import type { DbClient } from "@/lib/treasury";
import { asNumber } from "@/lib/utils";
import { debitAvailable } from "@/lib/wallets";

export type ActivatePackageInput = {
  userId: string;
  amount: number;
  fundingSource: FundingSource;
  boosterTier?: BoosterTier;
  flashLoanId?: string | null;
  actorId?: string | null;
};

async function bumpPersonalVolume(userId: string, amount: number, db: DbClient) {
  const current = await db.rankProgress.findUnique({ where: { userId } });
  await db.rankProgress.upsert({
    where: { userId },
    update: {
      personalVolume: new Prisma.Decimal(current?.personalVolume ?? 0).plus(amount),
    },
    create: {
      userId,
      personalVolume: amount,
      currentRank: "NONE",
    },
  });
}

/**
 * Create a PackageActivation. SELF debits Trading. LOAN / ADMIN do not debit
 * the Trading wallet (loan liability is booked on approve; admin is a grant).
 */
export async function activatePackage(input: ActivatePackageInput) {
  const cfg = packages[0];
  if (!Number.isFinite(input.amount) || input.amount < cfg.minAmountUsd) {
    throw new Error(`Pro activates from $${cfg.minAmountUsd}.`);
  }

  const pack = await prisma.package.findUnique({ where: { slug: cfg.slug } });
  if (!pack?.active) {
    throw new Error("Pro package is not available.");
  }

  const boosterTier =
    input.fundingSource === "SELF" ? boosterTierBySlug(input.boosterTier ?? "NONE") : "NONE";

  const amount = Number(input.amount.toFixed(2));

  const activation = await prisma.$transaction(async (tx) => {
    if (input.fundingSource === "LOAN") {
      if (!input.flashLoanId) throw new Error("Flash loan is required for loan-funded activation.");
      const loan = await tx.flashLoan.findUnique({
        where: { id: input.flashLoanId },
        include: { activation: true },
      });
      if (!loan || loan.userId !== input.userId) throw new Error("Flash loan not found on this desk.");
      if (loan.status !== "OUTSTANDING") throw new Error("This flash loan is not available to activate.");
      if (loan.activation) throw new Error("This flash loan already funds a package.");
      const approved = asNumber(loan.approved);
      if (Math.abs(approved - amount) > 0.01) {
        throw new Error(`Loan-funded activation must use the approved amount ($${approved.toFixed(2)}).`);
      }
    }

    const row = await tx.packageActivation.create({
      data: {
        userId: input.userId,
        packageId: pack.id,
        amount,
        status: "ACTIVE",
        fundingSource: input.fundingSource,
        boosterTier,
        flashLoanId: input.fundingSource === "LOAN" ? input.flashLoanId : null,
      },
    });

    if (input.fundingSource === "SELF") {
      await debitAvailable({
        userId: input.userId,
        type: "TRADING",
        amount,
        category: "PACKAGE",
        description: `Activated ${pack.name} $${amount} (${boosterTier})`,
        refId: row.id,
        db: tx,
      });
    }

    await bumpPersonalVolume(input.userId, amount, tx);
    return row;
  });

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { name: true, referredById: true },
  });

  if (user?.referredById) {
    const bonus = new Prisma.Decimal(amount).mul(referrals.directPct).div(100);
    await creditCappedReward({
      userId: user.referredById,
      type: "DIRECT",
      amount: bonus,
      note: `${referrals.directPct}% direct on ${user.name} activation → Network wallet`,
      periodKey: `DIRECT:${activation.id}`,
    });
  }

  return activation;
}
