import { settleDepositsForUser } from "@/lib/deposit-credit";
import { settlePayoutsForUser } from "@/lib/payout";
import { prisma } from "@/lib/prisma";
import { getWalletSnapshot } from "@/lib/wallets";

export async function syncOnchainDesk(userId: string) {
  const [credited, confirmed] = await Promise.all([
    settleDepositsForUser(userId),
    settlePayoutsForUser(userId),
  ]);
  const [wallets, ledger] = await Promise.all([
    getWalletSnapshot(userId),
    prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  return {
    creditedDeposits: credited,
    confirmedPayouts: confirmed,
    wallets,
    ledger: ledger.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      walletType: row.walletType,
      direction: row.direction,
      category: row.category,
      amount: row.amount.toString(),
      description: row.description,
    })),
  };
}
