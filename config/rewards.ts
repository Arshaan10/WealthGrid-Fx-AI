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
 * Flash loans: Network available may go negative (liability). While a loan is
 * OUTSTANDING (principal − repaid > 0), loan-funded packages skip daily ROI.
 * Network reward credits auto-apply to `repaid`. After full recovery, ROI
 * starts the next Asia/Dubai calendar day. Next loan cannot be approved until
 * `recoveredAt + flashLoan.coolingMonths`.
 *
 * ROI boosters: member-chosen tier on SELF-funded activations. Daily rate is
 * computed from live ACTIVE direct-referral package volume (see `boosters`).
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
 * Trading 2× uses paid principal (SELF / ADMIN / recovered LOAN).
 * Network 3× includes unpaid LOAN so recovery credits are not cap-blocked.
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
    /**
     * Regular / admin-grant daily trading credit (NONE booster).
     * Booster / Super / Ultra override this from live direct volume.
     */
    dailyRatePct: 1,
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
      "The desk package. Activate from $50 on the Trading wallet, pick an ROI booster tier, or fund with an approved flash loan. Regular and admin-grant desks earn 1%/day (Mon–Fri, 2×). Boosters scale with live active-direct volume. Network rewards credit Network (24/7, 3×). Figures are structured — never guaranteed.",
  },
] as const;

export type FundingSource = "SELF" | "LOAN" | "ADMIN";
export type BoosterTier = "NONE" | "BOOSTER" | "SUPER" | "ULTRA";

/**
 * Personal-investment ROI boosters. Rate is recomputed every daily job from
 * **active direct referral business**: sum of amounts on currently ACTIVE
 * package activations owned by first-line (referredBy) members. Completed or
 * cancelled packages do not count. Volume must remain active continuously —
 * dropping below a threshold lowers the next trading day's rate.
 *
 * Boosters never run on a package while its flash loan is unpaid.
 * All booster (and regular) trading credits still stop at the 2× personal cap.
 */
export const boosters = {
  /** Regular / admin-grant / post-recovery loan packages. */
  regularDailyRatePct: 1,
  activeVolumeDefinition:
    "Active direct business = sum of PackageActivation.amount where status is ACTIVE and the owner is a first-line referral (User.referredById). Must remain ACTIVE continuously; the daily job re-reads live volume each run.",
  tiers: {
    NONE: {
      slug: "NONE" as const,
      name: "Regular",
      maxDailyPct: 1,
      copy: "1%/day toward 2×. Used for admin grants, loan-funded packages after recovery, and members who do not pick a booster.",
      thresholds: [{ minActiveDirectVolume: 0, dailyPct: 1 }],
    },
    BOOSTER: {
      slug: "BOOSTER" as const,
      name: "ROI Booster",
      maxDailyPct: 2,
      copy: "Up to 2%/day when active directs are ≥ $10,000; otherwise 1%/day. Max 2×.",
      thresholds: [
        { minActiveDirectVolume: 10_000, dailyPct: 2 },
        { minActiveDirectVolume: 0, dailyPct: 1 },
      ],
    },
    SUPER: {
      slug: "SUPER" as const,
      name: "Super Booster",
      maxDailyPct: 4,
      copy: "4%/day at ≥ $25,000 active directs; 2%/day at ≥ $10,000; else 1%/day. Max 2×.",
      thresholds: [
        { minActiveDirectVolume: 25_000, dailyPct: 4 },
        { minActiveDirectVolume: 10_000, dailyPct: 2 },
        { minActiveDirectVolume: 0, dailyPct: 1 },
      ],
    },
    ULTRA: {
      slug: "ULTRA" as const,
      name: "Ultra Booster",
      maxDailyPct: 5,
      copy: "5%/day at ≥ $50,000 active directs; 4% at ≥ $25,000; 2% at ≥ $10,000; else 1%/day. Max 2×.",
      thresholds: [
        { minActiveDirectVolume: 50_000, dailyPct: 5 },
        { minActiveDirectVolume: 25_000, dailyPct: 4 },
        { minActiveDirectVolume: 10_000, dailyPct: 2 },
        { minActiveDirectVolume: 0, dailyPct: 1 },
      ],
    },
  },
} as const;

export function boosterTierBySlug(slug: string): BoosterTier {
  if (slug === "BOOSTER" || slug === "SUPER" || slug === "ULTRA" || slug === "NONE") {
    return slug;
  }
  return "NONE";
}

/**
 * Flash-loan policy. Source of truth for an open book is FlashLoan
 * (`principal`, `repaid`, `status`). Network `available` is the liability
 * mirror and is allowed to go negative by the approved principal.
 */
export const flashLoan = {
  coolingMonths: 2,
  /** Must be able to fund a Pro package — otherwise the book cannot be activated. */
  minAmountUsd: packages[0].minAmountUsd,
  maxAmountUsd: 10_000_000,
  note: "Request and approve any amount from the Pro minimum ($50) up to the requested figure. Approval books a FlashLoan and subtracts the approved amount from the Network wallet (available may be negative). Daily ROI does not generate on loan-funded packages while remaining principal > 0. Network reward credits auto-apply to repaid. When remaining hits 0, ROI starts the next Asia/Dubai calendar day under regular 1%/day terms toward 2×. After the first loan is fully recovered, another loan cannot be approved until ≥ 2 months after the recovery date (`coolingUntil`).",
} as const;

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
