"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";

export function AdminActivateForm({
  defaultEmail,
  defaultUserId,
}: {
  defaultEmail?: string;
  defaultUserId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [funding, setFunding] = useState<"ADMIN" | "LOAN">("ADMIN");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/packages/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        userId: defaultUserId || undefined,
        amount: Number(form.get("amount")),
        count: Number(form.get("count")),
        fundingSource: funding,
        note: String(form.get("note") ?? ""),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Activation failed");
      return;
    }
    setOk(`Activated ${data.count} package${data.count === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <GlassCard>
      <h3 className="font-display text-2xl">Activate packages for a member</h3>
      <p className="mt-2 text-sm text-muted">
        Regular admin grants earn 1%/day toward 2× and do not debit the member wallet. Flash-loan
        funding (one package) books a Network liability unless an unused approved loan already
        exists.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <input
          name="email"
          type="email"
          required={!defaultUserId}
          defaultValue={defaultEmail}
          placeholder="member@whealthgrid.com"
          className="w-full rounded-lg px-3 py-2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="amount"
            type="number"
            min={50}
            step="0.01"
            defaultValue={200}
            className="rounded-lg px-3 py-2"
          />
          <input
            name="count"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            disabled={funding === "LOAN"}
            className="rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="funding"
              checked={funding === "ADMIN"}
              onChange={() => setFunding("ADMIN")}
            />
            Regular grant (1%/day)
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="funding"
              checked={funding === "LOAN"}
              onChange={() => setFunding("LOAN")}
            />
            Flash-loan funded
          </label>
        </div>
        <input name="note" type="text" maxLength={240} placeholder="Optional ops note" className="rounded-lg px-3 py-2" />
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Activating…" : "Activate on behalf of client"}
        </GoldButton>
      </form>
      {ok ? <p className="mt-3 text-sm text-success">{ok}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </GlassCard>
  );
}
