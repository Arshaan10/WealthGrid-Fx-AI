"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { DexPlaceholder } from "@/components/desk/DexPlaceholder";
import { formatUsd } from "@/lib/utils";

export function WithdrawForm({
  wallets,
  defaultAddress,
}: {
  wallets: { type: string; available: number }[];
  defaultAddress: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("50");
  const [walletType, setWalletType] = useState(wallets[0]?.type ?? "TRADING");
  const [toAddress, setToAddress] = useState(defaultAddress);
  const selected = wallets.find((w) => w.type === walletType);

  async function record() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), walletType, toAddress }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not request withdrawal");
      return;
    }
    router.refresh();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void record();
  }

  return (
    <GlassCard>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Amount
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
          From wallet
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2"
          >
            {wallets.map((w) => (
              <option key={w.type} value={w.type}>
                {w.type} · available {formatUsd(w.available)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Destination (future DEX)
          <input
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2"
            placeholder="0x…"
          />
        </label>
        <p className="text-xs text-muted">
          Selected available: {formatUsd(selected?.available ?? 0)}
        </p>
        <DexPlaceholder onAcknowledge={() => void record()} busy={busy} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </GlassCard>
  );
}
