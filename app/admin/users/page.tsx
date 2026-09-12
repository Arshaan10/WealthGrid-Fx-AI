import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { DataTable } from "@/components/desk/DataTable";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      wallets: true,
      rankProgress: true,
      activations: { where: { status: "ACTIVE" } },
    },
  });

  return (
    <GlassCard pad={false} className="p-4 sm:p-6">
      <h2 className="mb-4 font-display text-2xl">Users</h2>
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
              <td className="px-3 py-3">{formatUsd(trading?.available ?? 0)}</td>
              <td className="px-3 py-3">{formatUsd(network?.available ?? 0)}</td>
              <td className="px-3 py-3">{user.activations.length}</td>
              <td className="px-3 py-3 text-muted">{formatDate(user.createdAt)}</td>
            </tr>
          );
        })}
      </DataTable>
    </GlassCard>
  );
}
