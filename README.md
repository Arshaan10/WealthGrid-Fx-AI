# Whealth Grid Fx AI

Premium Forex AI grid desk — gold and black. Member desk, admin desk, treasury auto-withdraw, wallet connect, and optional company-wallet USDT payouts.

Marketing site, member dashboard, and admin dashboard on **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Prisma + SQLite**, **NextAuth** (email/password), and **Wagmi / WalletConnect**.

Brand spelling is **Whealth**, not Wealth.

Package, referral, rank, gift, and withdrawal-fee numbers live in [`config/rewards.ts`](config/rewards.ts).

## What is included

- Public pages: Home, About, Packages, Rewards, Ranks, How it works, FAQ, Contact, Login, Register
- Member desk (`/dashboard`): wallets + ledger, activate Pro, **wallet-connect deposit**, **auto-approved withdraw + optional on-chain send**, referrals, rewards, profile
- Admin desk (`/admin`): treasury / payout pool + company hot-wallet address, users, packages/activations, deposit queue (tx hash + verify), withdrawal history (send status / retry), reward config view, ranks, announcements CRUD, audit log
- Lifetime business data in Prisma (users, wallets, ledger, packages, referrals, payouts, ranks, intents, treasury, announcements, audit)

**This is not a promise of profit.** Daily ~0.5%, 250% package cap, and 400% network figures are a configured structure. Forex involves substantial risk of loss. On-chain sends move real USDT when keys are configured — treat the hot wallet as production funds.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router + React 19 |
| Style | Tailwind CSS, lucide-react, framer-motion (hero only) |
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
| `CHAIN_ID` | Server (+ optional `NEXT_PUBLIC_`) | Default **97** (BSC testnet). Use **56** for BSC mainnet. |
| `RPC_URL` | Server (+ optional `NEXT_PUBLIC_`) | Public RPC is fine for reads. Needed for send + deposit verify. |
| `USDT_CONTRACT_ADDRESS` | Server (+ optional `NEXT_PUBLIC_`) | BEP-20/ERC-20 USDT. Mainnet BSC default if unset and `CHAIN_ID=56`: `0x55d398326f99059fF775485246999027B3197955` (18 decimals). Testnet has no official USDT — deploy or use a faucet token. |
| `USDT_DECIMALS` | Server | Default `18` (BSC USDT). Ethereum USDT is `6`. |
| `COMPANY_WALLET_ADDRESS` | Server (+ optional `NEXT_PUBLIC_`) | Public hot-wallet / deposit address. Shown in member + admin UI. |
| `COMPANY_WALLET_PRIVATE_KEY` | **Server only** | Never commit a real key. Must match `COMPANY_WALLET_ADDRESS`. Build does **not** require this. |
| `WALLETCONNECT_PROJECT_ID` | Server (passed into the client provider) | From [WalletConnect Cloud](https://cloud.walletconnect.com). Injected wallets work without it. |
| `CONFIRMATIONS_REQUIRED` | Server (+ optional `NEXT_PUBLIC_`) | Blocks before a deposit auto-credits or a payout is marked **CONFIRMED**. Default **3** on chain 97, **15** on chain 56. |

`NEXT_PUBLIC_*` aliases are documented in `.env.example` if you want build-time inlining. The app also reads the server names and passes public values into the Wagmi provider from the root layout.

**Never commit `COMPANY_WALLET_PRIVATE_KEY`.** `.env` and `*.pem` are gitignored.

#### Testnet walkthrough

1. Create a WalletConnect Cloud project and set `WALLETCONNECT_PROJECT_ID`.
2. Keep `CHAIN_ID=97` and a public BSC testnet RPC.
3. Deploy or pick a test USDT and set `USDT_CONTRACT_ADDRESS` + `USDT_DECIMALS`.
4. Create a throwaway testnet wallet. Fund it with test BNB (gas) and test USDT.
5. Set `COMPANY_WALLET_ADDRESS` and `COMPANY_WALLET_PRIVATE_KEY` for that wallet.
6. Fund the **DB treasury** on `/admin/treasury` (ledger) **and** the hot wallet (on-chain).
7. Set `CONFIRMATIONS_REQUIRED` (3 is the testnet default).
8. Connect a member wallet on deposit/withdraw/profile. Deposit by sending test USDT to the company address. After the required confirmations the watcher auto-credits Trading or Network. Withdraw auto-debits the vault, then confirms the payout tx.

Without a private key / RPC / USDT contract, skip steps 3–5. The desk stays understandable end-to-end on the seeded demo accounts.

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
npm run dev
npm run build
npm run lint
npm run db:push
npm run db:seed
npm run db:setup
```

`npm run build` must succeed without a real private key.

## Repo map

```
app/                 # routes + API
components/          # marketing, desk, brand, wallet connect
config/rewards.ts    # package / rank / withdrawal fee
lib/withdraw.ts      # auto-approve + treasury cover check
lib/treasury.ts      # payout pool helpers
lib/chain.ts         # public chain / company wallet config
lib/payout.ts        # idempotent company-wallet USDT send
lib/onchain.ts       # deposit verify + confirmation count + Transfer watch
lib/desk-sync.ts     # member deposit/payout watcher used by /api/desk/sync
prisma/schema.prisma # SQLite-first, Postgres-ready models
prisma/seed.ts
```
