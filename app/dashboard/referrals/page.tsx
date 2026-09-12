import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { referrals } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function ReferralsPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      referralsMade: { include: { referee: true }, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Your code</p>
        <p className="mt-2 font-mono text-3xl text-gold-bright">{user?.referralCode}</p>
        <p className="mt-3 text-sm text-muted">
          Direct {referrals.directPct}% on first-line activations. Team trading is
          configured through L{referrals.teamLevels} and displayed on Rewards —
          execution of deeper levels is a later phase.
        </p>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h2 className="mb-4 font-display text-2xl">First line</h2>
        <DataTable headers={["Member", "Email", "Joined"]} empty="No referrals yet.">
          {user?.referralsMade.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">{row.referee.name}</td>
              <td className="px-3 py-3 text-muted">{row.referee.email}</td>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
    </div>
  );
}
