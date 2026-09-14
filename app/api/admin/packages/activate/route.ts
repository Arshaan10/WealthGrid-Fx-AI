import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { applyForFlashLoan, approveFlashLoanApplication, getLoanDeskSnapshot } from "@/lib/flash-loans";
import { activatePackage } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { adminPackageActivateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminPackageActivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a member, amount, and package count." }, { status: 400 });
  }

  const user = parsed.data.userId
    ? await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    : parsed.data.email
      ? await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
      : null;

  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const count = parsed.data.fundingSource === "LOAN" ? 1 : parsed.data.count;
  if (parsed.data.fundingSource === "LOAN" && parsed.data.count > 1) {
    return NextResponse.json(
      { error: "Flash-loan funding activates one package (the approved loan amount)." },
      { status: 400 },
    );
  }

  try {
    const ids: string[] = [];

    if (parsed.data.fundingSource === "LOAN") {
      const snap = await getLoanDeskSnapshot(user.id);
      if (snap.approveBlockedReason && !snap.canActivateLoan) {
        return NextResponse.json({ error: snap.approveBlockedReason }, { status: 400 });
      }
      let flashLoanId = snap.canActivateLoan ? snap.outstanding?.id : null;
      let amount = snap.outstanding?.approved ?? parsed.data.amount;

      if (!flashLoanId) {
        const application = await applyForFlashLoan({
          userId: user.id,
          amount: parsed.data.amount,
          note: parsed.data.note ?? "Admin-originated flash loan",
        });
        const { loan } = await approveFlashLoanApplication({
          applicationId: application.id,
          actorId: session.user.id,
          amount: parsed.data.amount,
          note: parsed.data.note,
        });
        flashLoanId = loan.id;
        amount = parsed.data.amount;
      }

      const activation = await activatePackage({
        userId: user.id,
        amount,
        fundingSource: "LOAN",
        boosterTier: "NONE",
        flashLoanId,
        actorId: session.user.id,
      });
      ids.push(activation.id);
    } else {
      for (let i = 0; i < count; i += 1) {
        const activation = await activatePackage({
          userId: user.id,
          amount: parsed.data.amount,
          fundingSource: "ADMIN",
          boosterTier: "NONE",
          actorId: session.user.id,
        });
        ids.push(activation.id);
      }
    }

    await writeAudit({
      actorId: session.user.id,
      action: "ADMIN_ACTIVATE_PACKAGE",
      entity: "PackageActivation",
      entityId: ids[0],
      meta: {
        userId: user.id,
        amount: parsed.data.amount,
        count: ids.length,
        fundingSource: parsed.data.fundingSource,
        ids,
      },
    });

    return NextResponse.json({ ok: true, ids, count: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin activation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
