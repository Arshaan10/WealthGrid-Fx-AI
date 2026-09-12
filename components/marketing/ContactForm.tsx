"use client";

import { FormEvent, useState } from "react";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";

export function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send");
      return;
    }
    setStatus("Message recorded. A desk operator can see it in the audit log.");
    event.currentTarget.reset();
  }

  return (
    <GlassCard>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Name
          <input name="name" required className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm">
          Message
          <textarea name="message" required rows={5} className="mt-1 w-full rounded-lg px-3 py-2" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {status ? <p className="text-sm text-success">{status}</p> : null}
        <GoldButton type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send to desk"}
        </GoldButton>
      </form>
    </GlassCard>
  );
}
