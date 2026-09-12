import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debitTreasury } from "@/lib/treasury";
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
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `DEPOSIT_${decision}`,
        entity: "DepositIntent",
        entityId: id,
      },
    });
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.withdrawalRequest.findUnique({ where: { id } });
      if (!row || row.status !== "PENDING") {
        throw new Error("Withdrawal is not pending.");
      }

      const reserved = new Prisma.Decimal(row.amount);
      const storedNet = new Prisma.Decimal(row.netAmount);
      const payout = storedNet.gt(0) ? storedNet : reserved;

      if (decision === "APPROVED") {
        await debitTreasury({
          db: tx,
          amount: payout,
          category: "PAYOUT",
          description: `Legacy queue approval ${row.id}`,
          refId: row.id,
          actorId: session.user.id,
        });
      }

      await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: decision,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          netAmount: storedNet.gt(0) ? storedNet : payout,
        },
      });

      await releaseReservation({
        db: tx,
        userId: row.userId,
        type: row.walletType as WalletType,
        amount: row.amount,
        restoreAvailable: decision === "REJECTED",
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: `WITHDRAWAL_${decision}`,
          entity: "WithdrawalRequest",
          entityId: id,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Queue action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
