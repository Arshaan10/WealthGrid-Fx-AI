import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { approveFlashLoanApplication, rejectFlashLoanApplication } from "@/lib/flash-loans";
import { prisma } from "@/lib/prisma";
import { asNumber } from "@/lib/utils";
import { flashLoanReviewSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [applications, loans] = await Promise.all([
    prisma.flashLoanApplication.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, loan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flashLoan.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        activation: { select: { id: true, amount: true, status: true } },
      },
      orderBy: { approvedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    applications: applications.map((row) => ({
      id: row.id,
      user: row.user,
      requested: asNumber(row.requested),
      status: row.status,
      note: row.note,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      loanId: row.loan?.id ?? null,
    })),
    loans: loans.map((row) => ({
      id: row.id,
      user: row.user,
      requested: asNumber(row.requested),
      approved: asNumber(row.approved),
      principal: asNumber(row.principal),
      repaid: asNumber(row.repaid),
      remaining: Math.max(0, asNumber(row.principal) - asNumber(row.repaid)),
      status: row.status,
      approvedAt: row.approvedAt,
      recoveredAt: row.recoveredAt,
      coolingUntil: row.coolingUntil,
      packageActivationId: row.activation?.id ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = flashLoanReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
  }

  try {
    if (parsed.data.decision === "REJECT") {
      const application = await rejectFlashLoanApplication({
        applicationId: parsed.data.id,
        actorId: session.user.id,
        note: parsed.data.note,
      });
      await writeAudit({
        actorId: session.user.id,
        action: "FLASH_LOAN_REJECT",
        entity: "FlashLoanApplication",
        entityId: application.id,
      });
      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    const amount = parsed.data.amount;
    if (!amount) {
      return NextResponse.json({ error: "Enter an approved amount at or below the request." }, { status: 400 });
    }

    const { loan } = await approveFlashLoanApplication({
      applicationId: parsed.data.id,
      actorId: session.user.id,
      amount,
      note: parsed.data.note,
    });
    await writeAudit({
      actorId: session.user.id,
      action: "FLASH_LOAN_APPROVE",
      entity: "FlashLoan",
      entityId: loan.id,
      meta: { applicationId: parsed.data.id, approved: amount },
    });
    return NextResponse.json({ ok: true, status: "APPROVED", loanId: loan.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
