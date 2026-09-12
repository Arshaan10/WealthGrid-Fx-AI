"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { StatusPill } from "@/components/desk/StatusPill";

type Row = {
  id: string;
  user: string;
  amount: string;
  extra: string;
  status: string;
  when: string;
  pending: boolean;
};

export function QueueTable({
  title,
  kind,
  rows,
}: {
  title: string;
  kind: "deposit" | "withdrawal";
  rows: Row[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setBusy(id + decision);
    setError(null);
    const res = await fetch("/api/admin/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, decision }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <GlassCard pad={false} className="p-4 sm:p-6">
      <h3 className="mb-4 font-display text-2xl">{title}</h3>
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold-line/40 text-[11px] uppercase tracking-[0.16em] text-muted">
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Detail</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-line/20">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-3 text-muted">{row.when}</td>
                <td className="px-3 py-3">{row.user}</td>
                <td className="px-3 py-3">{row.amount}</td>
                <td className="px-3 py-3 font-mono text-xs">{row.extra}</td>
                <td className="px-3 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-3 py-3">
                  {row.pending ? (
                    <div className="flex flex-wrap gap-2">
                      <GoldButton
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void decide(row.id, "APPROVED")}
                      >
                        Approve
                      </GoldButton>
                      <GoldButton
                        type="button"
                        variant="danger"
                        disabled={busy !== null}
                        onClick={() => void decide(row.id, "REJECTED")}
                      >
                        Reject
                      </GoldButton>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Settled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">Queue is empty.</p>
        ) : null}
      </div>
    </GlassCard>
  );
}
