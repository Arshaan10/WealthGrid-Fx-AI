import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { amountSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = amountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const intent = await prisma.depositIntent.create({
    data: {
      userId: session.user.id,
      amount: parsed.data.amount,
      walletType: parsed.data.walletType,
      note: parsed.data.note ?? "DEX connect placeholder — Phase 1 intent only",
      status: "PENDING",
    },
  });

  await writeAudit({
    actorId: session.user.id,
    action: "DEPOSIT_INTENT",
    entity: "DepositIntent",
    entityId: intent.id,
    meta: { amount: parsed.data.amount, walletType: parsed.data.walletType },
  });

  return NextResponse.json({ ok: true, id: intent.id });
}
