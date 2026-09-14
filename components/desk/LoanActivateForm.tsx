"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { formatUsd } from "@/lib/utils";

export function LoanActivateForm({ approved }: { approved: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/package/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: approved, fundingSource: "LOAN", boosterTier: "NONE" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Loan-funded activation failed");
      return;
    }
    router.refresh();
  }

  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Flash loan funded</p>
      <h3 className="mt-2 font-display text-2xl">Activate Pro with approved loan</h3>
      <p className="mt-2 text-sm text-muted">
        This books a package for {formatUsd(approved)}. Daily ROI stays paused until the Network
        liability is fully recovered; then regular 1%/day starts the next Asia/Dubai calendar day.
      </p>
      <form onSubmit={onSubmit} className="mt-4">
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Activating…" : `Activate ${formatUsd(approved)} from loan`}
        </GoldButton>
      </form>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </GlassCard>
  );
}
