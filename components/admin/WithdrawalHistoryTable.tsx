"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoldButton } from "@/components/brand/GoldButton";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { shortAddress } from "@/lib/address";

export type WithdrawalHistoryRow = {
  id: string;
  when: string;
  user: string;
  walletType: string;
  gross: string;
  fee: string;
  net: string;
  toAddress: string | null;
  status: string;
  txHash: string | null;
  sendError: string | null;
  explorerTx: string | null;
  retryable: boolean;
};

export function WithdrawalHistoryTable({
  rows,
  payoutConfigured,
}: {
  rows: WithdrawalHistoryRow[];
  payoutConfigured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function retry(id: string) {
    setBusy(id);
    setError(null);
    setOk(null);
    const res = await fetch("/api/admin/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Retry failed");
      return;
    }
    setOk(data.message ?? "Retry complete.");
    router.refresh();
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      {ok ? <p className="mb-3 text-sm text-success">{ok}</p> : null}
      <DataTable headers={["When", "User", "Gross / net", "Destination", "Send", "Tx", "Action"]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-3 py-3 text-muted">{row.when}</td>
            <td className="px-3 py-3">
              <p>{row.user}</p>
              <p className="text-xs text-muted">
                {row.walletType} · fee {row.fee}
              </p>
            </td>
            <td className="px-3 py-3">
              {row.gross}
              <span className="text-muted"> → </span>
              {row.net}
            </td>
            <td className="px-3 py-3 font-mono text-xs">
              {row.toAddress ? shortAddress(row.toAddress) : "—"}
            </td>
            <td className="px-3 py-3">
              <StatusPill status={row.status} />
              {row.sendError ? <p className="mt-1 max-w-[220px] text-xs text-danger">{row.sendError}</p> : null}
            </td>
            <td className="px-3 py-3 font-mono text-xs">
              {row.txHash && row.explorerTx ? (
                <a
                  href={row.explorerTx}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold hover:text-gold-bright"
                >
                  {shortAddress(row.txHash, 8, 6)}
                </a>
              ) : row.txHash ? (
                shortAddress(row.txHash, 8, 6)
              ) : (
                "—"
              )}
            </td>
            <td className="px-3 py-3">
              {row.retryable ? (
                <GoldButton
                  type="button"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => void retry(row.id)}
                >
                  {busy === row.id ? "Retrying…" : payoutConfigured ? "Retry send" : "Retry"}
                </GoldButton>
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
