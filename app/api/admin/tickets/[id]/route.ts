import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { ticketReplySchema, ticketStatusSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true, email: true } } },
      },
    },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  return NextResponse.json({ ticket });
}

export async function POST(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = ticketReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a reply." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
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
    data: { status: ticket.status === "CLOSED" ? "CLOSED" : "PENDING" },
  });

  await writeAudit({
    actorId: session.user.id,
    action: "TICKET_ADMIN_REPLY",
    entity: "SupportTicket",
    entityId: ticket.id,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = ticketStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status must be OPEN, PENDING, or CLOSED." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: parsed.data.status },
  });

  await writeAudit({
    actorId: session.user.id,
    action: "TICKET_STATUS",
    entity: "SupportTicket",
    entityId: ticket.id,
    meta: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
