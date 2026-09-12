import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessError, assertNotBlocked } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { issueEmailVerification } from "@/lib/email-verify";
import { prisma } from "@/lib/prisma";

export async function POST() {
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });
  if (user?.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const verification = await issueEmailVerification(session.user.id);
  return NextResponse.json({
    ok: true,
    verifyUrl: verification.verifyUrl,
    message: "Local verification stub — open the link to mark this inbox verified.",
  });
}
