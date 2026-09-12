import { Prisma } from "@prisma/client";
import { isEvmAddress, isTxHash } from "@/lib/address";
import { isWatchConfigured } from "@/lib/chain";
import { findRecentUsdtTransfers, verifyUsdtDepositTx } from "@/lib/onchain";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/utils";
import { creditWallet, type WalletType } from "@/lib/wallets";

function amountsMatch(stated: Prisma.Decimal, onChain: string) {
  const chain = new Prisma.Decimal(onChain).toDecimalPlaces(2);
  return stated.toDecimalPlaces(2).eq(chain);
}

export async function recordDepositIntent(input: {
  userId: string;
  amount: number;
  walletType: WalletType;
  txHash?: string | null;
  fromAddress?: string | null;
  note?: string | null;
  watch?: boolean;
}) {
  const amount = new Prisma.Decimal(input.amount).toDecimalPlaces(2);
  const rawFrom = input.fromAddress?.trim() ?? "";
  const rawHash = input.txHash?.trim() ?? "";
  const fromAddress = isEvmAddress(rawFrom) ? rawFrom : null;
  if (rawHash && !isTxHash(rawHash)) {
    throw new Error("Enter a valid transaction hash (0x + 64 hex characters).");
  }
  let txHash: string | null = isTxHash(rawHash) ? rawHash : null;

  if (!txHash && input.watch && fromAddress && isWatchConfigured()) {
    const recent = await findRecentUsdtTransfers(fromAddress);
    const match = recent.find((row) => amountsMatch(amount, row.amount));
    if (match) {
      txHash = match.txHash;
    }
  }

  if (txHash) {
    const reused = await prisma.depositIntent.findFirst({
      where: { txHint: txHash, status: { not: "REJECTED" } },
    });
    if (reused) {
      if (reused.userId === input.userId) {
        return { intent: reused, verified: reused.status === "APPROVED", reused: true };
      }
      throw new Error("That transaction hash is already attached to another deposit.");
    }
  }

  let note = input.note?.trim() || "";
  let status: "PENDING" | "APPROVED" = "PENDING";
  let verifiedFrom: string | null = null;
  let verifyError: string | null = null;

  if (txHash && isWatchConfigured()) {
    try {
      const verified = await verifyUsdtDepositTx(txHash);
      verifiedFrom = verified.from;
      if (!amountsMatch(amount, verified.amount)) {
        note = [
          note,
          `On-chain USDT ${formatUsd(verified.amount)} does not match stated ${formatUsd(amount)}. Admin confirmation required.`,
        ]
          .filter(Boolean)
          .join(" ");
      } else {
        status = "APPROVED";
        note = note || `Verified on-chain USDT deposit ${txHash}`;
      }
    } catch (error) {
      verifyError = error instanceof Error ? error.message : "Could not verify transaction";
      note = [note, `Tx recorded for admin confirm — ${verifyError}`].filter(Boolean).join(" ");
    }
  } else if (txHash) {
    note = note || "Tx hash recorded for admin confirm. Chain watch is not configured.";
  } else {
    note =
      note ||
      "Deposit intent recorded. Send USDT to the company address and submit the transaction hash for confirmation.";
  }

  const intent = await prisma.depositIntent.create({
    data: {
      userId: input.userId,
      amount,
      walletType: input.walletType,
      txHint: txHash,
      fromAddress: verifiedFrom ?? fromAddress,
      note,
      status,
      reviewedAt: status === "APPROVED" ? new Date() : null,
      reviewedBy: status === "APPROVED" ? "chain-verify" : null,
    },
  });

  if (status === "APPROVED") {
    await creditWallet({
      userId: input.userId,
      type: input.walletType,
      amount,
      category: "DEPOSIT",
      description: `Verified on-chain USDT deposit ${txHash}`,
      refId: intent.id,
    });
    await prisma.auditLog.create({
      data: {
        actorId: input.userId,
        action: "DEPOSIT_AUTO_APPROVED",
        entity: "DepositIntent",
        entityId: intent.id,
        meta: JSON.stringify({ txHash, amount: amount.toString() }),
      },
    });
  } else {
    await prisma.auditLog.create({
      data: {
        actorId: input.userId,
        action: "DEPOSIT_INTENT",
        entity: "DepositIntent",
        entityId: intent.id,
        meta: JSON.stringify({
          amount: amount.toString(),
          walletType: input.walletType,
          txHash,
          verifyError,
        }),
      },
    });
  }

  return { intent, verified: status === "APPROVED", reused: false, verifyError };
}
