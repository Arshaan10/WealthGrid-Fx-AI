import Link from "next/link";
import { Landmark, Users } from "lucide-react";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldLink } from "@/components/brand/GoldButton";
import { RunDailyRewards } from "@/components/admin/RunDailyRewards";
import { ChartLegend, DonutChart, GoldBarChart, GroupedVolumeChart } from "@/components/charts/DeskCharts";
import { StatCard } from "@/components/desk/StatCard";
import {
  platformKpis,
  platformRegistrationSeries,
  platformRewardMix,
  platformVolumeSeries,
} from "@/lib/analytics";
import { requireAdmin } from "@/lib/session";
import { formatUsd } from "@/lib/utils";

export default async function AdminHomePage() {
  await requireAdmin();
  const [kpis, volume, registrations, mix] = await Promise.all([
    platformKpis(),
    platformVolumeSeries(21),
    platformRegistrationSeries(21),
    platformRewardMix(),
  ]);

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={String(kpis.users)} hint={kpis.blocked ? `${kpis.blocked} blocked` : "All active"} icon={<Users size={18} />} />
        <StatCard label="Active packages" value={String(kpis.activations)} hint="Pro desks currently running" />
        <StatCard
          label="Treasury"
          value={formatUsd(kpis.treasury)}
          hint="Company payout pool"
          icon={<Landmark size={18} />}
        />
        <StatCard label="Open tickets" value={String(kpis.openTickets)} hint="OPEN + PENDING" />
        <StatCard label="Deposits (30d)" value={formatUsd(kpis.deposits30)} hint="Approved volume" />
        <StatCard label="Withdrawals (30d)" value={formatUsd(kpis.withdrawals30)} hint="Gross requested" />
        <StatCard label="Blocked users" value={String(kpis.blocked)} hint="Cannot login, deposit, or withdraw" />
        <StatCard label="Rewards paid" value={formatUsd(kpis.rewardsPaid)} hint="Trading + network lifetime" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="overflow-hidden p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">21-day flow</p>
              <h3 className="font-display text-2xl">Deposit / withdraw volume</h3>
            </div>
            <ChartLegend
              items={[
                { label: "Deposits", color: "#d4af37" },
                { label: "Withdrawals", color: "#f4efe3" },
              ]}
            />
          </div>
          <GroupedVolumeChart
            points={volume.map((row) => ({
              label: row.date.slice(5).replace("-", "/"),
              deposits: row.deposits,
              withdrawals: row.withdrawals,
            }))}
          />
        </GlassCard>
        <GlassCard className="overflow-hidden p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Payout mix</p>
          <h3 className="mb-4 font-display text-2xl">Rewards by book</h3>
          <DonutChart
            center="Paid"
            slices={[
              { label: "Trading", value: mix.find((row) => row.label === "Trading")?.value ?? 0, color: "#d4af37" },
              { label: "Network", value: mix.find((row) => row.label === "Network")?.value ?? 0, color: "#f4efe3" },
            ]}
          />
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Desk growth</p>
        <h3 className="mb-3 font-display text-2xl">New registrations</h3>
        <GoldBarChart points={registrations} color="#f3d77a" />
      </GlassCard>

      <RunDailyRewards />

      <GlassCard>
        <h2 className="font-display text-2xl">Operator notes</h2>
        <p className="mt-3 text-sm text-muted">
          Printable reports live under{" "}
          <Link href="/admin/reports" className="text-gold hover:text-gold-bright">
            Reports
          </Link>
          . Store payout funds on{" "}
          <Link href="/admin/treasury" className="text-gold hover:text-gold-bright">
            Treasury
          </Link>
          . Daily ROI is Monday–Friday in Asia/Dubai and books to Trading (2× cap). Network rewards
          book 24/7 to Network (3× cap). Run the job here or with <code>npm run rewards:daily</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <GoldLink href="/admin/reports" variant="ghost" className="px-4 py-2 text-xs">
            Open reports
          </GoldLink>
          <GoldLink href="/admin/queue" variant="ghost" className="px-4 py-2 text-xs">
            Deposit queue
          </GoldLink>
        </div>
      </GlassCard>
    </div>
  );
}
