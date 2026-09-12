import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function AdminSupportPage() {
  await requireAdmin();
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <GlassCard pad={false} className="p-4 sm:p-6">
      <h2 className="mb-4 font-display text-2xl">Support tickets</h2>
      <DataTable headers={["Member", "Subject", "Status", "Updated"]} empty="No tickets yet.">
        {tickets.map((ticket) => (
          <tr key={ticket.id}>
            <td className="px-3 py-3">
              <p>{ticket.user.name}</p>
              <p className="text-xs text-muted">{ticket.user.email}</p>
            </td>
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
  );
}
