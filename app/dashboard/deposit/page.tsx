import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { DepositForm } from "@/components/desk/DepositForm";
import { OnchainSync } from "@/components/desk/OnchainSync";
import { StatusPill } from "@/components/desk/StatusPill";
import { VaultStrip } from "@/components/desk/VaultCard";
import { shortAddress } from "@/lib/address";
import { getExplorerTxUrl, getPublicChainConfig } from "@/lib/chain";
import { syncOnchainDesk } from "@/lib/desk-sync";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function DepositPage() {
  const session = await requireUser();
  const chain = getPublicChainConfig();
  await syncOnchainDesk(session.user.id);
  const [intents, wallets] = await Promise.all([
    prisma.depositIntent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.walletBalance.findMany({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Deposit USDT BEP-20</h2>
        <p className="mt-2 text-sm text-muted">
          Connect any Web3 / DEX wallet and send <strong className="text-cream">USDT BEP-20</strong>{" "}
          on {chain.chainName} only. Other networks are rejected. When the transaction reaches{" "}
          {chain.requiredConfirmations} confirmations, the desk auto-credits your chosen Trading
          or Network vault — no admin click on the happy path.
        </p>
      </GlassCard>
      <OnchainSync />
      <VaultStrip
        trading={{
          available: asNumber(wallets.find((w) => w.type === "TRADING")?.available ?? 0),
          pending: asNumber(wallets.find((w) => w.type === "TRADING")?.pending ?? 0),
        }}
        network={{
          available: asNumber(wallets.find((w) => w.type === "NETWORK")?.available ?? 0),
          pending: asNumber(wallets.find((w) => w.type === "NETWORK")?.pending ?? 0),
        }}
      />
      <DepositForm chain={chain} />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Your intents</h3>
        <DataTable headers={["When", "Wallet", "Amount", "From", "Tx", "Status", "Confs", "Note"]}>
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
              <td className="px-3 py-3 text-muted">
                {row.confirmations}/{row.requiredConfs}
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
