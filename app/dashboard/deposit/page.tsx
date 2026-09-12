import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { DepositForm } from "@/components/desk/DepositForm";
import { shortAddress } from "@/lib/address";
import { getExplorerTxUrl, getPublicChainConfig } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function DepositPage() {
  const session = await requireUser();
  const chain = getPublicChainConfig();
  const intents = await prisma.depositIntent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Deposit USDT</h2>
        <p className="mt-2 text-sm text-muted">
          Connect your wallet, send USDT to the company address on {chain.chainName}, then record
          the amount and transaction hash. If a public RPC can verify a matching transfer, the
          desk credits you automatically. Otherwise admin confirms the hash.
        </p>
      </GlassCard>
      <DepositForm chain={chain} />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Your intents</h3>
        <DataTable headers={["When", "Wallet", "Amount", "From", "Tx", "Status", "Note"]}>
          {intents.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3 font-mono text-xs">
                {row.fromAddress ? shortAddress(row.fromAddress) : "—"}
              </td>
              <td className="px-3 py-3 font-mono text-xs">
                {row.txHint ? (
                  <a
                    href={getExplorerTxUrl(row.txHint)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold hover:text-gold-bright"
                  >
                    {shortAddress(row.txHint, 8, 6)}
                  </a>
                ) : (
                  "—"
                )}
              </td>
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
