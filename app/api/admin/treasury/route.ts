import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { creditTreasury, getOrCreateTreasury } from "@/lib/treasury";
import { treasuryTopupSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const treasury = await getOrCreateTreasury();
  return NextResponse.json({ balance: treasury.balance.toString() });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = treasuryTopupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid top-up amount." }, { status: 400 });
  }

  try {
    const next = await creditTreasury({
      amount: parsed.data.amount,
      description: parsed.data.note?.trim() || "Admin treasury top-up",
      category: "TOPUP",
      actorId: session.user.id,
    });

    await writeAudit({
      actorId: session.user.id,
      action: "TREASURY_TOPUP",
      entity: "Treasury",
      entityId: "company",
      meta: { amount: parsed.data.amount, balanceAfter: next.toString() },
    });

    return NextResponse.json({ ok: true, balance: next.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Treasury top-up failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
