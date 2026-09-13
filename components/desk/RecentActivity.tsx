import { Activity } from "lucide-react";
import { GoldLink } from "@/components/brand/GoldButton";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { formatDate, formatUsd } from "@/lib/utils";

export type ActivityRow = {
  id: string;
  createdAt: Date | string;
  walletType: string;
  direction: string;
  category: string;
  amount: string | number | { toString(): string };
  description: string;
};

export function RecentActivity({
  rows,
  emptyHref = "/dashboard/deposit",
}: {
  rows: ActivityRow[];
  emptyHref?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Ledger</p>
          <h3 className="font-display text-2xl">Recent activity</h3>
          <p className="mt-1 text-xs text-muted">
            Confirmed deposits, claims, and withdrawals once the blockchain confirms.
          </p>
        </div>
        <GoldLink href="/dashboard/reports" variant="ghost" className="px-3 py-1.5 text-xs">
          Full report
        </GoldLink>
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-gold-line/50 bg-gold-dim text-gold">
            <Activity size={18} />
          </div>
          <p className="mt-4 font-display text-2xl">No ledger events yet</p>
          <p className="mt-2 max-w-sm text-xs text-muted">
            Confirmed on-chain transactions will appear here once the blockchain confirms.
          </p>
          <GoldLink href={emptyHref} className="mt-5">
            Make a deposit
          </GoldLink>
        </div>
      ) : (
        <DataTable headers={["When", "Vault", "Type", "Amount", "Memo"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">
                {row.direction === "DEBIT" ? "−" : "+"}
                {formatUsd(row.amount)}
              </td>
              <td className="px-3 py-3 text-muted">{row.description}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </GlassCard>
  );
}
