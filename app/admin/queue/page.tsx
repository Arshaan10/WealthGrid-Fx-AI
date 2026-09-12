import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { QueueTable } from "@/components/admin/QueueTable";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function AdminQueuePage() {
  await requireAdmin();
  const [deposits, withdrawals] = await Promise.all([
    prisma.depositIntent.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">DEX queue</h2>
        <p className="mt-2 text-sm text-muted">
          Approve credits the wallet. Reject leaves deposits untouched and
          restores reserved withdrawals. No chain settlement.
        </p>
      </GlassCard>
      <QueueTable
        title="Deposits"
        kind="deposit"
        rows={deposits.map((row) => ({
          id: row.id,
          user: `${row.user.name} · ${row.user.email}`,
          amount: formatUsd(row.amount),
          extra: row.walletType,
          status: row.status,
          when: formatDate(row.createdAt),
          pending: row.status === "PENDING",
        }))}
      />
      <QueueTable
        title="Withdrawals"
        kind="withdrawal"
        rows={withdrawals.map((row) => ({
          id: row.id,
          user: `${row.user.name} · ${row.user.email}`,
          amount: formatUsd(row.amount),
          extra: row.toAddress ?? row.walletType,
          status: row.status,
          when: formatDate(row.createdAt),
          pending: row.status === "PENDING",
        }))}
      />
      <RiskDisclaimer compact />
    </div>
  );
}
