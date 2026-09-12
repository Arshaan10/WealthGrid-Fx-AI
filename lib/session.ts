import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function auth() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { blocked: true },
  });
  if (row?.blocked) redirect("/login?blocked=1");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}
