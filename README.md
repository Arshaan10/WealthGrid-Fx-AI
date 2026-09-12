# Whealth Grid Fx AI

Premium Forex AI grid desk — gold and black, Phase 1 plus treasury auto-withdraw.

Marketing site, member dashboard, and admin dashboard on **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Prisma + SQLite**, and **NextAuth** (email/password). Deposits remain **DEX placeholders** (admin-reviewed intents). Withdrawals are **auto-approved** against a company **treasury / payout pool**. Wallet-connect on-chain send is later.

Brand spelling is **Whealth**, not Wealth.

Package, referral, rank, gift, and withdrawal-fee numbers live in [`config/rewards.ts`](config/rewards.ts).

## What is included

- Public pages: Home, About, Packages, Rewards, Ranks, How it works, FAQ, Contact, Login, Register
- Member desk (`/dashboard`): wallets + ledger, activate Pro, deposit stub, **auto-approved withdraw**, referrals, rewards, profile
- Admin desk (`/admin`): treasury / payout pool, users, packages/activations, deposit queue, withdrawal history, reward config view, ranks, announcements CRUD, audit log
- Lifetime business data in Prisma (users, wallets, ledger, packages, referrals, payouts, ranks, intents, treasury, announcements, audit)

**This is not a promise of profit.** Daily ~0.5%, 250% package cap, and 400% network figures are a configured structure. Forex involves substantial risk of loss.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router + React 19 |
| Style | Tailwind CSS, lucide-react, framer-motion (hero only) |
| Data | Prisma 6 + SQLite (`file:./dev.db`) |
| Auth | NextAuth Credentials + JWT |

SQLite is for local/dev so `npm run dev` works without cloud secrets. To use Postgres later: set `provider = "postgresql"` in `prisma/schema.prisma`, update `DATABASE_URL`, then `npx prisma db push`.

## Setup

```bash
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run db:setup` runs push + seed in one step.

Required env (see `.env.example`):

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="phase1-dev-secret-change-me"
NEXTAUTH_URL="http://localhost:3000"
```

Change `NEXTAUTH_SECRET` before any shared deploy.

## Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@whealthgrid.com | Admin@12345 |
| Demo member | demo@whealthgrid.com | Demo@12345 |
| Demo downline | member@whealthgrid.com | Member@12345 |

Demo ships with an active **Pro** package, sample ledger, a pending deposit, an **auto-approved** withdrawal, and a **company treasury** seeded at **$10,000** (minus the demo payout) so members can withdraw.

Referral code on the demo desk: `WG-DEMO01`.

## Reward structure (config)

- **Pro** from **$50**
- Illustrative daily **~0.5%**, package ceiling **~250%**, network toward **~400%**
- Direct referral **7%**
- Team trading **L1–L20** (declining schedule in config)
- Ranks: **Elite 1–7**, **Director**, **Founder**
- Loyalty: weekly (display)
- Business turnover: Founder+ (display)
- Gift catalog: earbuds, phone, laptop, MacBook, trips, cars (display items)
- **Withdrawal fee 5%** (`withdrawal.feePct` in config)

## Treasury and withdrawals

This is a **centralized DB payout** against admin treasury. Wallet-connect / on-chain send is future work.

### Safer rule (block, do not reserve)

Withdrawals **do not reserve first and settle later**. On confirm the API checks **both** balances inside a single Prisma transaction:

1. Member has enough **available** balance on the selected wallet (`TRADING` or `NETWORK`).
2. Treasury can cover the **net** payout (requested amount minus the configured fee).

If either check fails, **nothing is written** and the member sees a clear error (`Insufficient available balance` or `Insufficient treasury funds…`). The dashboard balance only changes on success.

### Happy path

1. Admin funds the pool on [`/admin/treasury`](app/admin/treasury/page.tsx) (ledger + audit).
2. Member confirms an amount on [`/dashboard/withdraw`](app/dashboard/withdraw/page.tsx).
3. Gross amount is **debited immediately** from the selected wallet.
4. Fee (`config/rewards.ts` → `withdrawal.feePct`, currently **5%**) is withheld from the request.
5. Treasury is debited the **net**. A `WithdrawalRequest` is stored as **APPROVED**.
6. Admin reviews history on `/admin/queue` and treasury movements on `/admin/treasury`. No approve/reject step.

Example: withdraw **$100** from Trading → member available **−$100**, fee **$5**, treasury **−$95**, status **APPROVED**.

### Deposits

Unchanged Phase 1 stub: record an intent, admin approve/reject on `/admin/queue`. Approve credits the member wallet. No treasury movement.

### Legacy reserved withdrawals

Phase 1 could leave `PENDING` reserved withdrawals. Those still appear under a legacy section on the deposit queue. Approving them now also requires treasury cover (same block-if-short rule). New withdrawals never enter that path.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run db:push
npm run db:seed
npm run db:setup
```

## Repo map

```
app/                 # routes + API
components/          # marketing, desk, brand
config/rewards.ts    # package / rank / withdrawal fee
lib/withdraw.ts      # auto-approve + treasury cover check
lib/treasury.ts      # payout pool helpers
prisma/schema.prisma # SQLite-first, Postgres-ready models
prisma/seed.ts
```
