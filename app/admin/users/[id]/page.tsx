import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserControls } from "@/components/admin/AdminUserControls";
import { GlassCard } from "@/components/brand/GlassCard";
import { GoldLink } from "@/components/brand/GoldButton";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wallets: true,
      tickets: { orderBy: { updatedAt: "desc" }, take: 8 },
    },
  });
  if (!user) notFound();

  const trading = user.wallets.find((w) => w.type === "TRADING");
  const network = user.wallets.find((w) => w.type === "NETWORK");

  return (
    <div className="space-y-6">
      <GoldLink href="/admin/users" variant="ghost" className="px-3 py-1.5 text-xs">
        ← Users
      </GoldLink>
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">{user.role}</p>
            <h2 className="font-display text-3xl">{user.name}</h2>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
          <StatusPill status={user.blocked ? "BLOCKED" : "ACTIVE"} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Phone</dt>
            <dd>{user.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Email verified</dt>
            <dd>{user.emailVerified ? formatDate(user.emailVerified) : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Trading vault</dt>
            <dd>{formatUsd(trading?.available ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Network vault</dt>
            <dd>{formatUsd(network?.available ?? 0)}</dd>
          </div>
        </dl>
      </GlassCard>
      <AdminUserControls
        userId={user.id}
        blocked={user.blocked}
        walletAddress={user.walletAddress ?? ""}
        self={user.id === session.user.id}
      />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-3 font-display text-xl">Recent tickets</h3>
        <DataTable headers={["Subject", "Status", "Updated"]} empty="No tickets.">
          {user.tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="px-3 py-3">
                <Link href={`/admin/support/${ticket.id}`} className="text-gold hover:text-gold-bright">
                  {ticket.subject}
                </Link>
              </td>
              <td className="px-3 py-3">
                <StatusPill status={ticket.status} />
              </td>
              <td className="px-3 py-3 text-muted">{formatDate(ticket.updatedAt)}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
    </div>
  );
}
