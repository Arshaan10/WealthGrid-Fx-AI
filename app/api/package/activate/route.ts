import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertNotBlocked } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getLoanDeskSnapshot } from "@/lib/flash-loans";
import { activatePackage } from "@/lib/packages";
import { packageActivateSchema } from "@/lib/validators";

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
  const parsed = packageActivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid amount and booster tier." }, { status: 400 });
  }

  try {
    const snap = await getLoanDeskSnapshot(session.user.id);
    let flashLoanId: string | undefined;
    let amount = parsed.data.amount;
    if (parsed.data.fundingSource === "LOAN") {
      if (!snap.canActivateLoan || !snap.outstanding) {
        return NextResponse.json(
          { error: "No approved flash loan is waiting to fund a package." },
          { status: 400 },
        );
      }
      flashLoanId = snap.outstanding.id;
      amount = snap.outstanding.approved;
    }

    const activation = await activatePackage({
      userId: session.user.id,
      amount,
      fundingSource: parsed.data.fundingSource,
      boosterTier: parsed.data.fundingSource === "LOAN" ? "NONE" : parsed.data.boosterTier,
      flashLoanId,
      actorId: session.user.id,
    });

    await writeAudit({
      actorId: session.user.id,
      action: parsed.data.fundingSource === "LOAN" ? "ACTIVATE_PACKAGE_LOAN" : "ACTIVATE_PACKAGE",
      entity: "PackageActivation",
      entityId: activation.id,
      meta: {
        amount: Number(activation.amount.toString()),
        fundingSource: activation.fundingSource,
        boosterTier: activation.boosterTier,
      },
    });

    return NextResponse.json({ ok: true, id: activation.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
