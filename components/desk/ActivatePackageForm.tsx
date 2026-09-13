"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { boosters, type BoosterTier } from "@/config/rewards";
import { formatUsd } from "@/lib/utils";

const TIER_OPTIONS = Object.values(boosters.tiers);

export function ActivatePackageForm({
  min,
  available,
  defaultTier = "NONE",
}: {
  min: number;
  available: number;
  defaultTier?: BoosterTier;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tier, setTier] = useState<BoosterTier>(defaultTier);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    const res = await fetch("/api/package/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, boosterTier: tier, fundingSource: "SELF" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Activation failed");
      return;
    }
    router.refresh();
  }

  return (
    <GlassCard>
      <h3 className="font-display text-2xl">Book Pro against Trading wallet</h3>
      <p className="mt-2 text-sm text-muted">
        Available {formatUsd(available)}. Pick a booster — the daily rate follows live ACTIVE direct
        volume. Flash-loan packages cannot run a booster while unpaid.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {TIER_OPTIONS.map((option) => (
            <label
              key={option.slug}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition ${
                tier === option.slug
                  ? "border-gold bg-gold-dim text-cream"
                  : "border-gold-line/40 bg-black/30 text-muted hover:border-gold/50"
              }`}
            >
              <input
                type="radio"
                name="boosterTier"
                className="sr-only"
                checked={tier === option.slug}
                onChange={() => setTier(option.slug)}
              />
              <span className="block font-display text-lg text-gold-bright">{option.name}</span>
              <span className="mt-1 block text-xs leading-relaxed">{option.copy}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            name="amount"
            type="number"
            min={min}
            step="0.01"
            defaultValue={Math.max(min, Math.min(available, 50))}
            className="w-full rounded-lg px-3 py-2 sm:max-w-xs"
          />
          <GoldButton type="submit" disabled={busy || available < min}>
            {busy ? "Activating…" : "Activate Pro"}
          </GoldButton>
        </div>
      </form>
      {available < min ? (
        <p className="mt-3 text-sm text-muted">
          Deposit first so Trading available is at least {formatUsd(min)}.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </GlassCard>
  );
}
