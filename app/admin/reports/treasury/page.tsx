import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { ReportActions } from "@/components/desk/ReportActions";
import { StatusPill } from "@/components/desk/StatusPill";
import { TREASURY_ID, getOrCreateTreasury } from "@/lib/treasury";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function AdminTreasuryReportPage() {
  await requireAdmin();
  const treasury = await getOrCreateTreasury();
  const movements = await prisma.treasuryMovement.findMany({
    where: { treasuryId: TREASURY_ID },
    include: { actor: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const exportRows = movements.map((row) => [
    formatDate(row.createdAt),
    row.direction,
    row.category,
    formatUsd(row.amount),
    formatUsd(row.balanceAfter),
    row.actor?.email ?? "system",
    row.description,
  ]);

  return (
    <div className="space-y-6 print-sheet">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">
              <Link href="/admin/reports" className="hover:text-gold">
                Reports
              </Link>
              {" / "}
              Treasury
            </p>
            <h2 className="font-display text-3xl">Treasury movements</h2>
            <p className="mt-2 text-sm text-muted">
              Current pool {formatUsd(treasury.balance)}. Top-ups and member payouts only — deposits
              do not move treasury.
            </p>
          </div>
          <ReportActions
            filename="whealth-treasury"
            headers={["When", "Direction", "Category", "Amount", "Balance after", "By", "Note"]}
            rows={exportRows}
          />
        </div>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <DataTable headers={["When", "Type", "Category", "Amount", "Balance after", "By", "Note"]}>
          {movements.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.direction} />
              </td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">{formatUsd(row.balanceAfter)}</td>
              <td className="px-3 py-3 text-xs text-muted">{row.actor?.email ?? "system"}</td>
              <td className="px-3 py-3 text-xs text-muted">{row.description}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
    </div>
  );
}
