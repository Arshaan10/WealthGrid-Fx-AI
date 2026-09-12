"use client";

import { useState } from "react";
import { erc20Abi, parseUnits, type Address } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { GoldButton } from "@/components/brand/GoldButton";
import { isEvmAddress } from "@/lib/address";
import type { PublicChainConfig } from "@/lib/chain";

export function SendUsdtButton({
  chain,
  amount,
  onSent,
}: {
  chain: PublicChainConfig;
  amount: string;
  onSent?: (txHash: string) => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const token = chain.usdtContractAddress;
  const company = chain.companyWalletAddress;
  const ready = Boolean(isConnected && isEvmAddress(token) && isEvmAddress(company));
  const wrongChain = Boolean(isConnected && chainId && chainId !== chain.chainId);

  async function send() {
    setError(null);
    if (!address || !isEvmAddress(token) || !isEvmAddress(company)) {
      setError("Connect a wallet and configure the company USDT BEP-20 address first.");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid USDT amount.");
      return;
    }
    if (wrongChain) {
      switchChain({ chainId: chain.chainId });
      setError("Switch to BNB Smart Chain, then send USDT BEP-20.");
      return;
    }
    try {
      const hash = await writeContractAsync({
        chainId: chain.chainId,
        address: token as Address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [company as Address, parseUnits(String(value), chain.usdtDecimals)],
      });
      onSent?.(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "USDT BEP-20 transfer failed");
    }
  }

  if (!token || !company) {
    return (
      <p className="text-xs text-muted">
        In-wallet send needs COMPANY_WALLET_ADDRESS and USDT_CONTRACT_ADDRESS (BEP-20). You can
        still transfer USDT BEP-20 from any DEX wallet to the company address, then paste the tx
        hash.
      </p>
    );
  }

  return (
    <div>
      <GoldButton type="button" variant="ghost" disabled={!ready || isPending || switching} onClick={() => void send()}>
        {isPending ? "Sending USDT…" : "Send USDT BEP-20 from this wallet"}
      </GoldButton>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
