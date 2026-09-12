import Link from "next/link";
import { CandlestickChart, Gift, Network, Wallet } from "lucide-react";
import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { StatCard } from "@/components/desk/StatCard";
import { StatusPill } from "@/components/desk/StatusPill";
import { rankBySlug } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatUsd } from "@/lib/utils";

export default async function DashboardHomePage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      wallets: true,
      rankProgress: true,
      activations: { where: { status: "ACTIVE" }, include: { package: true } },
    },
  });

  const trading = user?.wallets.find((w) => w.type === "TRADING");
  const network = user?.wallets.find((w) => w.type === "NETWORK");
  const pack = user?.activations[0];
  const rank = rankBySlug(user?.rankProgress?.currentRank ?? "none");
  const announcements = await prisma.announcement.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trading wallet"
          value={formatUsd(trading?.available ?? 0)}
          hint={`Pending ${formatUsd(trading?.pending ?? 0)}`}
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Network wallet"
          value={formatUsd(network?.available ?? 0)}
          hint={`Pending ${formatUsd(network?.pending ?? 0)}`}
          icon={<Network size={18} />}
        />
        <StatCard
          label="Active package"
          value={pack ? `${pack.package.name} ${formatUsd(pack.amount)}` : "None"}
          hint={pack ? "Structured credits — not guaranteed" : "Activate Pro from $50"}
          icon={<CandlestickChart size={18} />}
        />
        <StatCard
          label="Rank"
          value={rank.name}
          hint={`Personal vol ${formatUsd(user?.rankProgress?.personalVolume ?? 0)}`}
          icon={<Gift size={18} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-display text-2xl">Referral code</h2>
          <p className="mt-2 font-mono text-lg text-gold-bright">{user?.referralCode}</p>
          <p className="mt-2 text-sm text-muted">
            Direct 7% books to Network when someone activates with this code.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-display text-2xl">Desk notes</h2>
          <div className="mt-4 space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted">No published announcements.</p>
            ) : (
              announcements.map((item) => (
                <div key={item.id} className="border-b border-gold-line/20 pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-cream">{item.title}</p>
                    <StatusPill status="published" />
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.body}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
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
