import { notFound } from "next/navigation";
import { GoldLink } from "@/components/brand/GoldButton";
import { TicketThread } from "@/components/desk/TicketThread";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });
  if (!ticket || ticket.userId !== session.user.id) notFound();

  return (
    <div className="space-y-4">
      <GoldLink href="/dashboard/support" variant="ghost" className="px-3 py-1.5 text-xs">
        ← All tickets
      </GoldLink>
      <TicketThread
        ticketId={ticket.id}
        subject={ticket.subject}
        status={ticket.status}
        messages={ticket.messages}
        replyUrl={`/api/tickets/${ticket.id}`}
        closed={ticket.status === "CLOSED"}
      />
    </div>
  );
}
