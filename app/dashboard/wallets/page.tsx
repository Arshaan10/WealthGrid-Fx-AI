import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { OnchainSync } from "@/components/desk/OnchainSync";
import { RecentActivity } from "@/components/desk/RecentActivity";
import { VaultStrip } from "@/components/desk/VaultCard";
import { syncOnchainDesk } from "@/lib/desk-sync";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber } from "@/lib/utils";

export default async function WalletsPage() {
  const session = await requireUser();
  await syncOnchainDesk(session.user.id);
  const [wallets, ledger] = await Promise.all([
    prisma.walletBalance.findMany({ where: { userId: session.user.id } }),
    prisma.ledgerEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);
  const trading = wallets.find((w) => w.type === "TRADING");
  const network = wallets.find((w) => w.type === "NETWORK");

  return (
    <div className="space-y-6">
      <OnchainSync />
      <VaultStrip
        trading={{
          available: asNumber(trading?.available ?? 0),
          pending: asNumber(trading?.pending ?? 0),
        }}
        network={{
          available: asNumber(network?.available ?? 0),
          pending: asNumber(network?.pending ?? 0),
        }}
      />
      <RecentActivity rows={ledger} />
      <RiskDisclaimer compact />
    </div>
  );
}
