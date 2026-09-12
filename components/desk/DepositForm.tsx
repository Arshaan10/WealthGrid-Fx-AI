"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { Bep20Banner } from "@/components/desk/Bep20Banner";
import { CompanyWalletCard } from "@/components/desk/CompanyWalletCard";
import { SendUsdtButton } from "@/components/desk/SendUsdtButton";
import { WalletConnectButton } from "@/components/desk/WalletConnectButton";
import type { PublicChainConfig } from "@/lib/chain";
import { formatUsd } from "@/lib/utils";

export function DepositForm({ chain }: { chain: PublicChainConfig }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [watching, setWatching] = useState(false);
  const [amount, setAmount] = useState("250");
  const [walletType, setWalletType] = useState("TRADING");
  const [txHash, setTxHash] = useState("");
  const [fromAddress, setFromAddress] = useState("");

  async function submit(watch = false, hash = txHash) {
    setBusy(true);
    setWatching(watch);
    setError(null);
    setOk(null);
    const res = await fetch("/api/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        walletType,
        txHash: hash,
        fromAddress,
        watch,
      }),
    });
    const data = await res.json();
    setBusy(false);
    setWatching(false);
    if (!res.ok) {
      setError(data.error ?? "Could not record deposit");
      return;
    }
    if (data.verified) {
      setOk(
        `On-chain USDT confirmed (${data.confirmations}/${data.requiredConfirmations} confirmations). Trading ${formatUsd(data.wallets?.trading?.available ?? 0)} · Network ${formatUsd(data.wallets?.network?.available ?? 0)}.`,
      );
    } else if (data.status === "CONFIRMING") {
      setOk(
        `Watching the chain — ${data.confirmations ?? 0}/${data.requiredConfirmations ?? chain.requiredConfirmations} confirmations. The chosen vault credits automatically when confirmed.`,
      );
    } else if (data.txHash) {
      setOk("Tx recorded. The watcher will auto-credit after confirmations once RPC can see the transfer.");
    } else {
      setOk("Intent recorded. Send USDT BEP-20 from any Web3 wallet to the company address — auto-credit runs after confirmations.");
    }
    router.refresh();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(false);
  }

  return (
    <GlassCard>
      <form onSubmit={onSubmit} className="space-y-4">
        <Bep20Banner chain={chain} />
        <WalletConnectButton
          targetChainId={chain.chainId}
          onAddress={(address) => setFromAddress(address)}
        />
        <CompanyWalletCard chain={chain} />
        <label className="block text-sm">
          Amount (USDT BEP-20)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min={1}
            step="0.01"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Credit wallet
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2"
          >
            <option value="TRADING">Trading</option>
            <option value="NETWORK">Network</option>
          </select>
        </label>
        <label className="block text-sm">
          Your sending address
          <input
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2"
            placeholder="0x… (filled when you connect)"
          />
        </label>
        <label className="block text-sm">
          Transaction hash
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2"
            placeholder="0x… after you send USDT BEP-20"
          />
        </label>
        <SendUsdtButton
          chain={chain}
          amount={amount}
          onSent={(hash) => {
            setTxHash(hash);
            void submit(false, hash);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <GoldButton type="submit" disabled={busy}>
            {busy && !watching ? "Recording…" : "Record deposit"}
          </GoldButton>
          {chain.watchConfigured ? (
            <GoldButton
              type="button"
              variant="ghost"
              disabled={busy || !fromAddress}
              onClick={() => void submit(true)}
            >
              {watching ? "Watching…" : "Watch recent transfer"}
            </GoldButton>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Auto-credit runs when a public RPC sees a matching USDT BEP-20 transfer and it reaches{" "}
          {chain.requiredConfirmations} confirmations. No admin click on that happy path. Forex
          remains high risk — this is not a promise of profit.
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {ok ? <p className="text-sm text-success">{ok}</p> : null}
      </form>
    </GlassCard>
  );
}
