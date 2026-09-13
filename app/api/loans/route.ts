import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertNotBlocked } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { applyForFlashLoan, getLoanDeskSnapshot } from "@/lib/flash-loans";
import { prisma } from "@/lib/prisma";
import { asNumber } from "@/lib/utils";
import { flashLoanApplySchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [snap, applications, loans] = await Promise.all([
    getLoanDeskSnapshot(session.user.id),
    prisma.flashLoanApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flashLoan.findMany({
      where: { userId: session.user.id },
      include: { activation: { select: { id: true, amount: true, status: true } } },
      orderBy: { approvedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    snapshot: snap,
    applications: applications.map((row) => ({
      id: row.id,
      requested: asNumber(row.requested),
      status: row.status,
      note: row.note,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
    })),
    loans: loans.map((row) => ({
      id: row.id,
      requested: asNumber(row.requested),
      approved: asNumber(row.approved),
      principal: asNumber(row.principal),
      repaid: asNumber(row.repaid),
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
  const parsed = flashLoanApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid loan amount." }, { status: 400 });
  }

  try {
    const application = await applyForFlashLoan({
      userId: session.user.id,
      amount: parsed.data.amount,
      note: parsed.data.note,
    });
    await writeAudit({
      actorId: session.user.id,
      action: "FLASH_LOAN_APPLY",
      entity: "FlashLoanApplication",
      entityId: application.id,
      meta: { requested: parsed.data.amount },
    });
    return NextResponse.json({ ok: true, id: application.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Application failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
