import { notFound } from "next/navigation";
import { GoldLink } from "@/components/brand/GoldButton";
import { TicketThread } from "@/components/desk/TicketThread";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="space-y-4">
      <GoldLink href="/admin/support" variant="ghost" className="px-3 py-1.5 text-xs">
        ← All tickets
      </GoldLink>
      <p className="text-sm text-muted">
        {ticket.user.name} · {ticket.user.email}
      </p>
      <TicketThread
        ticketId={ticket.id}
        subject={ticket.subject}
        status={ticket.status}
        messages={ticket.messages}
        replyUrl={`/api/admin/tickets/${ticket.id}`}
        statusUrl={`/api/admin/tickets/${ticket.id}`}
        closed={false}
      />
    </div>
  );
}
