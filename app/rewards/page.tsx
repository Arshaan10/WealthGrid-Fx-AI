import type { Metadata } from "next";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { businessTurnover, loyalty, packages, referrals } from "@/config/rewards";

export const metadata: Metadata = { title: "Rewards" };

export default function RewardsPage() {
  const pro = packages[0];

  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading
          kicker="Structure"
          title="How rewards are configured"
          lede="These figures describe the Phase 1 schedule. They are not a forecast and they are not paid on-chain yet."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <GlassCard>
            <h3 className="font-display text-2xl gold-text">Package trading</h3>
            <p className="mt-3 text-sm text-muted">
              ~{pro.dailyRatePct}% daily illustration against the activated Pro
              amount, up to ~{pro.maxReturnPct}% on the package.
            </p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-2xl gold-text">Direct referral</h3>
            <p className="mt-3 text-sm text-muted">
              {referrals.directPct}% of a first-line activation, booked to the
              Network wallet when a referred member activates.
            </p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-2xl gold-text">Team trading L1–L{referrals.teamLevels}</h3>
            <p className="mt-3 text-sm text-muted">
              A declining schedule stored in config. Phase 1 displays it; later
              phases can execute it against real downline volume.
            </p>
            <ol className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
              {referrals.teamTradingPct.map((pct, i) => (
                <li key={i} className="rounded-md border border-gold-line/40 px-2 py-1">
                  L{i + 1} · {pct}%
                </li>
              ))}
            </ol>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-2xl gold-text">Loyalty & turnover</h3>
            <p className="mt-3 text-sm text-muted">{loyalty.note}</p>
            <p className="mt-2 text-sm text-muted">{businessTurnover.note}</p>
          </GlassCard>
        </div>
        <RiskDisclaimer className="mt-8" />
      </div>
    </MarketingShell>
  );
}
