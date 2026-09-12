import { DeskShell } from "@/components/desk/DeskShell";
import { KycBanner } from "@/components/desk/KycBanner";
import { userNav } from "@/config/site";
import { kycGaps } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, emailVerified: true },
  });

  return (
    <DeskShell
      title="Member desk"
      items={userNav}
      home="/dashboard"
      mode="user"
      userLabel={session.user.email ?? session.user.name ?? "Member"}
    >
      <KycBanner gaps={kycGaps(profile ?? {})} />
      {children}
    </DeskShell>
  );
}
