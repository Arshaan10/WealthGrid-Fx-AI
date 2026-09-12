import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { giftCatalog, ranks } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatUsd } from "@/lib/utils";

export default async function AdminRanksPage() {
  await requireAdmin();
  const progress = await prisma.rankProgress.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ranks
          .filter((r) => r.slug !== "none")
          .map((rank) => (
            <span
              key={rank.slug}
              className="rounded-full border border-gold-line px-3 py-1 text-xs text-gold-bright"
            >
              {rank.name}
            </span>
          ))}
      </div>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h2 className="mb-4 font-display text-2xl">Member rank progress</h2>
        <DataTable headers={["Member", "Rank", "Personal", "Team"]}>
          {progress.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                {row.user.name}
                <div className="text-xs text-muted">{row.user.email}</div>
              </td>
              <td className="px-3 py-3">{row.currentRank}</td>
              <td className="px-3 py-3">{formatUsd(row.personalVolume)}</td>
              <td className="px-3 py-3">{formatUsd(row.teamVolume)}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <GlassCard>
        <h3 className="font-display text-2xl">Gift catalog</h3>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {giftCatalog.map((gift) => (
            <li key={gift.slug}>
              <span className="text-cream">{gift.name}</span> · from {gift.minRank}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
