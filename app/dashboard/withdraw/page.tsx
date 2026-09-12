import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { WithdrawForm } from "@/components/desk/WithdrawForm";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function WithdrawPage() {
  const session = await requireUser();
  const [wallets, rows] = await Promise.all([
    prisma.walletBalance.findMany({ where: { userId: session.user.id } }),
    prisma.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletAddress: true },
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Withdraw via DEX</h2>
        <p className="mt-2 text-sm text-muted">
          Submitting reserves available balance and queues a placeholder payout.
          No chain broadcast happens in Phase 1.
        </p>
      </GlassCard>
      <WithdrawForm
        wallets={wallets.map((w) => ({
          type: w.type,
          available: asNumber(w.available),
        }))}
        defaultAddress={user?.walletAddress ?? ""}
      />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Requests</h3>
        <DataTable headers={["When", "Wallet", "Amount", "To", "Status"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3 font-mono text-xs">{row.toAddress ?? "—"}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer />
    </div>
  );
}
