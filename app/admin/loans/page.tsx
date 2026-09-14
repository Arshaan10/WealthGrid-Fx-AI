import { GlassCard } from "@/components/brand/GlassCard";
import { LoanReviewForm } from "@/components/admin/LoanReviewForm";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { flashLoan } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { asNumber, formatDate, formatUsd } from "@/lib/utils";

export default async function AdminLoansPage() {
  await requireAdmin();
  const [applications, loans] = await Promise.all([
    prisma.flashLoanApplication.findMany({
      include: { user: true, loan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flashLoan.findMany({
      include: {
        user: true,
        activation: true,
      },
      orderBy: { approvedAt: "desc" },
    }),
  ]);
  const pending = applications.filter((row) => row.status === "PENDING");

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Ops</p>
        <h2 className="mt-2 font-display text-4xl">Flash loan review</h2>
        <p className="mt-3 max-w-3xl text-sm text-muted">{flashLoan.note}</p>
      </GlassCard>
      <GlassCard>
        <h3 className="font-display text-2xl">Pending applications</h3>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No applications waiting for review.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((row) => (
              <li key={row.id} className="rounded-xl border border-gold-line/40 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{row.user.name}</p>
                    <p className="text-sm text-muted">{row.user.email}</p>
                    <p className="mt-1 text-sm">
                      Requested {formatUsd(row.requested)} · {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={row.status} />
                </div>
                <LoanReviewForm applicationId={row.id} requested={asNumber(row.requested)} />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-3 font-display text-2xl">Application history</h3>
        <DataTable headers={["Member", "Requested", "Status", "When", "Note"]} empty="No applications.">
          {applications.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                {row.user.name}
                <div className="text-xs text-muted">{row.user.email}</div>
              </td>
              <td className="px-3 py-3">{formatUsd(row.requested)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3 text-muted">{row.note ?? "—"}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-3 font-display text-2xl">Loan ledger</h3>
        <DataTable
          headers={["Member", "Approved", "Repaid", "Remaining", "Status", "Package", "Cooling"]}
          empty="No flash loans booked."
        >
          {loans.map((row) => {
            const remaining = Math.max(0, asNumber(row.principal) - asNumber(row.repaid));
            return (
              <tr key={row.id}>
                <td className="px-3 py-3">
                  {row.user.name}
                  <div className="text-xs text-muted">{row.user.email}</div>
                </td>
                <td className="px-3 py-3">{formatUsd(row.approved)}</td>
                <td className="px-3 py-3">{formatUsd(row.repaid)}</td>
                <td className={`px-3 py-3 ${remaining > 0 ? "text-danger" : ""}`}>{formatUsd(remaining)}</td>
                <td className="px-3 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-3 py-3 text-muted">
                  {row.activation ? formatUsd(row.activation.amount) : "Awaiting activation"}
                </td>
                <td className="px-3 py-3 text-muted">
                  {row.coolingUntil ? row.coolingUntil.toISOString().slice(0, 10) : "—"}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </GlassCard>
    </div>
  );
}
