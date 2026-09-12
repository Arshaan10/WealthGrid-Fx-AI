import Link from "next/link";
import { ArrowRight, Bot, CandlestickChart, Network, ShieldAlert } from "lucide-react";
import { FadeIn } from "@/components/brand/FadeIn";
import { HeroChart } from "@/components/brand/HeroChart";
import { GoldLink } from "@/components/brand/GoldButton";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { packages, referrals, ranks } from "@/config/rewards";

export default function HomePage() {
  const pro = packages[0];

  return (
    <MarketingShell atmosphere="hero">
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-gold">
              Trading desk · AI grid · Phase 1
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] text-cream sm:text-7xl">
              Whealth Grid <span className="gold-text">Fx AI</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              A luxury control plane for structured Forex AI packages, multi-level
              team trading, and rank recognition. Gold-desk atmosphere. No
              guaranteed returns. DEX rails arrive next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GoldLink href="/register">
                Enter the desk <ArrowRight size={16} />
              </GoldLink>
              <GoldLink href="/packages" variant="ghost">
                View Pro package
              </GoldLink>
            </div>
          </FadeIn>
          <FadeIn delay={0.12}>
            <HeroChart />
          </FadeIn>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <CandlestickChart size={18} />,
              title: "Grid signals",
              copy: "Candlestick mesh and signal overlays frame every desk surface — the bot is present, never cartooned.",
            },
            {
              icon: <Bot size={18} />,
              title: "AI allocation",
              copy: "Package activation books trading capital against a configured daily structure and a hard package cap.",
            },
            {
              icon: <Network size={18} />,
              title: "Network depth",
              copy: `${referrals.directPct}% direct. Team trading configured across L1–L${referrals.teamLevels}.`,
            },
          ].map((item) => (
            <GlassCard key={item.title} className="p-5">
              <div className="text-gold">{item.icon}</div>
              <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.copy}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <SectionHeading
          kicker="Package"
          title="Pro from $50 — structured, capped, disclosed"
          lede="Numbers live in config/rewards.ts so marketing, dashboards, and seed stay aligned."
        />
        <GlassCard className="mt-8 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">{pro.name}</p>
            <p className="mt-2 font-display text-5xl gold-text">From ${pro.minAmountUsd}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li>Illustrative daily credit ~{pro.dailyRatePct}% of activated amount</li>
              <li>Package-side ceiling ~{pro.maxReturnPct}% of the package</li>
              <li>Network-side composite toward ~{pro.networkCapPct}%</li>
            </ul>
            <GoldLink href="/packages" className="mt-8">
              Package details
            </GoldLink>
          </div>
          <div className="rounded-xl border border-gold-line/50 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gold/80">Ranks</p>
            <p className="mt-2 text-sm text-muted">
              Elite 1–7, Director, Founder. Gift catalog is display-only in Phase 1.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ranks
                .filter((r) => r.slug !== "none")
                .map((r) => (
                  <span
                    key={r.slug}
                    className="rounded-full border border-gold-line px-2.5 py-1 text-[11px] text-gold-bright"
                  >
                    {r.name}
                  </span>
                ))}
            </div>
            <Link href="/ranks" className="mt-4 inline-block text-sm text-gold hover:text-gold-bright">
              Rank path →
            </Link>
          </div>
        </GlassCard>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard>
            <SectionHeading
              kicker="Process"
              title="How the desk works"
              lede="Register, fund via a future DEX, activate Pro, then review wallets, referrals, and rank."
            />
            <GoldLink href="/how-it-works" variant="ghost" className="mt-6">
              Full walkthrough
            </GoldLink>
          </GlassCard>
          <GlassCard>
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-gold" size={18} />
              <div>
                <h3 className="font-display text-2xl">No risk-free claim</h3>
                <p className="mt-2 text-sm text-muted">
                  Every rate you see is a configured illustration. Capital can be lost.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <RiskDisclaimer compact />
            </div>
          </GlassCard>
        </div>
      </section>
    </MarketingShell>
  );
}
