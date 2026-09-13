import { AdminActivateForm } from "@/components/admin/AdminActivateForm";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function AdminPackagesPage() {
  await requireAdmin();
  const [packs, activations] = await Promise.all([
    prisma.package.findMany(),
    prisma.packageActivation.findMany({
      include: { user: true, package: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {packs.map((pack) => (
          <GlassCard key={pack.id}>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">{pack.slug}</p>
            <h2 className="mt-2 font-display text-3xl">{pack.name}</h2>
            <p className="mt-2 text-sm text-muted">
              Min {formatUsd(pack.minAmount)} · daily {pack.dailyRate.toString()}% · max{" "}
              {pack.maxReturn.toString()}% · network {pack.networkCap.toString()}%
            </p>
          </GlassCard>
        ))}
      </div>
      <AdminActivateForm />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h2 className="mb-4 font-display text-2xl">Activations</h2>
        <DataTable headers={["User", "Package", "Amount", "Funding", "Booster", "Status", "Started"]}>
          {activations.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                {row.user.name}
                <div className="text-xs text-muted">{row.user.email}</div>
              </td>
              <td className="px-3 py-3">{row.package.name}</td>
              <td className="px-3 py-3">{formatUsd(row.amount)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.fundingSource} />
              </td>
              <td className="px-3 py-3">
                <StatusPill status={row.boosterTier} />
              </td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 text-muted">{formatDate(row.startedAt)}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
    </div>
  );
}
