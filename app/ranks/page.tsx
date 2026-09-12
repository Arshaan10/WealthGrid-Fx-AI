import type { Metadata } from "next";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { giftCatalog, ranks } from "@/config/rewards";

export const metadata: Metadata = { title: "Ranks" };

export default function RanksPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading
          kicker="Recognition"
          title="Elite, Director, Founder"
          lede="Nine named ranks after Unranked. Gift items are a catalog for display — fulfillment is not automated in Phase 1."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranks
            .filter((r) => r.slug !== "none")
            .map((rank) => (
              <GlassCard key={rank.slug} className="p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">{rank.tier}</p>
                <h3 className="mt-2 font-display text-3xl">{rank.name}</h3>
              </GlassCard>
            ))}
        </div>
        <SectionHeading
          kicker="Catalog"
          title="Rank gifts"
          lede="Earbuds through cars — recognition imagery, not a shipping promise."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {giftCatalog.map((gift) => (
            <GlassCard key={gift.slug} className="p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{gift.category}</p>
              <h3 className="mt-2 font-display text-2xl">{gift.name}</h3>
              <p className="mt-2 text-sm text-muted">{gift.blurb}</p>
              <p className="mt-3 text-xs text-gold-bright">From {gift.minRank}</p>
            </GlassCard>
          ))}
        </div>
        <RiskDisclaimer compact className="mt-8" />
      </div>
    </MarketingShell>
  );
}
