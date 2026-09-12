import Link from "next/link";
import { GoldLink } from "@/components/brand/GoldButton";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { CapBar } from "@/components/desk/CapBar";
import { MetricGrid } from "@/components/desk/MetricGrid";
import { OnchainSync } from "@/components/desk/OnchainSync";
import { RecentActivity } from "@/components/desk/RecentActivity";
import { VaultStrip } from "@/components/desk/VaultCard";
import { packages, rankBySlug } from "@/config/rewards";
import { getPublicChainConfig } from "@/lib/chain";
import { syncOnchainDesk } from "@/lib/desk-sync";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatUsd } from "@/lib/utils";

export default async function DashboardHomePage() {
  const session = await requireUser();
  const chain = getPublicChainConfig();
  await syncOnchainDesk(session.user.id);

  const [user, earnedAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        wallets: true,
        rankProgress: true,
        activations: { where: { status: "ACTIVE" }, include: { package: true } },
        referralsMade: true,
        ledger: { orderBy: { createdAt: "desc" }, take: 8 },
      },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        userId: session.user.id,
        direction: "CREDIT",
        category: { in: ["REWARD", "REFERRAL"] },
      },
      _sum: { amount: true },
    }),
  ]);

  const trading = user?.wallets.find((w) => w.type === "TRADING");
  const network = user?.wallets.find((w) => w.type === "NETWORK");
  const pack = user?.activations[0];
  const rank = rankBySlug(user?.rankProgress?.currentRank ?? "none");
  const pro = packages[0];
  const packAmount = asNumber(pack?.amount ?? 0);
  const cap = packAmount > 0 ? (packAmount * asNumber(pro.maxReturnPct)) / 100 : 0;
  const earned = asNumber(earnedAgg._sum.amount ?? 0);

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
      <MetricGrid
        title="Desk performance"
        action={
          <GoldLink href="/dashboard/referrals" variant="ghost" className="px-3 py-1.5 text-xs">
            Open network
          </GoldLink>
        }
        items={[
          { label: "Direct referrals", value: String(user?.referralsMade.length ?? 0) },
          { label: "Team volume", value: formatUsd(user?.rankProgress?.teamVolume ?? 0) },
          { label: "Trading vault", value: formatUsd(trading?.available ?? 0) },
          { label: "Network vault", value: formatUsd(network?.available ?? 0) },
          {
            label: "Active package",
            value: pack ? formatUsd(pack.amount) : "None",
          },
          { label: "Rank", value: rank.name },
          { label: "Personal volume", value: formatUsd(user?.rankProgress?.personalVolume ?? 0) },
          { label: "Confirmations", value: String(chain.requiredConfirmations) },
        ]}
      />
      <CapBar
        personal={asNumber(user?.rankProgress?.personalVolume ?? 0)}
        earned={earned}
        cap={cap}
      />
      <RecentActivity rows={user?.ledger ?? []} />
      {session.user.role === "ADMIN" ? (
        <p className="text-sm text-muted">
          Operator access:{" "}
          <Link href="/admin" className="text-gold hover:text-gold-bright">
            open admin desk →
          </Link>
        </p>
      ) : null}
      <RiskDisclaimer />
    </div>
  );
}
