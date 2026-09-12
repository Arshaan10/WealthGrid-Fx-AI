"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";

export function TicketComposer() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: data.get("subject"),
        body: data.get("body"),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Could not open ticket");
      return;
    }
    form.reset();
    router.push(`/dashboard/support/${json.id}`);
    router.refresh();
  }

  return (
    <GlassCard>
      <h3 className="font-display text-2xl">New ticket</h3>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          Subject
          <input name="subject" required minLength={3} className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Message
          <textarea name="body" required minLength={8} rows={4} className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Sending…" : "Open ticket"}
        </GoldButton>
      </form>
    </GlassCard>
  );
}
