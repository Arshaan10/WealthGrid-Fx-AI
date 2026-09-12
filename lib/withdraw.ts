import { Prisma } from "@prisma/client";
import { withdrawal } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { debitTreasury, getOrCreateTreasury } from "@/lib/treasury";
import { formatUsd } from "@/lib/utils";
import type { WalletType } from "@/lib/wallets";

export function quoteWithdrawal(amount: Prisma.Decimal | string | number) {
  const gross = new Prisma.Decimal(amount).toDecimalPlaces(2);
  const fee = gross.mul(withdrawal.feePct).div(100).toDecimalPlaces(2);
  const net = gross.minus(fee);
  return { gross, fee, net, feePct: withdrawal.feePct };
}

export async function executeAutoWithdrawal(input: {
  userId: string;
  type: WalletType;
  amount: number;
  toAddress?: string | null;
  note?: string;
}) {
  const quote = quoteWithdrawal(input.amount);
  if (quote.gross.lte(0)) {
    throw new Error("Enter a valid amount.");
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.walletBalance.upsert({
      where: { userId_type: { userId: input.userId, type: input.type } },
      update: {},
      create: { userId: input.userId, type: input.type, available: 0, pending: 0 },
    });

    const available = new Prisma.Decimal(wallet.available);
    if (available.lt(quote.gross)) {
      throw new Error("Insufficient available balance");
    }

    const treasury = await getOrCreateTreasury(tx);
    const pool = new Prisma.Decimal(treasury.balance);
    if (pool.lt(quote.net)) {
      throw new Error(
        `Insufficient treasury funds. The payout pool has ${formatUsd(pool)} but this withdrawal needs ${formatUsd(quote.net)} after the ${quote.feePct}% fee.`,
      );
    }

    const nextAvailable = available.minus(quote.gross);

    const requestRow = await tx.withdrawalRequest.create({
      data: {
        userId: input.userId,
        amount: quote.gross,
        feeAmount: quote.fee,
        netAmount: quote.net,
        walletType: input.type,
        toAddress: input.toAddress || null,
        note: input.note ?? "Auto-approved — settled from company treasury",
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    });

    await tx.walletBalance.update({
      where: { id: wallet.id },
      data: { available: nextAvailable },
    });

    await tx.ledgerEntry.create({
      data: {
        userId: input.userId,
        walletType: input.type,
        direction: "DEBIT",
        category: "WITHDRAWAL",
        amount: quote.gross,
        balanceAfter: nextAvailable,
        description: `Withdrawal auto-approved ${requestRow.id} (fee ${formatUsd(quote.fee)}, net ${formatUsd(quote.net)})`,
        refId: requestRow.id,
      },
    });

    await debitTreasury({
      db: tx,
      amount: quote.net,
      category: "PAYOUT",
      description: `Member withdrawal ${requestRow.id}`,
      refId: requestRow.id,
      actorId: input.userId,
    });

    if (input.toAddress) {
      await tx.user.update({
        where: { id: input.userId },
        data: { walletAddress: input.toAddress },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.userId,
        action: "WITHDRAWAL_AUTO_APPROVED",
        entity: "WithdrawalRequest",
        entityId: requestRow.id,
        meta: JSON.stringify({
          amount: quote.gross.toString(),
          fee: quote.fee.toString(),
          net: quote.net.toString(),
          walletType: input.type,
          toAddress: input.toAddress ?? null,
        }),
      },
    });

    return {
      id: requestRow.id,
      amount: quote.gross.toNumber(),
      fee: quote.fee.toNumber(),
      net: quote.net.toNumber(),
      feePct: quote.feePct,
    };
  });
}
