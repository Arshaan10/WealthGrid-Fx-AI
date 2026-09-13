# Whealth Grid Fx AI

Premium Forex AI grid desk — gold and black. Member desk, admin desk, treasury auto-withdraw, wallet connect, and optional company-wallet USDT payouts.

Marketing site, member dashboard, and admin dashboard on **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Prisma + SQLite**, **NextAuth** (email/password), and **Wagmi / WalletConnect**.

Brand spelling is **Whealth**, not Wealth.

Package, referral, rank, gift, withdrawal-fee, **2× / 3× caps**, **wallet routing**, **ROI boosters**, and **flash loans** live in [`config/rewards.ts`](config/rewards.ts). The daily job that books those credits is `npm run rewards:daily`.

## What is included

- Public pages: Home, About, Packages, Rewards, Ranks, How it works, FAQ, Contact, Login, Register, email verify
- Live Forex pairs ticker (gold/black marquee) on marketing pages and the member desk
- Member desk (`/dashboard`): wallets + ledger, **analytics / reports**, activate Pro (**booster tiers**), **flash loans**, **wallet-connect deposit**, **auto-approved withdraw + optional on-chain send**, referrals, rewards, **support tickets**, profile / KYC-lite
- Admin desk (`/admin`): **platform analytics**, printable reports, treasury / payout pool + company hot-wallet address, users (**block/unblock** + edit withdrawal wallet), **support tickets**, packages/activations (**activate N packages** on behalf of a client), **flash-loan review + ledger**, deposit queue (tx hash + verify), withdrawal history (send status / retry), reward config + **daily reward job**, ranks, announcements CRUD, audit log
- Lifetime business data in Prisma (users, wallets, ledger, packages, referrals, payouts, ranks, intents, treasury, announcements, support tickets, audit)

**This is not a promise of profit.** Daily ~0.5%, **2× trading cap**, and **3× network cap** are a configured structure. Forex involves substantial risk of loss. On-chain sends move real USDT when keys are configured — treat the hot wallet as production funds.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router + React 19 |
| Style | Tailwind CSS, lucide-react, CSS fade-in (hero) |
| Data | Prisma 6 + SQLite (`file:./dev.db`) |
| Auth | NextAuth Credentials + JWT |
| Wallets | Wagmi + viem (injected + WalletConnect) |

SQLite is for local/dev so `npm run dev` works without cloud secrets. To use Postgres later: set `provider = "postgresql"` in `prisma/schema.prisma`, update `DATABASE_URL`, then `npx prisma db push`.

## Setup

```bash
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

**`npm run build && npm start` is the fast local way.** Production Next.js serves precompiled pages. `npm run dev` compiles on each request and feels much slower — that is not the site being “slow” in production.

`npm run db:setup` runs push + seed in one step.

Required env (see `.env.example`):

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="phase1-dev-secret-change-me"
NEXTAUTH_URL="http://localhost:3000"
```

Change `NEXTAUTH_SECRET` before any shared deploy.

### WalletConnect + BSC USDT (optional)

Leave these empty for a **DB-only** desk: withdrawals still auto-approve against treasury, deposits still record intents, and the UI says **on-chain send not configured**.

```
CHAIN_ID=97
RPC_URL="https://bsc-testnet-rpc.publicnode.com"
USDT_CONTRACT_ADDRESS=""
USDT_DECIMALS=18
COMPANY_WALLET_ADDRESS=""
COMPANY_WALLET_PRIVATE_KEY=""
WALLETCONNECT_PROJECT_ID=""
```

| Variable | Where | Notes |
| --- | --- | --- |
| `CHAIN_ID` | Server (+ optional `NEXT_PUBLIC_`) | **56 or 97 only** (BNB Smart Chain). Other IDs fall back to 97. |
| `RPC_URL` | Server (+ optional `NEXT_PUBLIC_`) | Public RPC is fine for reads. Needed for send + deposit verify. |
| `USDT_CONTRACT_ADDRESS` | Server (+ optional `NEXT_PUBLIC_`) | **USDT BEP-20 only.** Mainnet BSC default if unset and `CHAIN_ID=56`: `0x55d398326f99059fF775485246999027B3197955` (18 decimals). Testnet has no official USDT — deploy a BEP-20 test token. ERC-20 / TRC-20 are not accepted. |
| `USDT_DECIMALS` | Server | Default `18` (BSC USDT BEP-20). |
| `COMPANY_WALLET_ADDRESS` | Server (+ optional `NEXT_PUBLIC_`) | Public hot-wallet / deposit address. Shown in member + admin UI. |
| `COMPANY_WALLET_PRIVATE_KEY` | **Server only** | Never commit a real key. Must match `COMPANY_WALLET_ADDRESS`. Build does **not** require this. |
| `WALLETCONNECT_PROJECT_ID` | Server (passed into the client provider) | From [WalletConnect Cloud](https://cloud.walletconnect.com). Enables QR connect for **any** mobile/DEX wallet (Trust, TokenPocket, SafePal, Binance, etc.). Injected browser wallets (MetaMask, Rabby, in-app browsers) work without it. |
| `CONFIRMATIONS_REQUIRED` | Server (+ optional `NEXT_PUBLIC_`) | Blocks before a deposit auto-credits or a payout is marked **CONFIRMED**. Default **3** on chain 97, **15** on chain 56. |

Deposits and withdrawals are **USDT BEP-20 on BNB Smart Chain only**. Any injected Web3 wallet or WalletConnect DEX/mobile wallet can connect. The deposit page can send USDT BEP-20 from the connected wallet; withdrawals pay that same standard to the saved address.

`NEXT_PUBLIC_*` aliases are documented in `.env.example` if you want build-time inlining. The app also reads the server names and passes public values into the Wagmi provider from the member deposit / withdraw / profile layouts only — marketing pages and the dashboard overview do not load WalletConnect.

**Never commit `COMPANY_WALLET_PRIVATE_KEY`.** `.env` and `*.pem` are gitignored.

#### Testnet walkthrough

1. Create a WalletConnect Cloud project and set `WALLETCONNECT_PROJECT_ID`.
2. Keep `CHAIN_ID=97` # 56 or 97 only — BNB Smart Chain / USDT BEP-20 and a public BSC testnet RPC.
3. Deploy or pick a test USDT and set `USDT_CONTRACT_ADDRESS` + `USDT_DECIMALS`.
4. Create a throwaway testnet wallet. Fund it with test BNB (gas) and test USDT.
5. Set `COMPANY_WALLET_ADDRESS` and `COMPANY_WALLET_PRIVATE_KEY` for that wallet.
6. Fund the **DB treasury** on `/admin/treasury` (ledger) **and** the hot wallet (on-chain).
7. Set `CONFIRMATIONS_REQUIRED` (3 is the testnet default).
8. Connect any Web3 / DEX wallet on deposit/withdraw/profile. Deposit by sending **USDT BEP-20** (in-app send or from the wallet) to the company address. After the required confirmations the watcher auto-credits Trading or Network. Withdraw auto-debits the vault, then pays USDT BEP-20 to the connected address.

Without a private key / RPC / USDT contract, skip steps 3–5. The desk stays understandable end-to-end on the seeded demo accounts.

## Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@whealthgrid.com | Admin@12345 |
| Demo member | demo@whealthgrid.com | Demo@12345 |
| Demo downline | member@whealthgrid.com | Member@12345 |
| Outstanding flash loan | loan@whealthgrid.com | Loan@12345 |
| Ultra booster | booster@whealthgrid.com | Booster@12345 |
| Recovered loan / cooling | recovered@whealthgrid.com | Recovered@12345 |

Demo ships with an active **Pro** package, several weeks of **Mon–Fri trading credits** and network rewards (so charts are populated), a pending deposit, **auto-approved** withdrawals, extra downline desks, and a **company treasury** seeded at **$10,000** (minus demo payouts) so members can withdraw.

Referral code on the demo desk: `WG-DEMO01`. Seed users have unique phones and a verified inbox so deposit/withdraw works immediately.

`member@` ships with a **pending flash-loan application** ($800) for admin review. `loan@` has an **outstanding $500 loan** (Network **−$350** after a $150 recovery sample) and a loan-funded package with daily ROI paused. `booster@` holds an **Ultra** $200 package with two admin-granted whale directs ($30,000 + $25,000 = **$55,000** active direct volume → **5%/day**). `recovered@` has a fully recovered loan and an active **2-month cooling** window. Demo also has a second **admin-granted** $150 package so multi-package desks are visible.

## Forex ticker

`GET /api/fx` pulls major pairs from the keyless [ExchangeRate-API open endpoint](https://www.exchangerate-api.com/docs/free) (`open.er-api.com`) and is cached for 60 seconds (`Cache-Control: public, s-maxage=60, stale-while-revalidate=120`). The ticker paints immediately with an indicative book, then refreshes client-side after mount so the FX fetch never blocks first paint. If the public feed is unreachable, the desk keeps the mock book (including XAUUSD). The marquee sits under the marketing header and at the top of the member dashboard.

## Identity (KYC-lite)

One desk per person:

- Unique **email** and unique **phone** — register and profile update reject duplicates (“login instead of opening a second desk”).
- Required fields: **full name**, **phone**, **verified email**.
- Email verify is a **local token stub** (no SMTP). Register and Profile issue `/verify-email?token=…`. Seed accounts are already verified.
- Blocked or incomplete identity cannot **deposit** or **withdraw**.

## Admin user controls

From `/admin/users/[id]`:

- **Block / unblock** — blocked users cannot login, deposit, or withdraw.
- View and edit that member’s **withdrawal wallet address**.

## Support tickets

- Member: `/dashboard/support` — create, list own tickets, reply.
- Admin: `/admin/support` — list all, reply, set status **OPEN / PENDING / CLOSED**.
- Stored as `SupportTicket` + `SupportMessage` in Prisma.

## Reward structure, caps, and wallet routing

Numbers and routing rules live in [`config/rewards.ts`](config/rewards.ts) and are **enforced** in [`lib/rewards.ts`](lib/rewards.ts) — not UI-only.

### Caps

| Book | Multiple | Basis | Wallet |
| --- | --- | --- | --- |
| Daily trading ROI | **2×** (`caps.tradingMultiple`, `maxReturnPct` 200) | Sum of ACTIVE + COMPLETED **paid** principal (SELF / ADMIN / recovered LOAN). Unpaid flash-loan packages are excluded so they cannot inflate Trading ROI. | Trading |
| Network rewards | **3×** (`caps.networkMultiple`, `networkCapPct` 300) | All ACTIVE + COMPLETED principal **including unpaid LOAN**, so recovery credits can still book | Network |

Progress bars on the member overview and package/rewards pages show earned vs each ceiling. When the 2× trading book is full, further daily credits are skipped and the package is marked **COMPLETED**.

### Wallet routing

- **Trading rewards Mon–Fri → Trading wallet.** Daily ROI (`DAILY`) is the only trading-book type. Saturday and Sunday are skipped.
- **Network rewards 24/7 → Network wallet.** Direct referral, team trading, ranks, loyalty, turnover, and any withdrawal-related network bonuses.
- Withdrawals stay split: the member picks Trading or Network. Analytics show both vaults.

### Timezone

Trading days are evaluated in **`Asia/Dubai`** (`rewardsClock.timezone`, UTC+4, no DST). Change the IANA name in config if the desk should use UTC or another zone; the job, seed, and UI all read that value.

### Daily reward job

```bash
npm run rewards:daily
npm run rewards:daily -- --date=2026-09-11
```

Or **Admin desk → Reward config → Run daily rewards** (`POST /api/admin/rewards/run`).

The job is idempotent (`RewardPayout.periodKey`, e.g. `DAILY:2026-09-12:<activationId>`). For each active package it:

1. **Skips daily ROI** on a package while its flash loan is outstanding, or before `roiStartsOn` (the next Asia/Dubai calendar day after full recovery).
2. Credits **Mon–Fri** daily ROI to **Trading** at the live booster / regular rate, respecting the **2×** remaining cap.
3. Credits **team-trading** percents of that day’s daily amount up the referral tree to **Network** (**3×** cap, any day).
4. Credits **weekly loyalty** (`loyalty.weeklyPct`) to **Network** once per ISO week per package (**3×** cap, 24/7).
5. **Auto-applies** every Network reward credit to any outstanding `FlashLoan.repaid`. When remaining principal hits 0 the loan is marked **RECOVERED**, `coolingUntil` is set to recovery + 2 months, and loan-funded packages get `roiStartsOn` = next Asia/Dubai day.

Legacy seed keys (`DAILY:YYYY-MM-DD`, `LOYALTY:YYYY-Www`) are still treated as already paid so a re-run does not double-book historical demo days.

Schedule it with cron if you want unattended runs, for example Monday–Friday after Dubai midnight:

```cron
5 0 * * 1-5 cd /path/to/app && npm run rewards:daily
```

## Flash loans

Member path: `/dashboard/loans` → apply for any amount **≥ Pro minimum ($50)** → admin reviews on `/admin/loans` → approve any amount **between $50 and the request** (or reject) → member activates a **loan-funded package** for the approved amount. Amounts below $50 cannot fund Pro and are rejected at apply/approve so the book cannot get stuck.

**Source of truth** is the `FlashLoan` row: `principal`, `repaid`, `status`. Remaining = `principal − repaid`. Approval also **debits Network available** by the approved amount (`allowNegative`), so the vault can show **−$500**. That negative balance is the liability mirror — Network rewards still credit the wallet (moving it toward zero) and increment `repaid`.

| Rule | Behaviour |
| --- | --- |
| While outstanding | Daily ROI does **not** generate on the **loan-funded package(s)**. Other packages on the same desk still earn if they are not loan-funded. Unpaid loan principal does **not** enlarge the 2× trading basis (so a sibling SELF package cannot harvest extra Trading ROI). It **does** count toward the 3× network basis so DIRECT / TEAM / LOYALTY credits can book and advance `repaid`. Hitting 2× on paid packages does not complete the still-outstanding loan package. |
| Recovery | Network reward types (`DIRECT`, `TEAM`, `RANK`, `LOYALTY`, `TURNOVER`) auto-apply to `repaid`. |
| Fully recovered | `status = RECOVERED`, `recoveredAt` set, Network liability cleared by the credits. ROI on that package starts the **next Asia/Dubai calendar day** at regular **1%/day** toward **2×**. After 2× the member renews as today. |
| Cooling | After the first loan is fully recovered, another loan **cannot be approved** until `recoveredAt + 2 months` (`coolingUntil`, Asia/Dubai calendar months). Members may still submit an application during cooling; ops cannot approve. |

Withdrawals still require **non-negative** available cover, so a desk cannot withdraw a Network liability.

## ROI boosters

Configured in [`config/rewards.ts`](config/rewards.ts) → `boosters`. Member chooses a tier when activating **with own Trading funds** (`fundingSource = SELF`). Admin grants and loan-funded packages use **Regular (NONE)** at **1%/day**.

**Active direct business** (re-read every daily job): sum of `PackageActivation.amount` where `status = ACTIVE` and the owner is a first-line referral (`User.referredById`). Completed / cancelled packages do not count. Volume must remain active continuously — if a direct’s package completes, the sponsor’s rate can drop the next trading day.

| Tier | $0 | ≥ $10,000 | ≥ $25,000 | ≥ $50,000 | Cap |
| --- | --- | --- | --- | --- | --- |
| Regular (NONE) | 1% | 1% | 1% | 1% | 2× |
| ROI Booster | 1% | 2% | 2% | 2% | 2× |
| Super Booster | 1% | 2% | 4% | 4% | 2× |
| Ultra Booster | 1% | 2% | 4% | 5% | 2× |

Boosters never run on a package while its flash loan is unpaid.

## Admin package activation

From `/admin/packages` or a user detail page, ops can activate **N packages** (1–20) for any member.

- Default **regular grant** (`fundingSource = ADMIN`): no Trading debit, **1%/day** toward **2×**, participates in the daily job immediately.
- Optional **flash-loan funded** (single package): uses an unused approved loan, or creates and approves one for the entered amount (cooling / outstanding rules still apply).

Multiple packages per user are allowed (self, loan, and admin). The 2× / 3× ceilings stay on **sum of ACTIVE + COMPLETED principal**.

## Reward structure (config)

- **Pro** from **$50**
- Regular / admin-grant daily **1%**, booster tiers up to **5%**, trading ceiling **2× (200%)**, network ceiling **3× (300%)**
- Direct referral **7%** → Network wallet
- Team trading **L1–L20** (declining schedule in config) → Network wallet
- Ranks: **Elite 1–7**, **Director**, **Founder**
- Loyalty: weekly, Network wallet
- Business turnover: Founder+ (display / Network when paid)
- Gift catalog: earbuds, phone, laptop, MacBook, trips, cars (display items)
- **Withdrawal fee 5%** (`withdrawal.feePct` in config)

## Treasury, withdrawals, and on-chain send

Admin **treasury** is the DB payout float. Real USDT leaves a **company hot wallet** configured via env.

### Safer rule (block, do not reserve)

Withdrawals **do not reserve first and settle later**. On confirm the API checks **both** balances inside a single Prisma transaction:

1. Member has enough **available** balance on the selected wallet (`TRADING` or `NETWORK`).
2. Treasury can cover the **net** payout (requested amount minus the configured fee).

If either check fails, **nothing is written** and the member sees a clear error (`Insufficient available balance` or `Insufficient treasury funds…`). The dashboard balance only changes on success.

### Happy path

1. Admin funds the DB pool on [`/admin/treasury`](app/admin/treasury/page.tsx) and funds the hot wallet with USDT + gas.
2. Member connects a wallet (saved to `User.walletAddress`) and confirms an amount on [`/dashboard/withdraw`](app/dashboard/withdraw/page.tsx). Destination is editable.
3. Gross amount is **debited immediately** from the selected wallet.
4. Fee (`config/rewards.ts` → `withdrawal.feePct`, currently **5%**) is withheld from the request.
5. Treasury is debited the **net**. A `WithdrawalRequest` is stored as **APPROVED**.
6. If payout env is complete, the server broadcasts a USDT `transfer` of the **net** amount (`CONFIRMING`). After `CONFIRMATIONS_REQUIRED` the watcher marks it **CONFIRMED**. **FAILED_SEND** can be retried on `/admin/queue`. Sends are **idempotent** — a row with a tx hash is never paid twice.
7. If no private key / RPC / token / company address is set, the row stays **APPROVED** and the UI shows **on-chain send not configured**.
8. Both Trading and Network vault balances refresh on the withdraw page after a successful debit.

Example: withdraw **$100** from Trading → member available **−$100**, fee **$5**, treasury **−$95**, then an on-chain USDT transfer of **95** when configured.

### Deposits

1. Member connects a wallet and copies the company address.
2. They send USDT on the configured chain and record amount + tx hash (or tap **Watch recent transfer** when RPC is set).
3. The deposit watcher (`/api/desk/sync`, also run on dashboard/deposit/withdraw load) checks the public RPC. When a matching USDT transfer reaches `CONFIRMATIONS_REQUIRED`, the chosen vault is **auto-credited**. No admin click on that happy path. The same tx hash cannot be reused.
4. Unmatched intents stay **PENDING** for admin monitoring. Approve remains a fallback only. No treasury movement on deposits.

### Legacy reserved withdrawals

Phase 1 could leave `PENDING` reserved withdrawals. Those still appear under a legacy section on the deposit queue. Approving them now also requires treasury cover (same block-if-short rule). New withdrawals never enter that path.

## Scripts

```bash
npm run build && npm start   # fast local (production)
npm run dev                  # slower — compiles on demand
npm run lint
npm run db:push
npm run db:seed
npm run db:setup
npm run rewards:daily
npm run rewards:daily -- --date=2026-09-11
```

`npm run build` must succeed without a real private key. Use `npm start` after a build when judging load time.

## Repo map

```
app/                 # routes + API (incl. /dashboard/reports, /admin/reports, /api/admin/rewards/run)
components/          # marketing, desk, brand, charts, wallet connect (desk-scoped)
config/rewards.ts    # package / rank / 2× 3× caps / wallet routing / timezone / boosters / flash loan
lib/rewards.ts       # cap + routing enforcement + daily job
lib/flash-loans.ts   # apply / approve / recover / cooling
lib/boosters.ts      # live active-direct volume → daily rate
lib/packages.ts      # shared SELF / LOAN / ADMIN activation
lib/analytics.ts     # Prisma aggregates for desk charts
lib/clock.ts         # Asia/Dubai calendar helpers
lib/withdraw.ts      # auto-approve + treasury cover check
lib/treasury.ts      # payout pool helpers
lib/chain.ts         # public chain / company wallet config
lib/payout.ts        # idempotent company-wallet USDT send
lib/onchain.ts       # deposit verify + confirmation count + Transfer watch
lib/desk-sync.ts     # member deposit/payout watcher used by /api/desk/sync
lib/fx.ts            # public FX quotes + mock fallback
lib/access.ts        # blocked / KYC / one-identity checks
scripts/rewards-daily.ts
prisma/schema.prisma # SQLite-first, Postgres-ready models
prisma/seed.ts
```
