import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { FlashLoanForm } from "@/components/desk/FlashLoanForm";
import { LoanActivateForm } from "@/components/desk/LoanActivateForm";
import { LoanBanner } from "@/components/desk/LoanBanner";
import { DataTable } from "@/components/desk/DataTable";
import { StatusPill } from "@/components/desk/StatusPill";
import { flashLoan } from "@/config/rewards";
import { getLoanDeskSnapshot } from "@/lib/flash-loans";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, formatUsd } from "@/lib/utils";

export default async function LoansPage() {
  const session = await requireUser();
  const [snap, applications, loans] = await Promise.all([
    getLoanDeskSnapshot(session.user.id),
    prisma.flashLoanApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flashLoan.findMany({
      where: { userId: session.user.id },
      include: { activation: true },
      orderBy: { approvedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Flash loan desk</p>
        <h2 className="mt-2 font-display text-4xl">Borrow, activate, recover</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{flashLoan.note}</p>
      </GlassCard>
      <LoanBanner snap={snap} />
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Network vault</p>
          <p className={`mt-2 font-display text-3xl ${snap.networkAvailable < 0 ? "text-danger" : "gold-text"}`}>
            {formatUsd(snap.networkAvailable)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {snap.networkIsLiability
              ? "Negative available is the open flash-loan liability."
              : "No open loan book on this vault."}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Approved / recovered</p>
          <p className="mt-2 font-display text-3xl text-cream">
            {snap.outstanding
              ? `${snap.outstanding.recoveredPct.toFixed(1)}%`
              : snap.lastRecovered
                ? "100%"
                : "—"}
          </p>
          <p className="mt-2 text-xs text-muted">
            {snap.outstanding
              ? `${formatUsd(snap.outstanding.repaid)} of ${formatUsd(snap.outstanding.principal)} recovered`
              : "No outstanding principal."}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Cooling</p>
          <p className="mt-2 font-display text-3xl text-cream">
            {snap.coolingActive ? `${snap.coolingDaysLeft}d` : "Open"}
          </p>
          <p className="mt-2 text-xs text-muted">
            Next approval after recovery + {flashLoan.coolingMonths} months
            {snap.coolingUntil ? ` (until ${snap.coolingUntil.toISOString().slice(0, 10)}).` : "."}
          </p>
        </GlassCard>
      </div>
      {snap.canActivateLoan && snap.outstanding ? (
        <LoanActivateForm approved={snap.outstanding.approved} />
      ) : null}
      <FlashLoanForm disabled={!snap.canApply} reason={snap.applyBlockedReason} />
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-3 font-display text-2xl">Applications</h3>
        <DataTable headers={["When", "Requested", "Status", "Note"]} empty="No applications yet.">
          {applications.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{formatUsd(row.requested)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 text-muted">{row.note ?? "—"}</td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <GlassCard pad={false} className="p-4 sm:p-6">
        <h3 className="mb-3 font-display text-2xl">Loan ledger</h3>
        <DataTable
          headers={["Approved", "Principal", "Repaid", "Status", "Package", "Recovered"]}
          empty="No approved loans."
        >
          {loans.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted">{formatDate(row.approvedAt)}</td>
              <td className="px-3 py-3">{formatUsd(row.principal)}</td>
              <td className="px-3 py-3">{formatUsd(row.repaid)}</td>
              <td className="px-3 py-3">
                <StatusPill status={row.status} />
              </td>
              <td className="px-3 py-3 text-muted">
                {row.activation ? formatUsd(row.activation.amount) : "Not activated"}
              </td>
              <td className="px-3 py-3 text-muted">
                {row.recoveredAt ? formatDate(row.recoveredAt) : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      </GlassCard>
      <RiskDisclaimer compact />
    </div>
  );
}
