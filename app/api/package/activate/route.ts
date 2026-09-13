import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { AccessError, assertNotBlocked } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { packages, referrals } from "@/config/rewards";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { creditCappedReward } from "@/lib/rewards";
import { debitAvailable } from "@/lib/wallets";

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
  const amount = Number(body?.amount);
  const cfg = packages[0];
  if (!Number.isFinite(amount) || amount < cfg.minAmountUsd) {
    return NextResponse.json(
      { error: `Pro activates from $${cfg.minAmountUsd}.` },
      { status: 400 },
    );
  }

  const pack = await prisma.package.findUnique({ where: { slug: cfg.slug } });
  if (!pack?.active) {
    return NextResponse.json({ error: "Pro package is not available." }, { status: 400 });
  }

  const existing = await prisma.packageActivation.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An active package is already on this desk." },
      { status: 400 },
    );
  }

  try {
    const activation = await prisma.packageActivation.create({
      data: {
        userId: session.user.id,
        packageId: pack.id,
        amount,
        status: "ACTIVE",
      },
    });

    await debitAvailable({
      userId: session.user.id,
      type: "TRADING",
      amount,
      category: "PACKAGE",
      description: `Activated ${pack.name} $${amount}`,
      refId: activation.id,
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { rankProgress: true },
    });

    await prisma.rankProgress.upsert({
      where: { userId: session.user.id },
      update: {
        personalVolume: new Prisma.Decimal(user?.rankProgress?.personalVolume ?? 0).plus(amount),
      },
      create: {
        userId: session.user.id,
        personalVolume: amount,
        currentRank: "NONE",
      },
    });

    if (user?.referredById) {
      const bonus = new Prisma.Decimal(amount).mul(referrals.directPct).div(100);
      await creditCappedReward({
        userId: user.referredById,
        type: "DIRECT",
        amount: bonus,
        note: `${referrals.directPct}% direct on ${user.name} activation → Network wallet`,
        periodKey: `DIRECT:${activation.id}`,
      });
    }

    await writeAudit({
      actorId: session.user.id,
      action: "ACTIVATE_PACKAGE",
      entity: "PackageActivation",
      entityId: activation.id,
      meta: { amount },
    });

    return NextResponse.json({ ok: true, id: activation.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
