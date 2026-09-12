import { addressesEqual, isEvmAddress, isPrivateKeyHex } from "@/lib/address";

export const BSC_MAINNET_ID = 56;
export const BSC_TESTNET_ID = 97;

const RPC_BY_CHAIN: Record<number, string> = {
  [BSC_MAINNET_ID]: "https://bsc-dataseed.binance.org",
  [BSC_TESTNET_ID]: "https://bsc-testnet-rpc.publicnode.com",
};

const EXPLORER_BY_CHAIN: Record<number, string> = {
  [BSC_MAINNET_ID]: "https://bscscan.com",
  [BSC_TESTNET_ID]: "https://testnet.bscscan.com",
};

const USDT_BY_CHAIN: Record<number, string> = {
  // BEP-20 USDT on BSC mainnet (18 decimals)
  [BSC_MAINNET_ID]: "0x55d398326f99059fF775485246999027B3197955",
};

const NAME_BY_CHAIN: Record<number, string> = {
  [BSC_MAINNET_ID]: "BNB Smart Chain",
  [BSC_TESTNET_ID]: "BNB Smart Chain Testnet",
};

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function getChainId() {
  const raw = readEnv("NEXT_PUBLIC_CHAIN_ID", "CHAIN_ID") || String(BSC_TESTNET_ID);
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : BSC_TESTNET_ID;
}

export function getChainName(chainId = getChainId()) {
  return NAME_BY_CHAIN[chainId] ?? `Chain ${chainId}`;
}

export function getRpcUrl(chainId = getChainId()) {
  return readEnv("NEXT_PUBLIC_RPC_URL", "RPC_URL") || RPC_BY_CHAIN[chainId] || "";
}

export function getExplorerUrl(chainId = getChainId()) {
  return EXPLORER_BY_CHAIN[chainId] || `https://chainlist.org/chain/${chainId}`;
}

export function getExplorerTxUrl(txHash: string, chainId = getChainId()) {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, chainId = getChainId()) {
  return `${getExplorerUrl(chainId)}/address/${address}`;
}

export function getUsdtAddress(chainId = getChainId()) {
  const configured = readEnv("NEXT_PUBLIC_USDT_CONTRACT_ADDRESS", "USDT_CONTRACT_ADDRESS");
  if (isEvmAddress(configured)) return configured;
  return USDT_BY_CHAIN[chainId] || "";
}

export function getUsdtDecimals() {
  const raw = readEnv("USDT_DECIMALS", "NEXT_PUBLIC_USDT_DECIMALS") || "18";
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 36 ? parsed : 18;
}

export function getCompanyWalletAddress() {
  const configured = readEnv("NEXT_PUBLIC_COMPANY_WALLET_ADDRESS", "COMPANY_WALLET_ADDRESS");
  return isEvmAddress(configured) ? configured : "";
}

export function getWalletConnectProjectId() {
  return readEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "WALLETCONNECT_PROJECT_ID");
}

export function hasPayoutKeyConfigured() {
  return isPrivateKeyHex(process.env.COMPANY_WALLET_PRIVATE_KEY);
}

export function getRequiredConfirmations(chainId = getChainId()) {
  const raw = readEnv("CONFIRMATIONS_REQUIRED", "NEXT_PUBLIC_CONFIRMATIONS_REQUIRED");
  if (raw) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 1) return parsed;
  }
  return chainId === BSC_MAINNET_ID ? 15 : 3;
}

export function isWatchConfigured() {
  return Boolean(getRpcUrl() && getUsdtAddress() && getCompanyWalletAddress());
}

export function isPayoutConfigured() {
  return Boolean(
    hasPayoutKeyConfigured() && getRpcUrl() && getUsdtAddress() && getCompanyWalletAddress(),
  );
}

export type PublicChainConfig = {
  chainId: number;
  chainName: string;
  companyWalletAddress: string | null;
  usdtContractAddress: string | null;
  usdtDecimals: number;
  rpcUrl: string | null;
  walletConnectProjectId: string | null;
  explorerUrl: string;
  payoutConfigured: boolean;
  watchConfigured: boolean;
  requiredConfirmations: number;
};

export function getPublicChainConfig(): PublicChainConfig {
  const chainId = getChainId();
  const company = getCompanyWalletAddress();
  const usdt = getUsdtAddress(chainId);
  const rpc = getRpcUrl(chainId);
  const projectId = getWalletConnectProjectId();
  return {
    chainId,
    chainName: getChainName(chainId),
    companyWalletAddress: company || null,
    usdtContractAddress: usdt || null,
    usdtDecimals: getUsdtDecimals(),
    rpcUrl: rpc || null,
    walletConnectProjectId: projectId || null,
    explorerUrl: getExplorerUrl(chainId),
    payoutConfigured: isPayoutConfigured(),
    watchConfigured: isWatchConfigured(),
    requiredConfirmations: getRequiredConfirmations(chainId),
  };
}

export function payoutConfigNote() {
  if (isPayoutConfigured()) {
    return "On-chain USDT send is configured. Successful auto-withdrawals attempt a company hot-wallet transfer for the net amount.";
  }
  return "On-chain send is not configured. Withdrawals still auto-approve against the DB treasury. Set COMPANY_WALLET_PRIVATE_KEY, RPC_URL, USDT_CONTRACT_ADDRESS, and COMPANY_WALLET_ADDRESS to enable BEP-20/ERC-20 payouts.";
}

export function companyAddressMatches(address?: string | null) {
  return addressesEqual(address, getCompanyWalletAddress());
}
