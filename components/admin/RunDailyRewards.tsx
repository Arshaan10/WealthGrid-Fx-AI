"use client";

import { useState } from "react";
import { GoldButton } from "@/components/brand/GoldButton";
import { rewardsClock } from "@/config/rewards";

type JobResult = {
  dateKey: string;
  timezone: string;
  tradingDay: boolean;
  tradingCredits: number;
  networkCredits: number;
  skippedCap: number;
  skippedDuplicate: number;
  skippedLoan?: number;
  skippedRoiHold?: number;
  loanRecoveries?: number;
  usersTouched: number;
};

export function RunDailyRewards() {
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/rewards/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(date ? { date } : {}),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Job failed");
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gold-line/40 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold/80">Daily reward job</p>
      <p className="mt-2 text-sm text-muted">
        Applies Mon–Fri trading ROI (2× cap → Trading wallet, live booster rate) and network
        credits (3× cap → Network wallet, auto-applied to open flash loans). Loan-funded packages
        skip daily ROI while unpaid. Timezone {rewardsClock.timezone}. Idempotent.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted">
          Date override (YYYY-MM-DD)
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 block rounded-md px-3 py-2 text-sm"
          />
        </label>
        <GoldButton type="button" onClick={run} disabled={busy}>
          {busy ? "Running…" : "Run daily rewards"}
        </GoldButton>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {result ? (
        <p className="mt-3 text-sm text-cream">
          {result.dateKey} · {result.tradingDay ? "trading day" : "weekend"} · trading{" "}
          {result.tradingCredits.toFixed(2)} · network {result.networkCredits.toFixed(2)} ·{" "}
          {result.usersTouched} users · skipped cap {result.skippedCap} · skipped dup{" "}
          {result.skippedDuplicate} · skipped loan {result.skippedLoan ?? 0} · recoveries{" "}
          {result.loanRecoveries ?? 0}
        </p>
      ) : null}
    </div>
  );
}
