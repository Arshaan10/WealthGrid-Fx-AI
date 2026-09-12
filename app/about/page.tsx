import type { Metadata } from "next";
import { GlassCard } from "@/components/brand/GlassCard";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading
          kicker="House"
          title="Mission & vision"
          lede="Whealth Grid Fx AI is built as a premium desk — not a generic yield brochure. The control plane covers identity, packages, wallets, ranks, treasury payouts, wallet connect, and company-wallet USDT rails."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <GlassCard>
            <h2 className="font-display text-3xl gold-text">Mission</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Give partners a readable, luxurious interface for structured Forex
              AI packages and network recognition — with every rate disclosed as
              configuration, every money movement journaled, and no claim that
              markets are safe.
            </p>
          </GlassCard>
          <GlassCard>
            <h2 className="font-display text-3xl gold-text">Vision</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A trading-desk atmosphere where AI grid allocation, rank gifts, and
              on-chain USDT settlement feel like one instrument panel. Members
              connect wallets for deposits and payouts. Lifetime business data
              stays in this application database.
            </p>
          </GlassCard>
        </div>
        <GlassCard className="mt-6">
          <h3 className="font-display text-2xl">What Phase 1 is — and is not</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Is: marketing site, member desk, admin desk, Prisma lifetime records.</li>
            <li>Is not: live order routing or guaranteed daily income. On-chain USDT send is optional and env-gated.</li>
            <li>Spelling is intentional: Whealth, not Wealth.</li>
          </ul>
        </GlassCard>
      </div>
    </MarketingShell>
  );
}
