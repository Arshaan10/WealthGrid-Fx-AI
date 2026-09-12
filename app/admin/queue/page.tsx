import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { QueueTable } from "@/components/admin/QueueTable";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
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

  const leftoverPending = withdrawals.filter((row) => row.status === "PENDING");

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Deposit queue</h2>
        <p className="mt-2 text-sm text-muted">
          Deposits stay as Phase 1 stubs — approve credits the member wallet.
          New withdrawals auto-approve against treasury and no longer need this
          desk. Legacy reserved withdrawals, if any, can still be settled here.
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
      {leftoverPending.length > 0 ? (
        <QueueTable
          title="Legacy reserved withdrawals"
          kind="withdrawal"
          rows={leftoverPending.map((row) => ({
            id: row.id,
            user: `${row.user.name} · ${row.user.email}`,
            amount: formatUsd(row.amount),
            extra: row.toAddress ?? row.walletType,
            status: row.status,
            when: formatDate(row.createdAt),
            pending: true,
          }))}
        />
      ) : null}
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Withdrawal history</h3>
        <p className="mb-4 text-sm text-muted">
          Auto-approved payouts from the company treasury. Manual approve/reject
          is not required.
        </p>
        <DataTable headers={["When", "User", "Wallet", "Gross", "Fee", "Net", "Status"]}>
          {withdrawals.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">
                {row.user.name} · {row.user.email}
              </td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">{formatUsd(row.feeAmount)}</td>
              <td className="px-3 py-3">{formatUsd(row.netAmount)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
