import { GlassCard } from "@/components/brand/GlassCard";
import { StatCard } from "@/components/desk/StatCard";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminHomePage() {
  await requireAdmin();
  const [users, activations, pendingDeposits, pendingWithdrawals, announcements] =
    await Promise.all([
      prisma.user.count(),
      prisma.packageActivation.count({ where: { status: "ACTIVE" } }),
      prisma.depositIntent.count({ where: { status: "PENDING" } }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.announcement.count({ where: { published: true } }),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={String(users)} />
        <StatCard label="Active packages" value={String(activations)} />
        <StatCard label="Pending deposits" value={String(pendingDeposits)} />
        <StatCard label="Pending withdrawals" value={String(pendingWithdrawals)} />
      </div>
      <GlassCard>
        <h2 className="font-display text-2xl">Operator notes</h2>
        <p className="mt-3 text-sm text-muted">
          Approve or reject the DEX queue to credit or restore wallets. Reward
          percentages are read-only from <code>config/rewards.ts</code>.{" "}
          {announcements} announcement{announcements === 1 ? "" : "s"} currently
          published to member desks.
        </p>
      </GlassCard>
    </div>
  );
}
