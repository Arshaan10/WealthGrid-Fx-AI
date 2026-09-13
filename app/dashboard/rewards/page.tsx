import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { DualCapProgress } from "@/components/desk/CapBar";
import { RoutingBanner } from "@/components/desk/RoutingBanner";
import { StatusPill } from "@/components/desk/StatusPill";
import { walletForRewardType } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { getCapSnapshot } from "@/lib/rewards";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function RewardsHistoryPage() {
  const session = await requireUser();
  const [payouts, caps] = await Promise.all([
    prisma.rewardPayout.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    getCapSnapshot(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Reward history</h2>
        <p className="mt-2 text-sm text-muted">
          Daily trading ROI credits the Trading wallet Monday–Friday (2× cap) at the live booster or
          regular rate. Loan-funded packages skip daily ROI until recovered. Direct, team, rank,
          loyalty, and turnover credit the Network wallet 24/7 (3× cap) and auto-apply to any open
          flash loan. Run <code>npm run rewards:daily</code> or the admin job to book the next day.
        </p>
      </GlassCard>
      <RoutingBanner />
      <DualCapProgress
        principal={caps.principal}
        networkPrincipal={caps.networkPrincipal}
        tradingEarned={caps.tradingEarned}
        tradingCap={caps.tradingCap}
        networkEarned={caps.networkEarned}
        networkCap={caps.networkCap}
      />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <DataTable headers={["When", "Type", "Wallet", "Amount", "Status", "Note"]}>
          {payouts.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.type}</td>
              <td className="px-3 py-3">{walletForRewardType(row.type)}</td>
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
