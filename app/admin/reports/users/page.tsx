import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { ReportActions } from "@/components/desk/ReportActions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function AdminUsersReportPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      wallets: true,
      rankProgress: true,
      activations: { where: { status: "ACTIVE" } },
    },
  });

  const exportRows = users.map((user) => {
    const trading = user.wallets.find((w) => w.type === "TRADING");
    const network = user.wallets.find((w) => w.type === "NETWORK");
    return [
      user.name,
      user.email,
      user.blocked ? "Blocked" : "Active",
      user.role,
      user.rankProgress?.currentRank ?? "NONE",
      formatUsd(trading?.available ?? 0),
      formatUsd(network?.available ?? 0),
      String(user.activations.length),
      formatDate(user.createdAt),
    ];
  });

  return (
    <div className="space-y-6 print-sheet">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">
              <Link href="/admin/reports" className="hover:text-gold">
                Reports
              </Link>
              {" / "}
              Users
            </p>
            <h2 className="font-display text-3xl">Users summary</h2>
            <p className="mt-2 text-sm text-muted">{users.length} desks · Trading and Network balances shown separately.</p>
          </div>
          <ReportActions
            filename="whealth-users"
            headers={["Name", "Email", "Status", "Role", "Rank", "Trading", "Network", "Active pkgs", "Joined"]}
            rows={exportRows}
          />
        </div>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <DataTable headers={["Name", "Email", "Status", "Role", "Rank", "Trading", "Network", "Pkg", "Joined"]}>
          {users.map((user) => {
            const trading = user.wallets.find((w) => w.type === "TRADING");
            const network = user.wallets.find((w) => w.type === "NETWORK");
            return (
              <tr key={user.id}>
                <td className="px-3 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-gold hover:text-gold-bright">
                    {user.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted">{user.email}</td>
                <td className="px-3 py-3">{user.blocked ? "Blocked" : "Active"}</td>
                <td className="px-3 py-3">{user.role}</td>
                <td className="px-3 py-3">{user.rankProgress?.currentRank ?? "NONE"}</td>
                <td className="px-3 py-3">{formatUsd(asNumber(trading?.available ?? 0))}</td>
                <td className="px-3 py-3">{formatUsd(asNumber(network?.available ?? 0))}</td>
                <td className="px-3 py-3">{user.activations.length}</td>
                <td className="px-3 py-3 text-muted">{formatDate(user.createdAt)}</td>
              </tr>
            );
          })}
        </DataTable>
      </GlassCard>
    </div>
  );
}
