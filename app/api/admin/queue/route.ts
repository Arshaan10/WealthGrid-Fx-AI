import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { creditWallet, releaseReservation } from "@/lib/wallets";
import type { WalletType } from "@/lib/wallets";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const kind = body?.kind as "deposit" | "withdrawal" | undefined;
  const id = String(body?.id ?? "");
  const decision = body?.decision as "APPROVED" | "REJECTED" | undefined;
  if (!kind || !id || (decision !== "APPROVED" && decision !== "REJECTED")) {
    return NextResponse.json({ error: "Invalid queue action." }, { status: 400 });
  }

  if (kind === "deposit") {
    const row = await prisma.depositIntent.findUnique({ where: { id } });
    if (!row || row.status !== "PENDING") {
      return NextResponse.json({ error: "Deposit is not pending." }, { status: 400 });
    }
    await prisma.depositIntent.update({
      where: { id },
      data: { status: decision, reviewedAt: new Date(), reviewedBy: session.user.id },
    });
    if (decision === "APPROVED") {
      await creditWallet({
        userId: row.userId,
        type: row.walletType as WalletType,
        amount: row.amount,
        category: "DEPOSIT",
        description: "Admin approved DEX placeholder deposit",
        refId: row.id,
      });
    }
    await writeAudit({
      actorId: session.user.id,
      action: `DEPOSIT_${decision}`,
      entity: "DepositIntent",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  }

  const row = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!row || row.status !== "PENDING") {
    return NextResponse.json({ error: "Withdrawal is not pending." }, { status: 400 });
  }
  await prisma.withdrawalRequest.update({
    where: { id },
    data: { status: decision, reviewedAt: new Date(), reviewedBy: session.user.id },
  });
  await releaseReservation({
    userId: row.userId,
    type: row.walletType as WalletType,
    amount: row.amount,
    restoreAvailable: decision === "REJECTED",
  });
  await writeAudit({
    actorId: session.user.id,
    action: `WITHDRAWAL_${decision}`,
    entity: "WithdrawalRequest",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
