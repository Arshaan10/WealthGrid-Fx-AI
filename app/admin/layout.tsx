import { DeskShell } from "@/components/desk/DeskShell";
import { adminNav } from "@/config/site";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <DeskShell
      title="Admin desk"
      items={adminNav}
      home="/admin"
      mode="admin"
      userLabel={session.user.email ?? "Admin"}
    >
      {children}
    </DeskShell>
  );
}
