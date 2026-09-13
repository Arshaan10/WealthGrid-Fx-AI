import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { ReportActions } from "@/components/desk/ReportActions";
import { RoutingBanner } from "@/components/desk/RoutingBanner";
import { caps, isTradingRewardType, walletForRewardType } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function AdminRewardsReportPage() {
  await requireAdmin();
  const [grouped, recent] = await Promise.all([
    prisma.rewardPayout.groupBy({
      by: ["type", "status"],
      _sum: { amount: true },
      _count: true,
    }),
    prisma.rewardPayout.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const summaryRows = grouped.map((row) => [
    row.type,
    walletForRewardType(row.type),
    row.status,
    String(row._count),
    formatUsd(row._sum.amount ?? 0),
    isTradingRewardType(row.type) ? `${caps.tradingMultiple}× trading` : `${caps.networkMultiple}× network`,
  ]);

  const detailRows = recent.map((row) => [
    formatDate(row.createdAt),
    row.user.name,
    row.user.email,
    row.type,
    walletForRewardType(row.type),
    row.status,
    formatUsd(row.amount),
    row.note ?? "",
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
              Rewards
            </p>
            <h2 className="font-display text-3xl">Reward summary</h2>
            <p className="mt-2 text-sm text-muted">
              DAILY books to Trading (Mon–Fri, 2×). DIRECT / TEAM / RANK / LOYALTY / TURNOVER book to
              Network (24/7, 3×).
            </p>
          </div>
          <ReportActions
            filename="whealth-rewards-summary"
            headers={["Type", "Wallet", "Status", "Count", "Amount", "Cap book"]}
            rows={summaryRows}
          />
        </div>
      </GlassCard>
      <RoutingBanner />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">By type</h3>
        <DataTable headers={["Type", "Wallet", "Status", "Count", "Amount", "Cap"]}>
          {grouped.map((row) => (
            <tr key={`${row.type}-${row.status}`}>
              <td className="px-3 py-3">{row.type}</td>
              <td className="px-3 py-3">{walletForRewardType(row.type)}</td>
              <td className="px-3 py-3">{row.status}</td>
              <td className="px-3 py-3">{row._count}</td>
              <td className="px-3 py-3">{formatUsd(asNumber(row._sum.amount ?? 0))}</td>
              <td className="px-3 py-3 text-muted">
                {isTradingRewardType(row.type) ? `${caps.tradingMultiple}×` : `${caps.networkMultiple}×`}
              </td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl">Recent payouts</h3>
          <ReportActions
            filename="whealth-rewards-detail"
            headers={["When", "Name", "Email", "Type", "Wallet", "Status", "Amount", "Note"]}
            rows={detailRows}
          />
        </div>
        <DataTable headers={["When", "Member", "Type", "Wallet", "Status", "Amount", "Note"]}>
          {recent.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">
                {row.user.name}
                <div className="text-xs text-muted">{row.user.email}</div>
              </td>
              <td className="px-3 py-3">{row.type}</td>
              <td className="px-3 py-3">{walletForRewardType(row.type)}</td>
              <td className="px-3 py-3">{row.status}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3 text-muted">{row.note}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
    </div>
  );
}
