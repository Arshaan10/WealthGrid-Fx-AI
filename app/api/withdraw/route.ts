import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { amountSchema } from "@/lib/validators";
import { reserveForWithdrawal } from "@/lib/wallets";

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

  try {
    const requestRow = await prisma.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount: parsed.data.amount,
        walletType: parsed.data.walletType,
        toAddress: parsed.data.toAddress || null,
        note: parsed.data.note ?? "DEX payout placeholder — Phase 1",
        status: "PENDING",
      },
    });

    await reserveForWithdrawal({
      userId: session.user.id,
      type: parsed.data.walletType,
      amount: parsed.data.amount,
      description: `Withdrawal reserved (DEX placeholder) ${requestRow.id}`,
      refId: requestRow.id,
    });

    await writeAudit({
      actorId: session.user.id,
      action: "WITHDRAWAL_REQUEST",
      entity: "WithdrawalRequest",
      entityId: requestRow.id,
      meta: { amount: parsed.data.amount },
    });

    return NextResponse.json({ ok: true, id: requestRow.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Withdrawal failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
