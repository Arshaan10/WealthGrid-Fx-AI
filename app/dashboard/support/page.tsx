import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { TicketComposer } from "@/components/desk/TicketComposer";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function SupportPage() {
  const session = await requireUser();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="font-display text-3xl">Support</h2>
        <p className="mt-2 text-sm text-muted">
          Open a ticket for deposits, withdrawals, or identity. Desk operators reply from the admin
          console.
        </p>
      </GlassCard>
      <TicketComposer />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-4 font-display text-2xl">Your tickets</h3>
        <DataTable headers={["Subject", "Status", "Updated"]} empty="No tickets yet.">
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="px-3 py-3">
                <Link href={`/dashboard/support/${ticket.id}`} className="text-gold hover:text-gold-bright">
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
