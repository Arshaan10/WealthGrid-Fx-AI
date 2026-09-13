import Link from "next/link";
import { GoldLink } from "@/components/brand/GoldButton";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { ChartLegend, DonutChart, DualAreaChart, GoldBarChart } from "@/components/charts/DeskCharts";
import { DualCapProgress } from "@/components/desk/CapBar";
import { LoanBanner } from "@/components/desk/LoanBanner";
import { MetricGrid } from "@/components/desk/MetricGrid";
import { OnchainSync } from "@/components/desk/OnchainSync";
import { RecentActivity } from "@/components/desk/RecentActivity";
import { RoutingBanner } from "@/components/desk/RoutingBanner";
import { VaultStrip } from "@/components/desk/VaultCard";
import { rankBySlug } from "@/config/rewards";
import { rollupWeekly, userEarningsSeries, weeklyTradingBarsFromSeries } from "@/lib/analytics";
import { getPublicChainConfig } from "@/lib/chain";
import { syncOnchainDesk } from "@/lib/desk-sync";
import { prisma } from "@/lib/prisma";
import { getLoanDeskSnapshot } from "@/lib/flash-loans";
import { getCapSnapshot } from "@/lib/rewards";
import { requireUser } from "@/lib/session";
import { asNumber, formatUsd } from "@/lib/utils";

export default async function DashboardHomePage() {
  const session = await requireUser();
  const chain = getPublicChainConfig();
  await syncOnchainDesk(session.user.id);

  const [user, caps, earnings, loanSnap] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        wallets: true,
        rankProgress: true,
        activations: { where: { status: { in: ["ACTIVE", "COMPLETED"] } }, include: { package: true } },
        ledger: { orderBy: { createdAt: "desc" }, take: 8 },
        _count: { select: { referralsMade: true } },
      },
    }),
    getCapSnapshot(session.user.id),
    userEarningsSeries(session.user.id, 42),
    getLoanDeskSnapshot(session.user.id),
  ]);
  const weekly = weeklyTradingBarsFromSeries(earnings, 6);

  const trading = user?.wallets.find((w) => w.type === "TRADING");
  const network = user?.wallets.find((w) => w.type === "NETWORK");
  const pack = user?.activations.find((row) => row.status === "ACTIVE") ?? user?.activations[0];
  const rank = rankBySlug(user?.rankProgress?.currentRank ?? "none");
  const tradingAvail = asNumber(trading?.available ?? 0);
  const networkAvail = asNumber(network?.available ?? 0);

  return (
    <div className="min-w-0 space-y-6">
      <OnchainSync />
      <RoutingBanner />
      <LoanBanner snap={loanSnap} />
      <VaultStrip
        trading={{
          available: tradingAvail,
          pending: asNumber(trading?.pending ?? 0),
        }}
        network={{
          available: networkAvail,
          pending: asNumber(network?.pending ?? 0),
        }}
      />
      <MetricGrid
        title="Desk performance"
        action={
          <GoldLink href="/dashboard/reports" variant="ghost" className="px-3 py-1.5 text-xs">
            Open reports
          </GoldLink>
        }
        items={[
          { label: "Trading balance", value: formatUsd(tradingAvail) },
          { label: "Network balance", value: formatUsd(networkAvail) },
          {
            label: "Package status",
            value: pack ? `${pack.status} · ${formatUsd(pack.amount)}` : "None",
          },
          {
            label: `Daily ROI toward 2×`,
            value: `${(caps.tradingRatio * 100).toFixed(1)}%`,
          },
          {
            label: `Network toward 3×`,
            value: `${(caps.networkRatio * 100).toFixed(1)}%`,
          },
          { label: "Direct referrals", value: String(user?._count.referralsMade ?? 0) },
          { label: "Rank", value: rank.name },
          { label: "Confirmations", value: String(chain.requiredConfirmations) },
        ]}
      />
      <DualCapProgress
        principal={caps.principal}
        tradingEarned={caps.tradingEarned}
        tradingCap={caps.tradingCap}
        networkEarned={caps.networkEarned}
        networkCap={caps.networkCap}
      />
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="overflow-hidden p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">28-day book</p>
              <h3 className="font-display text-2xl">Weekly earnings</h3>
            </div>
            <ChartLegend
              items={[
                { label: "Trading", color: "#d4af37" },
                { label: "Network", color: "#f4efe3" },
              ]}
            />
          </div>
          <DualAreaChart points={rollupWeekly(earnings.slice(-28))} />
        </GlassCard>
        <GlassCard className="overflow-hidden p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Vault mix</p>
          <h3 className="mb-4 font-display text-2xl">Wallet breakdown</h3>
          <DonutChart
            center="USDT"
            slices={[
              { label: "Trading", value: Math.max(0, tradingAvail), color: "#d4af37" },
              { label: "Network", value: Math.max(0, networkAvail), color: "#f4efe3" },
            ]}
          />
        </GlassCard>
      </div>
      <GlassCard className="overflow-hidden p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Mon–Fri credits</p>
            <h3 className="font-display text-2xl">Weekly trading ROI</h3>
            <p className="mt-1 text-xs text-muted">
              Saturday and Sunday never credit the Trading wallet. Bars are weekly totals of daily ROI.
            </p>
          </div>
        </div>
        <GoldBarChart points={weekly} />
      </GlassCard>
      <RecentActivity rows={user?.ledger ?? []} />
      {session.user.role === "ADMIN" ? (
        <p className="text-sm text-muted">
          Operator access:{" "}
          <Link href="/admin" className="text-gold hover:text-gold-bright">
            open admin desk →
          </Link>
        </p>
      ) : null}
      <RiskDisclaimer />
    </div>
  );
}
