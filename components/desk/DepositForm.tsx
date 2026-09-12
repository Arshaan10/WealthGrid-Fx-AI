"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { DexPlaceholder } from "@/components/desk/DexPlaceholder";

export function DepositForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("250");
  const [walletType, setWalletType] = useState("TRADING");

  async function record() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), walletType }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not record intent");
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
          Amount (USD)
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
        <DexPlaceholder onAcknowledge={() => void record()} busy={busy} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </GlassCard>
  );
}
