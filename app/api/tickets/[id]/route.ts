import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertNotBlocked } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { ticketReplySchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertNotBlocked(session.user.id);
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { id } = await ctx.params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, role: true } } } },
    },
  });

  if (!ticket || ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function POST(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertNotBlocked(session.user.id);
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = ticketReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a reply." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket || ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "This ticket is closed." }, { status: 400 });
  }

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: session.user.id,
      body: parsed.data.body.trim(),
    },
  });
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: ticket.status === "PENDING" ? "OPEN" : ticket.status },
  });

  await writeAudit({
    actorId: session.user.id,
    action: "TICKET_REPLY",
    entity: "SupportTicket",
    entityId: ticket.id,
  });

  return NextResponse.json({ ok: true });
}
