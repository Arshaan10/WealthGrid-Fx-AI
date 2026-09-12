import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export function auth() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}
