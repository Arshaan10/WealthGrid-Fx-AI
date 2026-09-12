import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      walletAddress: parsed.data.walletAddress || null,
    },
  });

  await writeAudit({
    actorId: session.user.id,
    action: "UPDATE_PROFILE",
    entity: "User",
    entityId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
