import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function RewardsHistoryPage() {
  const session = await requireUser();
  const payouts = await prisma.rewardPayout.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Reward history</h2>
        <p className="mt-2 text-sm text-muted">
          Daily, direct, team, rank, loyalty, and turnover credits as they are
          booked. Phase 1 seeds illustrations and books direct referral on
          activation — it does not run a live trading engine.
        </p>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <DataTable headers={["When", "Type", "Amount", "Status", "Note"]}>
          {payouts.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.type}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 text-muted">{row.note}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
