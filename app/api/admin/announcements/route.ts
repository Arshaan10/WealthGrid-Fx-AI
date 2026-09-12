import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { announcementSchema } from "@/lib/validators";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  }

  const row = await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      published: parsed.data.published ?? true,
      authorId: session.user.id,
    },
  });
  await writeAudit({
    actorId: session.user.id,
    action: "ANNOUNCEMENT_CREATE",
    entity: "Announcement",
    entityId: row.id,
  });
  return NextResponse.json({ ok: true, id: row.id });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (typeof body.published === "boolean" && !body.title) {
    await prisma.announcement.update({
      where: { id },
      data: { published: body.published },
    });
    await writeAudit({
      actorId: session.user.id,
      action: "ANNOUNCEMENT_PUBLISH",
      entity: "Announcement",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid announcement." }, { status: 400 });
  }
  await prisma.announcement.update({
    where: { id },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      published: parsed.data.published ?? true,
    },
  });
  await writeAudit({
    actorId: session.user.id,
    action: "ANNOUNCEMENT_UPDATE",
    entity: "Announcement",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await prisma.announcement.delete({ where: { id } });
  await writeAudit({
    actorId: session.user.id,
    action: "ANNOUNCEMENT_DELETE",
    entity: "Announcement",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
