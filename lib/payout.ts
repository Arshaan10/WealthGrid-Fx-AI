import { createPublicClient, createWalletClient, erc20Abi, http, parseUnits, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isEvmAddress, isPrivateKeyHex, isTxHash, normalizeAddress, normalizePrivateKey } from "@/lib/address";
import {
  getChainId,
  getCompanyWalletAddress,
  getRpcUrl,
  getUsdtAddress,
  getUsdtDecimals,
  isPayoutConfigured,
} from "@/lib/chain";
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
  if (existing.status === "SENT" && isTxHash(existing.txHash)) {
    return {
      status: "SENT",
      txHash: existing.txHash,
      sendConfigured: true,
      sendError: null,
      message: "Already sent on-chain.",
    };
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
    if (latest?.status === "SENT" && latest.txHash) {
      return {
        status: "SENT",
        txHash: latest.txHash,
        sendConfigured: true,
        sendError: null,
        message: "Already sent on-chain.",
      };
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
    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "SENT",
        txHash,
        sentAt: new Date(),
        sendError: null,
        note: row.note?.includes("on-chain")
          ? row.note
          : `${row.note ?? "Auto-approved — settled from company treasury"} · sent on-chain`,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "WITHDRAWAL_SENT",
        entity: "WithdrawalRequest",
        entityId: withdrawalId,
        meta: JSON.stringify({ txHash, net: row.netAmount.toString() }),
      },
    });
    return {
      status: updated.status,
      txHash: updated.txHash,
      sendConfigured: true,
      sendError: null,
      message: `On-chain USDT sent. Tx ${txHash}`,
    };
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

  const chainId = getChainId();
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
    throw new Error(`RPC chain ${onChainId} does not match configured CHAIN_ID ${chainId}.`);
  }
  if (balance < amount) {
    throw new Error(
      `Company hot wallet has insufficient USDT to send ${formatUsd(netAmount)}. Fund ${company} on-chain, then retry.`,
    );
  }

  return walletClient.writeContract({
    chain: { id: chainId, name: "configured", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } },
    account,
    address: token as Address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [normalizeAddress(toAddress) as Address, amount],
  });
}
