import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { generateReferralCode } from "@/lib/utils";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check name, email, and password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account already uses that email." }, { status: 409 });
  }

  let referrer = null;
  const code = parsed.data.referralCode?.trim();
  if (code) {
    referrer = await prisma.user.findUnique({ where: { referralCode: code.toUpperCase() } });
    if (!referrer) {
      return NextResponse.json({ error: "Referral code was not recognized." }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let referralCode = generateReferralCode();
  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode();
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      referralCode,
      referredById: referrer?.id,
      wallets: {
        create: [
          { type: "TRADING", available: 0, pending: 0 },
          { type: "NETWORK", available: 0, pending: 0 },
        ],
      },
      rankProgress: {
        create: { currentRank: "NONE" },
      },
    },
  });

  if (referrer) {
    await prisma.referral.create({
      data: { referrerId: referrer.id, refereeId: user.id, level: 1 },
    });
  }

  await writeAudit({
    actorId: user.id,
    action: "REGISTER",
    entity: "User",
    entityId: user.id,
    meta: { referredBy: referrer?.id ?? null },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
