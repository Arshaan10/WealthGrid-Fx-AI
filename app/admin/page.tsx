import Link from "next/link";
import { Landmark } from "lucide-react";
import { GlassCard } from "@/components/brand/GlassCard";
import { StatCard } from "@/components/desk/StatCard";
import { getOrCreateTreasury } from "@/lib/treasury";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatUsd } from "@/lib/utils";

export default async function AdminHomePage() {
  await requireAdmin();
  const [users, blocked, activations, pendingDeposits, approvedWithdrawals, openTickets, announcements, treasury] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { blocked: true } }),
      prisma.packageActivation.count({ where: { status: "ACTIVE" } }),
      prisma.depositIntent.count({ where: { status: { in: ["PENDING", "CONFIRMING"] } } }),
      prisma.withdrawalRequest.count({
        where: { status: { in: ["APPROVED", "SENDING", "CONFIRMING", "SENT", "CONFIRMED", "FAILED_SEND"] } },
      }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } }),
      prisma.announcement.count({ where: { published: true } }),
      getOrCreateTreasury(),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={String(users)} hint={blocked ? `${blocked} blocked` : "All active"} />
        <StatCard label="Open tickets" value={String(openTickets)} hint="OPEN + PENDING" />
        <StatCard label="Active packages" value={String(activations)} />
        <StatCard label="Open deposits" value={String(pendingDeposits)} hint="Pending + confirming" />
        <StatCard
          label="Treasury"
          value={formatUsd(treasury.balance)}
          hint={`${approvedWithdrawals} treasury withdrawals`}
          icon={<Landmark size={18} />}
        />
      </div>
      <GlassCard>
        <h2 className="font-display text-2xl">Operator notes</h2>
        <p className="mt-3 text-sm text-muted">
          Store payout funds on{" "}
          <Link href="/admin/treasury" className="text-gold hover:text-gold-bright">
            Treasury
          </Link>
          . Member withdrawals auto-approve and debit that pool immediately,
          then broadcast a company-wallet USDT send when chain env is set.
          Deposits auto-credit after on-chain confirmations; only unmatched
          intents still need review on the{" "}
          <Link href="/admin/queue" className="text-gold hover:text-gold-bright">
            deposit queue
          </Link>
          . Block or edit a member wallet from{" "}
          <Link href="/admin/users" className="text-gold hover:text-gold-bright">
            Users
          </Link>
          . Reply to desk tickets on{" "}
          <Link href="/admin/support" className="text-gold hover:text-gold-bright">
            Support
          </Link>
          . Reward percentages are read-only from <code>config/rewards.ts</code>.{" "}
          {announcements} announcement{announcements === 1 ? "" : "s"} currently
          published to member desks.
        </p>
      </GlassCard>
    </div>
  );
}
