"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";

export function TreasuryTopupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(form.get("amount")),
        note: String(form.get("note") ?? ""),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add funds");
      return;
    }
    event.currentTarget.reset();
    setOk("Treasury credited. Balance updated.");
    router.refresh();
  }

  return (
    <GlassCard>
      <h3 className="font-display text-2xl">Add funds</h3>
      <p className="mt-2 text-sm text-muted">
        Top up the company payout pool. This is a ledger credit only — no chain
        transfer. Member withdrawals debit this balance immediately.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          Amount (USD)
          <input
            name="amount"
            type="number"
            min={1}
            step="0.01"
            required
            placeholder="1000"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Note
          <input
            name="note"
            maxLength={240}
            placeholder="Wire from operating account"
            className="mt-1 w-full rounded-lg px-3 py-2"
          />
        </label>
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Posting…" : "Store funds"}
        </GoldButton>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {ok ? <p className="text-sm text-success">{ok}</p> : null}
      </form>
    </GlassCard>
  );
}
