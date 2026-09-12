import { GlassCard } from "@/components/brand/GlassCard";
import { GoldButton } from "@/components/brand/GoldButton";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { ReportActions } from "@/components/desk/ReportActions";
import { RoutingBanner } from "@/components/desk/RoutingBanner";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

const CATEGORIES = ["DEPOSIT", "WITHDRAWAL", "PACKAGE", "REWARD", "REFERRAL", "ADJUSTMENT", "FEE"] as const;
const WALLETS = ["TRADING", "NETWORK"] as const;

export default async function UserReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ wallet?: string; category?: string; from?: string; to?: string }>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const wallet = WALLETS.includes(params.wallet as (typeof WALLETS)[number]) ? params.wallet : undefined;
  const category = CATEGORIES.includes(params.category as (typeof CATEGORIES)[number])
    ? params.category
    : undefined;
  const from = params.from ? new Date(`${params.from}T00:00:00.000Z`) : undefined;
  const to = params.to ? new Date(`${params.to}T23:59:59.999Z`) : undefined;

  const rows = await prisma.ledgerEntry.findMany({
    where: {
      userId: session.user.id,
      ...(wallet ? { walletType: wallet } : {}),
      ...(category ? { category } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const exportRows = rows.map((row) => [
    formatDate(row.createdAt),
    row.walletType,
    row.direction,
    row.category,
    formatUsd(row.amount),
    formatUsd(row.balanceAfter),
    row.description,
  ]);

  return (
    <div className="space-y-6 print-sheet">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Member reports</p>
            <h2 className="font-display text-3xl">Ledger & reward history</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Filter the desk journal, then export CSV or print a clean table. Trading credits book
              Mon–Fri only; network credits book any day.
            </p>
          </div>
          <ReportActions
            filename="whealth-ledger"
            headers={["When", "Wallet", "Direction", "Category", "Amount", "Balance after", "Memo"]}
            rows={exportRows}
          />
        </div>
      </GlassCard>
      <RoutingBanner />
      <GlassCard className="no-print p-5">
        <form className="grid gap-3 md:grid-cols-5" action="/dashboard/reports">
          <label className="text-xs text-muted">
            Wallet
            <select name="wallet" defaultValue={wallet ?? ""} className="mt-1 w-full rounded-md px-3 py-2 text-sm">
              <option value="">All</option>
              {WALLETS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Category
            <select
              name="category"
              defaultValue={category ?? ""}
              className="mt-1 w-full rounded-md px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            From
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              className="mt-1 w-full rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-muted">
            To
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              className="mt-1 w-full rounded-md px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <GoldButton type="submit" className="w-full px-4 py-2 text-xs">
              Apply filters
            </GoldButton>
          </div>
        </form>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <DataTable
          headers={["When", "Wallet", "Dir", "Category", "Amount", "Balance", "Memo"]}
          empty="No ledger rows match these filters."
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{row.direction}</td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">
                {row.direction === "DEBIT" ? "−" : "+"}
                {formatUsd(row.amount)}
              </td>
              <td className="px-3 py-3">{formatUsd(row.balanceAfter)}</td>
              <td className="px-3 py-3 text-muted">{row.description}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
