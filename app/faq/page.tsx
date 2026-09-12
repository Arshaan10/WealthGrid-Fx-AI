import type { Metadata } from "next";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    q: "Is the 0.5% daily a guaranteed return?",
    a: "No. It is an illustrative structure stored in config. Markets can produce losses. Never treat Whealth Grid Fx AI as risk-free.",
  },
  {
    q: "Why is the brand spelled Whealth?",
    a: "Whealth is the product name — a deliberate spelling, not a typo for Wealth.",
  },
  {
    q: "Can I deposit USDT on-chain today?",
    a: "Not in Phase 1. The deposit and withdraw screens record intents and show a “connect wallet (coming next)” placeholder.",
  },
  {
    q: "Where do lifetime records live?",
    a: "In this application’s database via Prisma (SQLite locally, Postgres-ready). That includes wallets, ledger, packages, ranks, and audit.",
  },
  {
    q: "How do ranks and gifts work?",
    a: "Ranks Elite 1–7, Director, and Founder are displayed and stored on the user. The gift catalog is recognition copy only in Phase 1.",
  },
  {
    q: "Who can open the admin desk?",
    a: "Accounts with role ADMIN. The seed admin is admin@whealthgrid.com.",
  },
];

export default function FaqPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionHeading kicker="Clarity" title="Frequently asked" />
        <div className="mt-10 space-y-4">
          {faqs.map((item) => (
            <GlassCard key={item.q} className="p-6">
              <h3 className="font-display text-2xl">{item.q}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </GlassCard>
          ))}
        </div>
        <RiskDisclaimer className="mt-10" />
      </div>
    </MarketingShell>
  );
}
