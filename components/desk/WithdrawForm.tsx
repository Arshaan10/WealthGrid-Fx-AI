"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { DexPlaceholder } from "@/components/desk/DexPlaceholder";
import { formatUsd } from "@/lib/utils";

export function WithdrawForm({
  wallets,
  defaultAddress,
  feePct,
}: {
  wallets: { type: string; available: number }[];
  defaultAddress: string;
  feePct: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("50");
  const [walletType, setWalletType] = useState(wallets[0]?.type ?? "TRADING");
  const [toAddress, setToAddress] = useState(defaultAddress);
  const selected = wallets.find((w) => w.type === walletType);

  const quote = useMemo(() => {
    const gross = Number(amount);
    if (!Number.isFinite(gross) || gross <= 0) {
      return { gross: 0, fee: 0, net: 0 };
    }
    const fee = Math.round(gross * (feePct / 100) * 100) / 100;
    const net = Math.round((gross - fee) * 100) / 100;
    return { gross, fee, net };
  }, [amount, feePct]);

  async function record() {
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), walletType, toAddress }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not complete withdrawal");
      return;
    }
    setOk(
      `Withdrawn ${formatUsd(data.amount)}. Fee ${formatUsd(data.fee)}. Net payout ${formatUsd(data.net)} booked from treasury.`,
    );
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
          Destination (on-chain later)
          <input
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="mt-1 w-full rounded-lg px-3 py-2"
            placeholder="0x…"
          />
        </label>
        <div className="rounded-lg border border-gold-line/40 bg-black/20 px-3 py-3 text-xs text-muted">
          <p>Selected available: {formatUsd(selected?.available ?? 0)}</p>
          <p className="mt-1">
            Fee {feePct}% · {formatUsd(quote.fee)} · net payout {formatUsd(quote.net)}
          </p>
        </div>
        <DexPlaceholder
          showAction={false}
          title="Connect wallet (coming next)"
          body="Payouts settle from the company treasury today. On-chain send ships later. Confirming deducts your available balance immediately and auto-approves if the payout pool can cover the net amount."
        />
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Withdrawing…" : "Withdraw"}
        </GoldButton>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {ok ? <p className="text-sm text-success">{ok}</p> : null}
      </form>
    </GlassCard>
  );
}
