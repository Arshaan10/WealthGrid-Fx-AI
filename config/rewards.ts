/**
 * Single source of truth for package, reward, rank, wallet-routing, and cap numbers.
 * Display pages, seed, and the daily reward job all read from here.
 *
 * Caps (enforced in `lib/rewards.ts`, not UI-only):
 *   - Daily trading ROI → up to 2× of activated package principal
 *   - Network rewards   → up to 3× of activated package principal
 *
 * Wallet routing:
 *   - Daily trading credits → Trading wallet, Monday–Friday only
 *   - Network rewards       → Network wallet, 24/7
 *
 * Trading-day calendar is evaluated in `rewardsClock.timezone` (default Asia/Dubai, UTC+4, no DST).
 */

export const brand = {
  name: "Whealth Grid Fx AI",
  shortName: "Whealth Grid",
  tagline: "AI grid intelligence for the Forex desk.",
} as const;

/** IANA timezone for Mon–Fri trading-credit calendar. Dubai has no DST (UTC+4 year-round). */
export const rewardsClock = {
  timezone: "Asia/Dubai",
  /** JS weekday: 0 Sun … 6 Sat. Trading credits run Mon–Fri. */
  tradingWeekdays: [1, 2, 3, 4, 5] as const,
  note: "Daily trading ROI is evaluated in Asia/Dubai (UTC+4, no DST). Credits skip Saturday and Sunday in that zone. Network rewards are available 24/7.",
} as const;

/**
 * Lifetime earning ceilings relative to activated package principal
 * (sum of ACTIVE + COMPLETED activations).
 */
export const caps = {
  /** Daily trading / package ROI: member can earn up to 2× principal. */
  tradingMultiple: 2,
  /** Network / referral / team / rank / loyalty / turnover: up to 3× principal. */
  networkMultiple: 3,
} as const;

export const walletRouting = {
  trading: {
    wallet: "TRADING" as const,
    rewardTypes: ["DAILY"] as const,
    schedule: "Monday–Friday",
    copy: "Trading rewards Mon–Fri → Trading wallet",
    detail:
      "Daily trading ROI credits the Trading wallet only, and only on Monday–Friday in Asia/Dubai time. Saturday and Sunday are skipped.",
  },
  network: {
    wallet: "NETWORK" as const,
    rewardTypes: ["DIRECT", "TEAM", "RANK", "LOYALTY", "TURNOVER"] as const,
    schedule: "24/7",
    copy: "Network rewards 24/7 → Network wallet",
    detail:
      "Direct referral, team trading, ranks, loyalty, and any withdrawal-related network bonuses credit the Network wallet any day of the week.",
  },
} as const;

export type RewardType = "DAILY" | "DIRECT" | "TEAM" | "RANK" | "LOYALTY" | "TURNOVER";
export type WalletKind = "TRADING" | "NETWORK";

export const tradingRewardTypes = walletRouting.trading.rewardTypes;
export const networkRewardTypes = walletRouting.network.rewardTypes;

export function isTradingRewardType(type: string): boolean {
  return (tradingRewardTypes as readonly string[]).includes(type);
}

export function isNetworkRewardType(type: string): boolean {
  return (networkRewardTypes as readonly string[]).includes(type);
}

export function walletForRewardType(type: string): WalletKind {
  return isTradingRewardType(type) ? "TRADING" : "NETWORK";
}

export const packages = [
  {
    slug: "pro",
    name: "Pro",
    minAmountUsd: 50,
    /** Illustrative daily trading credit toward the package — not a guarantee. */
    dailyRatePct: 0.5,
    /**
     * Package-side (trading ROI) ceiling as a percent of activated amount.
     * 200% = 2× cap (`caps.tradingMultiple`).
     */
    maxReturnPct: caps.tradingMultiple * 100,
    /**
     * Network-side ceiling as a percent of activated amount.
     * 300% = 3× cap (`caps.networkMultiple`).
     */
    networkCapPct: caps.networkMultiple * 100,
    blurb:
      "The desk package. Activate from $50 on the Trading wallet. Daily trading ROI credits Trading (Mon–Fri, 2× cap). Network rewards credit Network (24/7, 3× cap). Figures are structured — never guaranteed.",
  },
] as const;

export const referrals = {
  directPct: 7,
  teamLevels: 20,
  /** Declining team-trading schedule for L1–L20 of a downline's daily trading credit. */
  teamTradingPct: [
    3, 2, 1.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.1,
    0.1, 0.1, 0.1, 0.1,
  ] as const,
} as const;

/** Centralized withdrawal fee. Applied to the requested (gross) amount. */
export const withdrawal = {
  feePct: 5,
  note: "A 5% fee is taken from the requested amount. The company treasury books the net immediately. The company hot wallet sends USDT when chain env is configured; status becomes CONFIRMED after the required block confirmations.",
} as const;

export const loyalty = {
  cadence: "weekly",
  /** Illustrative weekly loyalty as a percent of active package principal, booked to Network. */
  weeklyPct: 0.2,
  note: "Loyalty credits are scheduled weekly against qualifying active packages and book to the Network wallet (3× cap, 24/7).",
} as const;

export const businessTurnover = {
  fromRank: "Founder",
  note: "Business-turnover sharing opens at Founder and above and books to the Network wallet.",
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
    blurb: "Founder recognition gift — display catalog only.",
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
