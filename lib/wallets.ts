import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "@/lib/treasury";
import { asNumber } from "@/lib/utils";

export type WalletType = "TRADING" | "NETWORK";

export async function getWalletSnapshot(userId: string) {
  const wallets = await prisma.walletBalance.findMany({ where: { userId } });
  const trading = wallets.find((row) => row.type === "TRADING");
  const network = wallets.find((row) => row.type === "NETWORK");
  return {
    trading: {
      available: asNumber(trading?.available ?? 0),
      pending: asNumber(trading?.pending ?? 0),
    },
    network: {
      available: asNumber(network?.available ?? 0),
      pending: asNumber(network?.pending ?? 0),
    },
  };
}

export async function getOrCreateWallet(userId: string, type: WalletType, db: DbClient = prisma) {
  return db.walletBalance.upsert({
    where: { userId_type: { userId, type } },
    update: {},
    create: { userId, type, available: 0, pending: 0 },
  });
}

export async function creditWallet(input: {
  userId: string;
  type: WalletType;
  amount: Prisma.Decimal | string | number;
  category: string;
  description: string;
  refId?: string;
}) {
  const amount = new Prisma.Decimal(input.amount);
  const wallet = await getOrCreateWallet(input.userId, input.type);
  const next = new Prisma.Decimal(wallet.available).plus(amount);

  await prisma.walletBalance.update({
    where: { id: wallet.id },
    data: { available: next },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: input.userId,
      walletType: input.type,
      direction: "CREDIT",
      category: input.category,
      amount,
      balanceAfter: next,
      description: input.description,
      refId: input.refId,
    },
  });

  return next;
}

export async function debitAvailable(input: {
  userId: string;
  type: WalletType;
  amount: Prisma.Decimal | string | number;
  category: string;
  description: string;
  refId?: string;
}) {
  const amount = new Prisma.Decimal(input.amount);
  const wallet = await getOrCreateWallet(input.userId, input.type);
  const available = new Prisma.Decimal(wallet.available);
  if (available.lessThan(amount)) {
    throw new Error("Insufficient available balance");
  }
  const next = available.minus(amount);

  await prisma.walletBalance.update({
    where: { id: wallet.id },
    data: { available: next },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: input.userId,
      walletType: input.type,
      direction: "DEBIT",
      category: input.category,
      amount,
      balanceAfter: next,
      description: input.description,
      refId: input.refId,
    },
  });

  return next;
}

export async function reserveForWithdrawal(input: {
  userId: string;
  type: WalletType;
  amount: Prisma.Decimal | string | number;
  description: string;
  refId?: string;
}) {
  const amount = new Prisma.Decimal(input.amount);
  const wallet = await getOrCreateWallet(input.userId, input.type);
  const available = new Prisma.Decimal(wallet.available);
  if (available.lessThan(amount)) {
    throw new Error("Insufficient available balance");
  }
  const nextAvailable = available.minus(amount);
  const nextPending = new Prisma.Decimal(wallet.pending).plus(amount);

  await prisma.walletBalance.update({
    where: { id: wallet.id },
    data: { available: nextAvailable, pending: nextPending },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: input.userId,
      walletType: input.type,
      direction: "DEBIT",
      category: "WITHDRAWAL",
      amount,
      balanceAfter: nextAvailable,
      description: input.description,
      refId: input.refId,
    },
  });
}

export async function releaseReservation(input: {
  userId: string;
  type: WalletType;
  amount: Prisma.Decimal | string | number;
  restoreAvailable: boolean;
  db?: DbClient;
}) {
  const db = input.db ?? prisma;
  const amount = new Prisma.Decimal(input.amount);
  const wallet = await getOrCreateWallet(input.userId, input.type, db);
  const pending = new Prisma.Decimal(wallet.pending);
  const nextPending = pending.minus(amount);
  const nextAvailable = input.restoreAvailable
    ? new Prisma.Decimal(wallet.available).plus(amount)
    : new Prisma.Decimal(wallet.available);

  await db.walletBalance.update({
    where: { id: wallet.id },
    data: {
      pending: nextPending.lessThan(0) ? 0 : nextPending,
      available: nextAvailable,
    },
  });

  if (input.restoreAvailable) {
    await db.ledgerEntry.create({
      data: {
        userId: input.userId,
        walletType: input.type,
        direction: "CREDIT",
        category: "ADJUSTMENT",
        amount,
        balanceAfter: nextAvailable,
        description: "Withdrawal rejected — funds restored",
      },
    });
  }
}
