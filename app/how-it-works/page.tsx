import type { Metadata } from "next";
import { GoldLink } from "@/components/brand/GoldButton";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  {
    n: "01",
    title: "Open the desk",
    body: "Register with email and password. Optional referral code links you into a first-line tree.",
  },
  {
    n: "02",
    title: "Record a deposit intent",
    body: "Phase 1 cannot talk to a DEX yet. The deposit modal stores a pending intent for admin review.",
  },
  {
    n: "03",
    title: "Activate Pro",
    body: "Once the Trading wallet holds enough available balance, activate from $50. Capital is journaled against the package.",
  },
  {
    n: "04",
    title: "Read the grid",
    body: "Overview shows Trading + Network wallets, active package, and rank. Daily and network credits are structural — not guaranteed.",
  },
  {
    n: "05",
    title: "Grow the bench",
    body: "Share your referral code. Direct 7% books to Network when a referee activates.",
  },
  {
    n: "06",
    title: "Withdraw from the desk",
    body: "Confirming deducts available balance immediately and auto-approves against the company treasury. Wallet-connect on-chain send is later.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading
          kicker="Desk choreography"
          title="From register to auto-approved withdrawal"
          lede="Six beats. The bot aesthetic is atmospheric; the ledger is the system of record."
        />
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.n}>
              <GlassCard className="h-full p-6">
                <p className="font-display text-3xl gold-text">{step.n}</p>
                <h3 className="mt-2 font-display text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm text-muted">{step.body}</p>
              </GlassCard>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <GoldLink href="/register">Create account</GoldLink>
          <GoldLink href="/faq" variant="ghost">
            FAQ
          </GoldLink>
        </div>
        <RiskDisclaimer className="mt-10" />
      </div>
    </MarketingShell>
  );
}
