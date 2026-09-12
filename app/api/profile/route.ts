import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertNotBlocked, findIdentityConflict } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile. Full name and phone are required." }, { status: 400 });
  }

  let phone: string;
  try {
    phone = normalizePhone(parsed.data.phone);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enter a valid phone number." },
      { status: 400 },
    );
  }

  const conflict = await findIdentityConflict({ phone, excludeUserId: session.user.id });
  if (conflict) {
    return NextResponse.json({ error: conflict }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name.trim(),
      phone,
      walletAddress: parsed.data.walletAddress?.trim() || null,
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
