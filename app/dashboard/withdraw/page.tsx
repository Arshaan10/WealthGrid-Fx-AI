import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { OnchainSync } from "@/components/desk/OnchainSync";
import { VaultStrip } from "@/components/desk/VaultCard";
import { WithdrawForm } from "@/components/desk/WithdrawForm";
import { withdrawal } from "@/config/rewards";
import { shortAddress } from "@/lib/address";
import { getExplorerTxUrl, getPublicChainConfig } from "@/lib/chain";
import { syncOnchainDesk } from "@/lib/desk-sync";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function WithdrawPage() {
  const session = await requireUser();
  const chain = getPublicChainConfig();
  await syncOnchainDesk(session.user.id);
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
        <h2 className="font-display text-3xl">Withdraw</h2>
        <p className="mt-2 text-sm text-muted">
          Confirming auto-debits the selected Trading or Network vault immediately if treasury
          can cover the net. A {withdrawal.feePct}% fee applies. When the company payout
          transaction reaches {chain.requiredConfirmations} confirmations, status becomes
          CONFIRMED.
          {!chain.payoutConfigured ? " On-chain send is not configured in this environment." : ""}
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
      <WithdrawForm
        wallets={wallets.map((w) => ({
          type: w.type,
          available: asNumber(w.available),
          pending: asNumber(w.pending),
        }))}
        defaultAddress={user?.walletAddress ?? ""}
        feePct={withdrawal.feePct}
        chain={chain}
      />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">History</h3>
        <DataTable headers={["When", "Wallet", "Gross", "Fee", "Net", "To", "Status", "Tx"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{row.walletType}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">{formatUsd(row.feeAmount)}</td>
              <td className="px-3 py-3">{formatUsd(row.netAmount)}</td>
              <td className="px-3 py-3 font-mono text-xs">
                {row.toAddress ? shortAddress(row.toAddress) : "—"}
              </td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 font-mono text-xs">
                {row.txHash ? (
                  <a
                    href={getExplorerTxUrl(row.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold hover:text-gold-bright"
                  >
                    {shortAddress(row.txHash, 8, 6)}
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer />
    </div>
  );
}
