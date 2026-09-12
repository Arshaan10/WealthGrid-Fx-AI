import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function WalletsPage() {
  const session = await requireUser();
  const [wallets, ledger] = await Promise.all([
    prisma.walletBalance.findMany({ where: { userId: session.user.id } }),
    prisma.ledgerEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {wallets.map((wallet) => (
          <GlassCard key={wallet.id}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{wallet.type}</p>
            <p className="mt-2 font-display text-4xl gold-text">{formatUsd(wallet.available)}</p>
            <p className="mt-2 text-sm text-muted">Pending {formatUsd(wallet.pending)}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h2 className="mb-4 font-display text-2xl">Ledger</h2>
        <DataTable headers={["When", "Wallet", "Dir", "Category", "Amount", "After", "Memo"]}>
          {ledger.map((row) => (
            <tr key={row.id} className="text-sm">
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{row.direction}</td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
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
