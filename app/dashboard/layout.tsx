import { DeskShell } from "@/components/desk/DeskShell";
import { userNav } from "@/config/site";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <DeskShell
      title="Member desk"
      items={userNav}
      home="/dashboard"
      mode="user"
      userLabel={session.user.email ?? session.user.name ?? "Member"}
    >
      {children}
    </DeskShell>
  );
}
