import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      member: ticket.user,
      preview: ticket.messages[0]?.body ?? "",
    })),
  });
}
