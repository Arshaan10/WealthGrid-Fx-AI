"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { flashLoan } from "@/config/rewards";

export function FlashLoanForm({ disabled, reason }: { disabled?: boolean; reason?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/loans", {
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
      setError(data.error ?? "Application failed");
      return;
    }
    router.refresh();
  }

  return (
    <GlassCard>
      <h3 className="font-display text-2xl">Apply for a flash loan</h3>
      <p className="mt-2 text-sm text-muted">
        Request any amount from ${flashLoan.minAmountUsd} (Pro minimum) so the approved book can
        fund a package. After admin approval the Network wallet shows the liability (may be
        negative). You then activate a package funded by that loan.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          name="amount"
          type="number"
          min={flashLoan.minAmountUsd}
          step="0.01"
          defaultValue={500}
          disabled={disabled}
          className="w-full rounded-lg px-3 py-2 sm:max-w-xs"
        />
        <input
          name="note"
          type="text"
          maxLength={240}
          placeholder="Optional note"
          disabled={disabled}
          className="w-full rounded-lg px-3 py-2"
        />
        <GoldButton type="submit" disabled={busy || disabled}>
          {busy ? "Submitting…" : "Submit application"}
        </GoldButton>
      </form>
      {disabled && reason ? <p className="mt-3 text-sm text-gold">{reason}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </GlassCard>
  );
}
