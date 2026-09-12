import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TREASURY_ID = "company";

export type DbClient = Prisma.TransactionClient | typeof prisma;

export async function getOrCreateTreasury(db: DbClient = prisma) {
  return db.treasury.upsert({
    where: { id: TREASURY_ID },
    update: {},
    create: { id: TREASURY_ID, balance: 0 },
  });
}

export async function creditTreasury(input: {
  amount: Prisma.Decimal | string | number;
  description: string;
  category?: string;
  refId?: string;
  actorId?: string | null;
  db?: DbClient;
}) {
  const db = input.db ?? prisma;
  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0)) {
    throw new Error("Top-up amount must be greater than zero.");
  }

  const treasury = await getOrCreateTreasury(db);
  const next = new Prisma.Decimal(treasury.balance).plus(amount);

  await db.treasury.update({
    where: { id: TREASURY_ID },
    data: { balance: next },
  });

  await db.treasuryMovement.create({
    data: {
      treasuryId: TREASURY_ID,
      direction: "CREDIT",
      category: input.category ?? "TOPUP",
      amount,
      balanceAfter: next,
      description: input.description,
      refId: input.refId,
      actorId: input.actorId ?? null,
    },
  });

  return next;
}

export async function debitTreasury(input: {
  amount: Prisma.Decimal | string | number;
  description: string;
  category?: string;
  refId?: string;
  actorId?: string | null;
  db?: DbClient;
}) {
  const db = input.db ?? prisma;
  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0)) {
    throw new Error("Payout amount must be greater than zero.");
  }

  const treasury = await getOrCreateTreasury(db);
  const available = new Prisma.Decimal(treasury.balance);
  if (available.lt(amount)) {
    throw new Error("Insufficient treasury funds to cover this payout.");
  }
  const next = available.minus(amount);

  await db.treasury.update({
    where: { id: TREASURY_ID },
    data: { balance: next },
  });

  await db.treasuryMovement.create({
    data: {
      treasuryId: TREASURY_ID,
      direction: "DEBIT",
      category: input.category ?? "PAYOUT",
      amount,
      balanceAfter: next,
      description: input.description,
      refId: input.refId,
      actorId: input.actorId ?? null,
    },
  });

  return next;
}
