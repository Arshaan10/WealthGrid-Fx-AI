import { Landmark } from "lucide-react";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { TreasuryTopupForm } from "@/components/admin/TreasuryTopupForm";
import { DataTable } from "@/components/desk/DataTable";
import { StatCard } from "@/components/desk/StatCard";
import { StatusPill } from "@/components/desk/StatusPill";
import { TREASURY_ID, getOrCreateTreasury } from "@/lib/treasury";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function AdminTreasuryPage() {
  await requireAdmin();
  const treasury = await getOrCreateTreasury();
  const movements = await prisma.treasuryMovement.findMany({
    where: { treasuryId: TREASURY_ID },
    include: { actor: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const credits = movements
    .filter((row) => row.direction === "CREDIT")
    .reduce((sum, row) => sum + asNumber(row.amount), 0);
  const debits = movements
    .filter((row) => row.direction === "DEBIT")
    .reduce((sum, row) => sum + asNumber(row.amount), 0);

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Company treasury</h2>
        <p className="mt-2 text-sm text-muted">
          Payout pool that backs auto-approved member withdrawals. Wallet-connect
          / on-chain send is later — today this is a centralized ledger balance.
        </p>
      </GlassCard>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Available for payouts"
          value={formatUsd(treasury.balance)}
          hint="Must cover net withdrawal (after fee)"
          icon={<Landmark size={18} />}
        />
        <StatCard label="Recent credits" value={formatUsd(credits)} hint="Top-ups in this page of movements" />
        <StatCard label="Recent payouts" value={formatUsd(debits)} hint="Debits in this page of movements" />
      </div>
      <TreasuryTopupForm />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Treasury movements</h3>
        <DataTable headers={["When", "Type", "Category", "Amount", "Balance after", "By", "Note"]}>
          {movements.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.direction} />
              </td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">{formatUsd(row.balanceAfter)}</td>
              <td className="px-3 py-3 text-xs text-muted">{row.actor?.email ?? "system"}</td>
              <td className="px-3 py-3 text-xs text-muted">{row.description}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
