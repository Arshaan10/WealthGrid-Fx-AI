import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <GlassCard pad={false} className="p-4 sm:p-6">
      <h2 className="mb-4 font-display text-2xl">Audit log</h2>
      <DataTable headers={["When", "Actor", "Action", "Entity", "Id", "Meta"]}>
        {logs.map((row) => (
          <tr key={row.id}>
            <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
            <td className="px-3 py-3">{row.actor?.email ?? "system"}</td>
            <td className="px-3 py-3">{row.action}</td>
            <td className="px-3 py-3">{row.entity}</td>
            <td className="px-3 py-3 font-mono text-xs">{row.entityId ?? "—"}</td>
            <td className="max-w-xs truncate px-3 py-3 text-xs text-muted">{row.meta}</td>
          </tr>
        ))}
      </DataTable>
    </GlassCard>
  );
}
