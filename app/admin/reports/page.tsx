import { GoldLink } from "@/components/brand/GoldButton";
import { GlassCard } from "@/components/brand/GlassCard";
import { requireAdmin } from "@/lib/session";

const reports = [
  {
    href: "/admin/reports/users",
    title: "Users summary",
    copy: "Every desk: role, block status, wallets, active package, rank, join date.",
  },
  {
    href: "/admin/reports/rewards",
    title: "Reward summary",
    copy: "Paid credits by type and wallet book — trading vs network, with 2× / 3× context.",
  },
  {
    href: "/admin/reports/treasury",
    title: "Treasury movements",
    copy: "Payout-pool credits and debits. Printable ledger of top-ups and member payouts.",
  },
];

export default async function AdminReportsHubPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Admin reports</p>
        <h2 className="mt-2 font-display text-3xl">Printable desk books</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Clean tables for operators. Each report can export CSV or print without the sidebar chrome.
        </p>
      </GlassCard>
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <GlassCard key={report.href} className="p-5">
            <h3 className="font-display text-2xl">{report.title}</h3>
            <p className="mt-2 text-sm text-muted">{report.copy}</p>
            <GoldLink href={report.href} className="mt-5 px-4 py-2 text-xs">
              Open
            </GoldLink>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
