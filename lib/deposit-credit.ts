import { Prisma } from "@prisma/client";
import { isEvmAddress, isTxHash } from "@/lib/address";
import { getRequiredConfirmations, isWatchConfigured } from "@/lib/chain";
import { findRecentUsdtTransfers, getTxConfirmations, verifyUsdtDepositTx } from "@/lib/onchain";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/utils";
import { creditWallet, type WalletType } from "@/lib/wallets";

function amountsMatch(stated: Prisma.Decimal, onChain: string) {
  const chain = new Prisma.Decimal(onChain).toDecimalPlaces(2);
  return stated.toDecimalPlaces(2).eq(chain);
}

async function creditApprovedDeposit(input: {
  id: string;
  userId: string;
  walletType: WalletType;
  amount: Prisma.Decimal;
  txHash: string;
  confirmations: number;
  fromAddress?: string | null;
}) {
  const existing = await prisma.depositIntent.findUnique({ where: { id: input.id } });
  if (!existing || existing.status === "APPROVED") {
    return existing;
  }

  const claimed = await prisma.depositIntent.updateMany({
    where: { id: input.id, status: { in: ["PENDING", "CONFIRMING"] } },
    data: {
      status: "APPROVED",
      txHint: input.txHash,
      fromAddress: input.fromAddress ?? existing.fromAddress,
      confirmations: input.confirmations,
      requiredConfs: getRequiredConfirmations(),
      reviewedAt: new Date(),
      reviewedBy: "chain-confirm",
      note: `Confirmed on-chain USDT deposit ${input.txHash} (${input.confirmations} confirmations)`,
    },
  });
  if (claimed.count === 0) {
    return prisma.depositIntent.findUnique({ where: { id: input.id } });
  }
  const updated = await prisma.depositIntent.findUnique({ where: { id: input.id } });
  if (!updated) return existing;

  await creditWallet({
    userId: input.userId,
    type: input.walletType,
    amount: input.amount,
    category: "DEPOSIT",
    description: `Confirmed on-chain USDT deposit ${input.txHash}`,
    refId: updated.id,
  });
  await prisma.auditLog.create({
    data: {
      actorId: input.userId,
      action: "DEPOSIT_AUTO_APPROVED",
      entity: "DepositIntent",
      entityId: updated.id,
      meta: JSON.stringify({
        txHash: input.txHash,
        amount: input.amount.toString(),
        confirmations: input.confirmations,
      }),
    },
  });
  return updated;
}

export async function inspectDepositTx(txHash: string, statedAmount: Prisma.Decimal) {
  const verified = await verifyUsdtDepositTx(txHash);
  const progress = await getTxConfirmations(txHash);
  return {
    verified,
    progress,
    amountMatches: amountsMatch(statedAmount, verified.amount),
  };
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
  const requiredConfs = getRequiredConfirmations();

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
        const settled = reused.status === "CONFIRMING" || reused.status === "PENDING"
          ? await settleDepositById(reused.id)
          : reused;
        return {
          intent: settled ?? reused,
          verified: (settled ?? reused).status === "APPROVED",
          reused: true,
        };
      }
      throw new Error("That transaction hash is already attached to another deposit.");
    }
  }

  let note = input.note?.trim() || "";
  let status: "PENDING" | "CONFIRMING" | "APPROVED" = "PENDING";
  let verifiedFrom: string | null = null;
  let verifyError: string | null = null;
  let confirmations = 0;

  if (txHash && isWatchConfigured()) {
    try {
      const inspected = await inspectDepositTx(txHash, amount);
      verifiedFrom = inspected.verified.from;
      confirmations = inspected.progress.confirmations;
      if (!inspected.amountMatches) {
        note = [
          note,
          `On-chain USDT ${formatUsd(inspected.verified.amount)} does not match stated ${formatUsd(amount)}. Waiting for a matching transfer.`,
        ]
          .filter(Boolean)
          .join(" ");
      } else if (inspected.progress.confirmed) {
        status = "APPROVED";
        note = `Confirmed on-chain USDT deposit ${txHash} (${confirmations} confirmations)`;
      } else {
        status = "CONFIRMING";
        note = `Watching chain — ${confirmations}/${inspected.progress.required} confirmations for ${txHash}`;
      }
    } catch (error) {
      verifyError = error instanceof Error ? error.message : "Could not verify transaction";
      status = "CONFIRMING";
      note = [note, `Tx recorded — waiting for chain confirmations. ${verifyError}`]
        .filter(Boolean)
        .join(" ");
    }
  } else if (txHash) {
    status = "CONFIRMING";
    note = note || "Tx hash recorded. Chain watch will auto-credit after confirmations once RPC + USDT env are set.";
  } else {
    note =
      note ||
      "Deposit intent recorded. Send USDT to the company address — the desk auto-credits after on-chain confirmations.";
  }

  const intent = await prisma.depositIntent.create({
    data: {
      userId: input.userId,
      amount,
      walletType: input.walletType,
      txHint: txHash,
      fromAddress: verifiedFrom ?? fromAddress,
      confirmations,
      requiredConfs,
      note,
      status,
      reviewedAt: status === "APPROVED" ? new Date() : null,
      reviewedBy: status === "APPROVED" ? "chain-confirm" : null,
    },
  });

  if (status === "APPROVED" && txHash) {
    await creditWallet({
      userId: input.userId,
      type: input.walletType,
      amount,
      category: "DEPOSIT",
      description: `Confirmed on-chain USDT deposit ${txHash}`,
      refId: intent.id,
    });
    await prisma.auditLog.create({
      data: {
        actorId: input.userId,
        action: "DEPOSIT_AUTO_APPROVED",
        entity: "DepositIntent",
        entityId: intent.id,
        meta: JSON.stringify({ txHash, amount: amount.toString(), confirmations }),
      },
    });
  } else {
    await prisma.auditLog.create({
      data: {
        actorId: input.userId,
        action: status === "CONFIRMING" ? "DEPOSIT_CONFIRMING" : "DEPOSIT_INTENT",
        entity: "DepositIntent",
        entityId: intent.id,
        meta: JSON.stringify({
          amount: amount.toString(),
          walletType: input.walletType,
          txHash,
          verifyError,
          confirmations,
        }),
      },
    });
  }

  return {
    intent,
    verified: status === "APPROVED",
    reused: false,
    verifyError,
    confirmations,
    requiredConfirmations: requiredConfs,
  };
}

export async function settleDepositById(id: string) {
  const row = await prisma.depositIntent.findUnique({ where: { id } });
  if (!row || row.status === "APPROVED" || row.status === "REJECTED") {
    return row;
  }
  if (!isWatchConfigured()) {
    return row;
  }

  const amount = new Prisma.Decimal(row.amount);
  let txHash = isTxHash(row.txHint) ? row.txHint : null;

  if (!txHash && row.fromAddress && isEvmAddress(row.fromAddress)) {
    try {
      const recent = await findRecentUsdtTransfers(row.fromAddress);
      const match = recent.find((item) => amountsMatch(amount, item.amount));
      if (match) txHash = match.txHash;
    } catch {
      return row;
    }
  }
  if (!txHash) return row;

  try {
    const inspected = await inspectDepositTx(txHash, amount);
    if (!inspected.amountMatches) {
      return prisma.depositIntent.update({
        where: { id: row.id },
        data: {
          txHint: txHash,
          confirmations: inspected.progress.confirmations,
          requiredConfs: inspected.progress.required,
          note: `On-chain USDT ${formatUsd(inspected.verified.amount)} does not match stated ${formatUsd(amount)}.`,
        },
      });
    }

    await prisma.depositIntent.update({
      where: { id: row.id },
      data: {
        status: inspected.progress.confirmed ? row.status : "CONFIRMING",
        txHint: txHash,
        fromAddress: inspected.verified.from,
        confirmations: inspected.progress.confirmations,
        requiredConfs: inspected.progress.required,
        note: inspected.progress.confirmed
          ? row.note
          : `Watching chain — ${inspected.progress.confirmations}/${inspected.progress.required} confirmations`,
      },
    });

    if (!inspected.progress.confirmed) {
      return prisma.depositIntent.findUnique({ where: { id: row.id } });
    }

    return creditApprovedDeposit({
      id: row.id,
      userId: row.userId,
      walletType: row.walletType as WalletType,
      amount,
      txHash,
      confirmations: inspected.progress.confirmations,
      fromAddress: inspected.verified.from,
    });
  } catch {
    return row;
  }
}

export async function settleDepositsForUser(userId: string) {
  const open = await prisma.depositIntent.findMany({
    where: { userId, status: { in: ["PENDING", "CONFIRMING"] } },
  });
  const settled: string[] = [];
  for (const row of open) {
    const next = await settleDepositById(row.id);
    if (next?.status === "APPROVED" && row.status !== "APPROVED") {
      settled.push(row.id);
    }
  }
  return settled;
}
