import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { walletAddressSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = walletAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid wallet address." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { walletAddress: parsed.data.address },
  });

  await writeAudit({
    actorId: session.user.id,
    action: "WALLET_CONNECTED",
    entity: "User",
    entityId: session.user.id,
    meta: { walletAddress: parsed.data.address },
  });

  return NextResponse.json({ ok: true, address: parsed.data.address });
}
