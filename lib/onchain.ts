import {
  createPublicClient,
  decodeEventLog,
  erc20Abi,
  formatUnits,
  http,
  parseAbiItem,
  type Address,
  type Hash,
} from "viem";
import { addressesEqual, isEvmAddress, isTxHash, normalizeAddress } from "@/lib/address";
import {
  assertBscNetwork,
  getCompanyWalletAddress,
  getRequiredConfirmations,
  getRpcUrl,
  getUsdtAddress,
  getUsdtDecimals,
} from "@/lib/chain";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export type VerifiedTransfer = {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
};

function requireWatchConfig() {
  const rpcUrl = getRpcUrl();
  const token = getUsdtAddress();
  const company = getCompanyWalletAddress();
  if (!rpcUrl || !isEvmAddress(token) || !isEvmAddress(company)) {
    throw new Error(
      "Public RPC, USDT contract, and company wallet address are required to watch the chain.",
    );
  }
  return {
    rpcUrl,
    token: normalizeAddress(token) as Address,
    company: normalizeAddress(company) as Address,
    decimals: getUsdtDecimals(),
  };
}

export function getRpcClient() {
  assertBscNetwork();
  const rpcUrl = getRpcUrl();
  if (!rpcUrl) {
    throw new Error("RPC_URL is required to read the BNB Smart Chain.");
  }
  return createPublicClient({
    transport: http(rpcUrl),
  });
}

export function getPublicRpcClient() {
  return getRpcClient();
}

export async function getTxConfirmations(txHash: string) {
  if (!isTxHash(txHash)) {
    throw new Error("Enter a valid transaction hash.");
  }
  const client = getRpcClient();
  const receipt = await client.getTransactionReceipt({ hash: normalizeAddress(txHash) as Hash });
  const latest = await client.getBlockNumber();
  const confirmations = Number(latest - receipt.blockNumber) + 1;
  const required = getRequiredConfirmations();
  return {
    found: true as const,
    confirmations: Number.isFinite(confirmations) ? Math.max(confirmations, 0) : 0,
    required,
    confirmed: receipt.status === "success" && confirmations >= required,
    status: receipt.status,
    blockNumber: Number(receipt.blockNumber),
  };
}

export async function verifyUsdtDepositTx(txHash: string): Promise<VerifiedTransfer> {
  if (!isTxHash(txHash)) {
    throw new Error("Enter a valid transaction hash.");
  }
  const { token, company, decimals } = requireWatchConfig();
  const client = getPublicRpcClient();
  const receipt = await client.getTransactionReceipt({ hash: normalizeAddress(txHash) as Hash });
  if (receipt.status !== "success") {
    throw new Error("That transaction did not succeed on-chain.");
  }

  const matches: { from: Address; to: Address; value: bigint }[] = [];
  for (const log of receipt.logs) {
    if (!addressesEqual(log.address, token)) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const args = decoded.args as { from: Address; to: Address; value: bigint };
      if (addressesEqual(args.to, company)) {
        matches.push(args);
      }
    } catch {
      // Ignore non-transfer logs on the token contract.
    }
  }

  if (matches.length === 0) {
    throw new Error(
      "No USDT BEP-20 transfer to the company deposit address was found in that transaction.",
    );
  }

  const total = matches.reduce((sum, row) => sum + row.value, BigInt(0));
  return {
    txHash: normalizeAddress(txHash),
    from: matches[0].from,
    to: company,
    amount: formatUnits(total, decimals),
    token,
  };
}

export async function findRecentUsdtTransfers(fromAddress: string, lookbackBlocks = 2000) {
  if (!isEvmAddress(fromAddress)) {
    throw new Error("Connect or enter a valid wallet address first.");
  }
  const { token, company } = requireWatchConfig();
  const client = getPublicRpcClient();
  const latest = await client.getBlockNumber();
  const fromBlock = latest > BigInt(lookbackBlocks) ? latest - BigInt(lookbackBlocks) : BigInt(0);

  const logs = await client.getLogs({
    address: token,
    event: transferEvent,
    args: {
      from: normalizeAddress(fromAddress) as Address,
      to: company,
    },
    fromBlock,
    toBlock: latest,
  });

  const decimals = getUsdtDecimals();
  return logs
    .filter((log) => log.transactionHash)
    .map((log) => ({
      txHash: log.transactionHash as string,
      from: (log.args.from as string) ?? fromAddress,
      to: (log.args.to as string) ?? company,
      amount: formatUnits(log.args.value ?? BigInt(0), decimals),
      token,
    }));
}

export async function readUsdtBalance(address: string) {
  const { token, decimals } = requireWatchConfig();
  if (!isEvmAddress(address)) return null;
  const client = getPublicRpcClient();
  const raw = await client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [normalizeAddress(address) as Address],
  });
  return formatUnits(raw, decimals);
}
