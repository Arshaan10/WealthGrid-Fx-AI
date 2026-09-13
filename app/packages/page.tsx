import type { Metadata } from "next";
import { GoldLink } from "@/components/brand/GoldButton";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { boosters, flashLoan, packages } from "@/config/rewards";

export const metadata: Metadata = { title: "Packages" };

export default function PackagesPage() {
  const pro = packages[0];

  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading
          kicker="Activation"
          title="The Pro desk package"
          lede="A single desk product with regular, booster, and flash-loan funding paths. Activate from the member desk, or ask ops to grant packages."
        />
        <GlassCard className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gold">{pro.name}</p>
              <p className="mt-2 font-display text-6xl gold-text">${pro.minAmountUsd}+</p>
            </div>
            <GoldLink href="/register">Activate from the desk</GoldLink>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-muted">{pro.blurb}</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gold-line/50 bg-black/30 p-4">
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">Daily structure</dt>
              <dd className="mt-2 font-display text-3xl text-cream">~{pro.dailyRatePct}%</dd>
            </div>
            <div className="rounded-xl border border-gold-line/50 bg-black/30 p-4">
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">Trading cap 2×</dt>
              <dd className="mt-2 font-display text-3xl text-cream">{pro.maxReturnPct}%</dd>
            </div>
            <div className="rounded-xl border border-gold-line/50 bg-black/30 p-4">
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">Network cap 3×</dt>
              <dd className="mt-2 font-display text-3xl text-cream">{pro.networkCapPct}%</dd>
            </div>
          </dl>
        </GlassCard>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Object.values(boosters.tiers).map((tier) => (
            <GlassCard key={tier.slug}>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">{tier.slug}</p>
              <h3 className="mt-2 font-display text-2xl">{tier.name}</h3>
              <p className="mt-2 text-sm text-muted">{tier.copy}</p>
            </GlassCard>
          ))}
        </div>
        <GlassCard className="mt-6">
          <h3 className="font-display text-2xl">Flash loan activation</h3>
          <p className="mt-3 text-sm text-muted">{flashLoan.note}</p>
        </GlassCard>
        <RiskDisclaimer className="mt-8" />
      </div>
    </MarketingShell>
  );
}
