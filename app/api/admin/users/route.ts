import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isEvmAddress } from "@/lib/address";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { adminUserSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user update." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (parsed.data.blocked === true && target.id === session.user.id) {
    return NextResponse.json({ error: "You cannot block your own admin account." }, { status: 400 });
  }

  const wallet =
    parsed.data.walletAddress === undefined
      ? undefined
      : parsed.data.walletAddress.trim() === ""
        ? null
        : parsed.data.walletAddress.trim();

  if (wallet && !isEvmAddress(wallet)) {
    return NextResponse.json({ error: "Enter a valid BNB Smart Chain address." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(parsed.data.blocked === undefined ? {} : { blocked: parsed.data.blocked }),
      ...(wallet === undefined ? {} : { walletAddress: wallet }),
    },
  });

  await writeAudit({
    actorId: session.user.id,
    action: parsed.data.blocked === undefined ? "ADMIN_WALLET_UPDATE" : parsed.data.blocked ? "USER_BLOCK" : "USER_UNBLOCK",
    entity: "User",
    entityId: target.id,
    meta: {
      blocked: updated.blocked,
      walletAddress: updated.walletAddress,
    },
  });

  return NextResponse.json({
    ok: true,
    blocked: updated.blocked,
    walletAddress: updated.walletAddress,
  });
}
