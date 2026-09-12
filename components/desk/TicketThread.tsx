"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { StatusPill } from "@/components/desk/StatusPill";
import { formatDate } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { name: string; role: string };
};

export function TicketThread({
  ticketId,
  subject,
  status,
  messages,
  replyUrl,
  statusUrl,
  closed,
}: {
  ticketId: string;
  subject: string;
  status: string;
  messages: Message[];
  replyUrl: string;
  statusUrl?: string;
  closed: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  async function onReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = event.currentTarget;
    const res = await fetch(replyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: new FormData(form).get("body") }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send reply");
      return;
    }
    form.reset();
    router.refresh();
  }

  async function setStatus(next: "OPEN" | "PENDING" | "CLOSED") {
    if (!statusUrl) return;
    setStatusBusy(true);
    await fetch(statusUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatusBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">Ticket {ticketId.slice(-6)}</p>
            <h2 className="font-display text-2xl text-cream">{subject}</h2>
          </div>
          <StatusPill status={status} />
        </div>
        {statusUrl ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {(["OPEN", "PENDING", "CLOSED"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={statusBusy || status === value}
                onClick={() => void setStatus(value)}
                className="rounded-md border border-gold-line px-3 py-1 text-xs uppercase tracking-wider text-gold disabled:opacity-40"
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}
      </GlassCard>

      <div className="space-y-3">
        {messages.map((message) => (
          <GlassCard key={message.id} className="p-4">
            <div className="flex items-center justify-between gap-3 text-xs text-muted">
              <span>
                {message.author.name}
                {message.author.role === "ADMIN" ? " · desk" : ""}
              </span>
              <span>{formatDate(message.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-cream">{message.body}</p>
          </GlassCard>
        ))}
      </div>

      {closed ? (
        <p className="text-sm text-muted">This ticket is closed.</p>
      ) : (
        <GlassCard>
          <form onSubmit={onReply} className="space-y-3">
            <textarea
              name="body"
              required
              minLength={2}
              rows={4}
              placeholder="Reply…"
              className="w-full rounded-lg px-3 py-2"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <GoldButton type="submit" disabled={busy}>
              {busy ? "Sending…" : "Reply"}
            </GoldButton>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
