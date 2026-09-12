import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function newVerifyToken() {
  return randomBytes(24).toString("hex");
}

export function verifyExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export function appOrigin() {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function verifyUrlForToken(token: string) {
  return `${appOrigin()}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function issueEmailVerification(userId: string) {
  const token = newVerifyToken();
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: null,
      emailVerifyToken: token,
      emailVerifyExpires: verifyExpiry(),
    },
  });
  return { token, verifyUrl: verifyUrlForToken(token) };
}

export async function consumeEmailToken(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  });
  if (!user) return { ok: false as const, reason: "Invalid or already used link." };
  if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
    return { ok: false as const, reason: "This verification link expired. Request a new one from Profile." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });
  return { ok: true as const, email: user.email };
}
