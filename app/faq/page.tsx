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
    a: "Not yet. Deposit still records an admin-reviewed intent. Withdrawals auto-approve against the company treasury and deduct your dashboard balance immediately. Wallet-connect on-chain send ships later.",
  },
  {
    q: "What happens if the company treasury is empty?",
    a: "The withdrawal is blocked and your wallet is not deducted. Admins top up the payout pool on the Treasury desk first.",
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
