/**
 * Single source of truth for Phase 1 package, reward, and rank numbers.
 * Display pages and seed read from here. Live payout engines land in a later phase.
 */

export const brand = {
  name: "Whealth Grid Fx AI",
  shortName: "Whealth Grid",
  tagline: "AI grid intelligence for the Forex desk.",
} as const;

export const packages = [
  {
    slug: "pro",
    name: "Pro",
    minAmountUsd: 50,
    /** Illustrative daily trading credit toward the package — not a guarantee. */
    dailyRatePct: 0.5,
    /** Cap on package-side credits relative to activated amount. */
    maxReturnPct: 250,
    /** Network-side credits toward a higher composite cap. */
    networkCapPct: 400,
    blurb:
      "The Phase 1 desk package. Activate from $50 on the Trading wallet. Daily credits and network rewards are structured — never guaranteed.",
  },
] as const;

export const referrals = {
  directPct: 7,
  teamLevels: 20,
  /** Illustrative declining team-trading schedule for L1–L20 (config only in Phase 1). */
  teamTradingPct: [
    3, 2, 1.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.1,
    0.1, 0.1, 0.1, 0.1,
  ] as const,
} as const;

/** Centralized withdrawal fee. Applied to the requested (gross) amount. */
export const withdrawal = {
  feePct: 5,
  note: "A 5% fee is taken from the requested amount. The company treasury books the net; the company hot wallet sends USDT when chain env is configured.",
} as const;

export const loyalty = {
  cadence: "weekly",
  note: "Loyalty credits are scheduled weekly against qualifying active packages.",
} as const;

export const businessTurnover = {
  fromRank: "Founder",
  note: "Business-turnover sharing opens at Founder and above.",
} as const;

export type RankTier = "none" | "elite" | "director" | "founder";

export const ranks = [
  { slug: "none", name: "Unranked", tier: "none" as RankTier, order: 0 },
  { slug: "elite-1", name: "Elite 1", tier: "elite" as RankTier, order: 1 },
  { slug: "elite-2", name: "Elite 2", tier: "elite" as RankTier, order: 2 },
  { slug: "elite-3", name: "Elite 3", tier: "elite" as RankTier, order: 3 },
  { slug: "elite-4", name: "Elite 4", tier: "elite" as RankTier, order: 4 },
  { slug: "elite-5", name: "Elite 5", tier: "elite" as RankTier, order: 5 },
  { slug: "elite-6", name: "Elite 6", tier: "elite" as RankTier, order: 6 },
  { slug: "elite-7", name: "Elite 7", tier: "elite" as RankTier, order: 7 },
  { slug: "director", name: "Director", tier: "director" as RankTier, order: 8 },
  { slug: "founder", name: "Founder", tier: "founder" as RankTier, order: 9 },
] as const;

export const giftCatalog = [
  {
    slug: "earbuds",
    name: "Wireless earbuds",
    category: "Audio",
    minRank: "Elite 1",
    blurb: "Desk-ready monitors for signal review sessions.",
  },
  {
    slug: "phone",
    name: "Flagship phone",
    category: "Mobile",
    minRank: "Elite 3",
    blurb: "Always-on desk companion for rank and wallet alerts.",
  },
  {
    slug: "laptop",
    name: "Performance laptop",
    category: "Compute",
    minRank: "Elite 5",
    blurb: "Portable station for reviewing grid journals on the road.",
  },
  {
    slug: "macbook",
    name: "MacBook",
    category: "Compute",
    minRank: "Elite 7",
    blurb: "Director-track workstation for high-volume partners.",
  },
  {
    slug: "trip",
    name: "Luxury trip",
    category: "Travel",
    minRank: "Director",
    blurb: "Invitation travel for Director-tier recognition events.",
  },
  {
    slug: "car",
    name: "Performance car",
    category: "Auto",
    minRank: "Founder",
    blurb: "Founder recognition gift — display catalog only in Phase 1.",
  },
] as const;

export const riskDisclaimer = {
  short:
    "Forex and leveraged products involve substantial risk of loss. Figures on this site are structural illustrations, not guarantees of profit.",
  long: `Whealth Grid Fx AI presents package rates, network percentages, ranks, and gift catalogs as a configured reward structure for product education. Nothing here is a promise of profit, a risk-free return, or investment advice. Foreign-exchange and CFD-style exposure can result in the loss of some or all capital. Past or modelled performance is not indicative of future results. Member withdrawals auto-approve against the company treasury (payout pool) and deduct available wallet balance immediately. When a company hot wallet is configured, the net USDT is then sent on-chain to the member address; otherwise the booking stays on the ledger. Deposits show the company address — submit a tx hash for verification or admin confirm. Participate only with capital you can afford to lose and seek independent advice where required.`,
} as const;

export function packageBySlug(slug: string) {
  return packages.find((item) => item.slug === slug);
}

export function rankBySlug(slug: string) {
  return ranks.find((item) => item.slug === slug) ?? ranks[0];
}
