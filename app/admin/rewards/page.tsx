import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import {
  businessTurnover,
  loyalty,
  packages,
  referrals,
} from "@/config/rewards";
import { requireAdmin } from "@/lib/session";

export default async function AdminRewardsPage() {
  await requireAdmin();
  const pro = packages[0];

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Reward configuration</h2>
        <p className="mt-2 text-sm text-muted">
          Read-only view of <code>config/rewards.ts</code>. Edit the file and
          re-seed the Pro package to change live numbers.
        </p>
      </GlassCard>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h3 className="font-display text-2xl gold-text">{pro.name}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Min ${pro.minAmountUsd}</li>
            <li>Daily ~{pro.dailyRatePct}%</li>
            <li>Package cap ~{pro.maxReturnPct}%</li>
            <li>Network toward ~{pro.networkCapPct}%</li>
          </ul>
        </GlassCard>
        <GlassCard>
          <h3 className="font-display text-2xl gold-text">Network</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Direct {referrals.directPct}%</li>
            <li>Team levels {referrals.teamLevels}</li>
            <li>{loyalty.note}</li>
            <li>{businessTurnover.note}</li>
          </ul>
        </GlassCard>
      </div>
      <GlassCard>
        <h3 className="font-display text-2xl">Team trading schedule</h3>
        <ol className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-5">
          {referrals.teamTradingPct.map((pct, i) => (
            <li key={i} className="rounded-md border border-gold-line/40 px-2 py-1">
              L{i + 1} · {pct}%
            </li>
          ))}
        </ol>
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
