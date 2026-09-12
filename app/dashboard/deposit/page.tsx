import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { DepositForm } from "@/components/desk/DepositForm";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function DepositPage() {
  const session = await requireUser();
  const intents = await prisma.depositIntent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Deposit via DEX</h2>
        <p className="mt-2 text-sm text-muted">
          Placeholder only. No wallet connect and no on-chain call in Phase 1.
          Recording an intent puts a row on the admin queue.
        </p>
      </GlassCard>
      <DepositForm />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Your intents</h3>
        <DataTable headers={["When", "Wallet", "Amount", "Status", "Note"]}>
          {intents.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 text-muted">{row.note}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer />
    </div>
  );
}
