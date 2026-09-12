import { prisma } from "@/lib/prisma";

export class AccessError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function assertMemberCanTransact(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { blocked: true, emailVerified: true, name: true, phone: true, email: true },
  });
  if (!user) throw new AccessError("Account not found.", 404);
  if (user.blocked) {
    throw new AccessError("This account is blocked. Contact support.", 403);
  }
  if (!user.emailVerified) {
    throw new AccessError("Verify your email before depositing or withdrawing.", 403);
  }
  if (!user.name?.trim() || !user.phone) {
    throw new AccessError("Complete your profile (full name and phone) before transacting.", 403);
  }
  return user;
}

export async function assertNotBlocked(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { blocked: true },
  });
  if (user?.blocked) {
    throw new AccessError("This account is blocked. Contact support.", 403);
  }
}

export function kycGaps(user: {
  name?: string | null;
  phone?: string | null;
  emailVerified?: Date | null;
}) {
  const gaps: string[] = [];
  if (!user.name?.trim()) gaps.push("full name");
  if (!user.phone) gaps.push("phone number");
  if (!user.emailVerified) gaps.push("verified email");
  return gaps;
}

export async function findIdentityConflict(opts: {
  email?: string;
  phone?: string;
  excludeUserId?: string;
}) {
  if (opts.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: opts.email } });
    if (byEmail && byEmail.id !== opts.excludeUserId) {
      return "An account already uses that email. Login instead of opening a second desk.";
    }
  }
  if (opts.phone) {
    const byPhone = await prisma.user.findUnique({ where: { phone: opts.phone } });
    if (byPhone && byPhone.id !== opts.excludeUserId) {
      return "An account already uses that phone number. Login instead of opening a second desk.";
    }
  }
  return null;
}
