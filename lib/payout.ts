import { createPublicClient, createWalletClient, erc20Abi, http, parseUnits, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isEvmAddress, isPrivateKeyHex, isTxHash, normalizeAddress, normalizePrivateKey } from "@/lib/address";
import {
  assertBscNetwork,
  getChainId,
  getCompanyWalletAddress,
  getRequiredConfirmations,
  getRpcUrl,
  getUsdtAddress,
  getUsdtDecimals,
  isPayoutConfigured,
} from "@/lib/chain";
import { getRpcClient, getTxConfirmations } from "@/lib/onchain";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/utils";

export type PayoutResult = {
  status: string;
  txHash: string | null;
  sendConfigured: boolean;
  sendError: string | null;
  message: string;
};

const SENDABLE = new Set(["APPROVED", "FAILED_SEND"]);

function payoutNotConfigured(status = "APPROVED"): PayoutResult {
  return {
    status,
    txHash: null,
    sendConfigured: false,
    sendError: null,
    message: "On-chain send not configured. The withdrawal is booked against the company treasury.",
  };
}

function getPayoutAccount() {
  const key = process.env.COMPANY_WALLET_PRIVATE_KEY ?? "";
  if (!isPrivateKeyHex(key)) {
    throw new Error("COMPANY_WALLET_PRIVATE_KEY is missing or invalid.");
  }
  return privateKeyToAccount(normalizePrivateKey(key) as `0x${string}`);
}

export async function attemptOnChainPayout(withdrawalId: string): Promise<PayoutResult> {
  const existing = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!existing) {
    throw new Error("Withdrawal not found.");
  }
  if ((existing.status === "SENT" || existing.status === "CONFIRMED") && isTxHash(existing.txHash)) {
    return {
      status: existing.status,
      txHash: existing.txHash,
      sendConfigured: true,
      sendError: null,
      message: "Already sent on-chain.",
    };
  }
  if (existing.status === "CONFIRMING" && isTxHash(existing.txHash)) {
    return settlePayoutById(existing.id);
  }
  if (!isPayoutConfigured()) {
    return payoutNotConfigured(existing.status);
  }
  if (!SENDABLE.has(existing.status) && existing.status !== "SENDING") {
    return {
      status: existing.status,
      txHash: existing.txHash,
      sendConfigured: true,
      sendError: existing.sendError,
      message: `Withdrawal is ${existing.status} and cannot be sent.`,
    };
  }

  const claimed = await prisma.withdrawalRequest.updateMany({
    where: {
      id: withdrawalId,
      txHash: null,
      status: { in: ["APPROVED", "FAILED_SEND"] },
    },
    data: {
      status: "SENDING",
      sendError: null,
    },
  });

  if (claimed.count === 0) {
    const latest = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
    if ((latest?.status === "SENT" || latest?.status === "CONFIRMED") && latest.txHash) {
      return {
        status: latest.status,
        txHash: latest.txHash,
        sendConfigured: true,
        sendError: null,
        message: "Already sent on-chain.",
      };
    }
    if (latest?.status === "CONFIRMING" && latest.txHash) {
      return settlePayoutById(latest.id);
    }
    if (latest?.status === "SENDING") {
      return {
        status: "SENDING",
        txHash: latest.txHash,
        sendConfigured: true,
        sendError: null,
        message: "An on-chain send is already in progress for this withdrawal.",
      };
    }
    return {
      status: latest?.status ?? existing.status,
      txHash: latest?.txHash ?? null,
      sendConfigured: true,
      sendError: latest?.sendError ?? "Could not claim this withdrawal for sending.",
      message: "Could not claim this withdrawal for sending.",
    };
  }

  const row = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!row) {
    throw new Error("Withdrawal not found.");
  }

  try {
    const txHash = await transferUsdt(row.toAddress, row.netAmount.toString());
    const requiredConfs = getRequiredConfirmations();
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "CONFIRMING",
        txHash,
        requiredConfs,
        sendError: null,
        note: row.note?.includes("on-chain")
          ? row.note
          : `${row.note ?? "Auto-approved — settled from company treasury"} · payout broadcast`,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "WITHDRAWAL_BROADCAST",
        entity: "WithdrawalRequest",
        entityId: withdrawalId,
        meta: JSON.stringify({ txHash, net: row.netAmount.toString() }),
      },
    });
    return settlePayoutById(withdrawalId);
  } catch (error) {
    const sendError = error instanceof Error ? error.message : "On-chain send failed";
    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "FAILED_SEND",
        sendError,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "WITHDRAWAL_FAILED_SEND",
        entity: "WithdrawalRequest",
        entityId: withdrawalId,
        meta: JSON.stringify({ sendError }),
      },
    });
    return {
      status: updated.status,
      txHash: updated.txHash,
      sendConfigured: true,
      sendError,
      message: sendError,
    };
  }
}

async function transferUsdt(toAddress: string | null, netAmount: string) {
  if (!isEvmAddress(toAddress)) {
    throw new Error("Member payout address is missing or invalid.");
  }

  const rpcUrl = getRpcUrl();
  const token = getUsdtAddress();
  const company = getCompanyWalletAddress();
  if (!rpcUrl || !isEvmAddress(token) || !isEvmAddress(company)) {
    throw new Error("On-chain send not configured.");
  }

  const account = getPayoutAccount();
  if (account.address.toLowerCase() !== company.toLowerCase()) {
    throw new Error(
      "COMPANY_WALLET_PRIVATE_KEY does not match COMPANY_WALLET_ADDRESS. Fund and send from the same hot wallet.",
    );
  }

  const amount = parseUnits(netAmount, getUsdtDecimals());
  if (amount <= BigInt(0)) {
    throw new Error("Net payout amount must be greater than zero.");
  }

  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ transport });
  const walletClient = createWalletClient({
    account,
    transport,
  });

  const chainId = assertBscNetwork(getChainId());
  const [onChainId, balance] = await Promise.all([
    publicClient.getChainId(),
    publicClient.readContract({
      address: token as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    }),
  ]);

  if (onChainId !== chainId) {
    throw new Error(
      `RPC is not BNB Smart Chain BEP-20 (got ${onChainId}, expected ${chainId}). USDT deposits and payouts are BEP-20 only.`,
    );
  }
  if (balance < amount) {
    throw new Error(
      `Company hot wallet has insufficient USDT to send ${formatUsd(netAmount)}. Fund ${company} on-chain, then retry.`,
    );
  }

  const hash = await walletClient.writeContract({
    chain: { id: chainId, name: "configured", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } },
    account,
    address: token as Address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [normalizeAddress(toAddress) as Address, amount],
  });
  const publicWait = getRpcClient();
  await publicWait.waitForTransactionReceipt({ hash, timeout: 60_000 });
  return hash;
}

export async function settlePayoutById(withdrawalId: string): Promise<PayoutResult> {
  const row = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!row) {
    throw new Error("Withdrawal not found.");
  }
  if ((row.status === "SENT" || row.status === "CONFIRMED") && row.txHash) {
    return {
      status: row.status,
      txHash: row.txHash,
      sendConfigured: true,
      sendError: null,
      message: "Already confirmed on-chain.",
    };
  }
  if (!isTxHash(row.txHash)) {
    return {
      status: row.status,
      txHash: row.txHash,
      sendConfigured: isPayoutConfigured(),
      sendError: row.sendError,
      message: "No payout transaction to confirm yet.",
    };
  }

  try {
    const progress = await getTxConfirmations(row.txHash);
    if (!progress.confirmed) {
      const updated = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "CONFIRMING",
          confirmations: progress.confirmations,
          requiredConfs: progress.required,
        },
      });
      return {
        status: updated.status,
        txHash: updated.txHash,
        sendConfigured: true,
        sendError: null,
        message: `Payout broadcast. Waiting for ${progress.required} confirmations (${progress.confirmations} so far).`,
      };
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "CONFIRMED",
        confirmations: progress.confirmations,
        requiredConfs: progress.required,
        sentAt: row.sentAt ?? new Date(),
        sendError: null,
        note: `${row.note ?? "Auto-approved — settled from company treasury"} · confirmed on-chain`,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "WITHDRAWAL_CONFIRMED",
        entity: "WithdrawalRequest",
        entityId: withdrawalId,
        meta: JSON.stringify({ txHash: row.txHash, confirmations: progress.confirmations }),
      },
    });
    return {
      status: updated.status,
      txHash: updated.txHash,
      sendConfigured: true,
      sendError: null,
      message: `On-chain USDT confirmed after ${progress.confirmations} confirmations. Tx ${row.txHash}`,
    };
  } catch (error) {
    const sendError = error instanceof Error ? error.message : "Could not read payout confirmations";
    return {
      status: row.status,
      txHash: row.txHash,
      sendConfigured: true,
      sendError,
      message: sendError,
    };
  }
}

export async function settlePayoutsForUser(userId: string) {
  const open = await prisma.withdrawalRequest.findMany({
    where: { userId, status: "CONFIRMING", txHash: { not: null } },
  });
  const settled: string[] = [];
  for (const row of open) {
    const next = await settlePayoutById(row.id);
    if (next.status === "CONFIRMED" || next.status === "SENT") {
      settled.push(row.id);
    }
  }
  return settled;
}
