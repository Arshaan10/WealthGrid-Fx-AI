"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { formatUsd } from "@/lib/utils";

export function ActivatePackageForm({
  min,
  available,
}: {
  min: number;
  available: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    const res = await fetch("/api/package/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
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
      <p className="mt-2 text-sm text-muted">Available {formatUsd(available)}</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
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
      </form>
      {available < min ? (
        <p className="mt-3 text-sm text-muted">
          Deposit (placeholder) first so Trading available is at least {formatUsd(min)}.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </GlassCard>
  );
}
