import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { isPayoutConfigured } from "@/lib/chain";
import { attemptOnChainPayout } from "@/lib/payout";
import { prisma } from "@/lib/prisma";
import { payoutRetrySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payoutRetrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing withdrawal id." }, { status: 400 });
  }

  const row = await prisma.withdrawalRequest.findUnique({ where: { id: parsed.data.id } });
  if (!row) {
    return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
  }

  if (row.status === "SENDING") {
    await prisma.withdrawalRequest.update({
      where: { id: row.id },
      data: { status: "FAILED_SEND", sendError: "Send lock cleared by admin retry." },
    });
  }

  if (!isPayoutConfigured() && row.status !== "SENT") {
    return NextResponse.json(
      { error: "On-chain send not configured. Set the company wallet env vars first." },
      { status: 400 },
    );
  }

  try {
    const payout = await attemptOnChainPayout(row.id);
    await writeAudit({
      actorId: session.user.id,
      action: "WITHDRAWAL_RETRY_SEND",
      entity: "WithdrawalRequest",
      entityId: row.id,
      meta: { status: payout.status, txHash: payout.txHash, sendError: payout.sendError },
    });
    return NextResponse.json({ ok: true, ...payout });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
