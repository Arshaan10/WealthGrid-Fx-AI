import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { QueueTable } from "@/components/admin/QueueTable";
import { WithdrawalHistoryTable } from "@/components/admin/WithdrawalHistoryTable";
import { getExplorerTxUrl, getPublicChainConfig } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function AdminQueuePage() {
  await requireAdmin();
  const chain = getPublicChainConfig();
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
          Members can connect a wallet, copy the company address, and submit a tx hash. Verified
          matching USDT transfers auto-credit; the rest wait here. New withdrawals auto-approve
          against treasury, then attempt an on-chain send when configured.
        </p>
      </GlassCard>
      <QueueTable
        title="Deposits"
        kind="deposit"
        rows={deposits.map((row) => ({
          id: row.id,
          user: `${row.user.name} · ${row.user.email}`,
          amount: formatUsd(row.amount),
          extra: [row.walletType, row.fromAddress, row.txHint].filter(Boolean).join(" · ") || row.walletType,
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
          Auto-approved treasury bookings. Status moves APPROVED → SENT when the company hot
          wallet pays the net USDT, or FAILED_SEND if the chain transfer fails (retry below).
          {!chain.payoutConfigured ? " On-chain send is not configured." : ""}
        </p>
        <WithdrawalHistoryTable
          payoutConfigured={chain.payoutConfigured}
          rows={withdrawals.map((row) => ({
            id: row.id,
            when: formatDate(row.createdAt),
            user: `${row.user.name} · ${row.user.email}`,
            walletType: row.walletType,
            gross: formatUsd(row.amount),
            fee: formatUsd(row.feeAmount),
            net: formatUsd(row.netAmount),
            toAddress: row.toAddress,
            status: row.status,
            txHash: row.txHash,
            sendError: row.sendError,
            explorerTx: row.txHash ? getExplorerTxUrl(row.txHash) : null,
            retryable: row.status === "FAILED_SEND" || row.status === "SENDING" || (row.status === "APPROVED" && !row.txHash && chain.payoutConfigured),
          }))}
        />
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
