import Link from "next/link";
import { GlassCard } from "@/components/brand/GlassCard";
import { formatUsd } from "@/lib/utils";
import type { LoanDeskSnapshot } from "@/lib/flash-loans";

export function LoanBanner({ snap }: { snap: LoanDeskSnapshot }) {
  if (!snap.outstanding && !snap.coolingActive) return null;

  if (snap.outstanding) {
    return (
      <GlassCard className="border-danger/30 bg-danger/5 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-danger">Flash loan liability</p>
        <h3 className="mt-2 font-display text-2xl text-cream">
          {formatUsd(snap.outstanding.remaining)} remaining of {formatUsd(snap.outstanding.principal)}
        </h3>
        <p className="mt-2 text-sm text-muted">
          Recovered {snap.outstanding.recoveredPct.toFixed(1)}%. Network available{" "}
          <span className={snap.networkAvailable < 0 ? "text-danger" : "text-cream"}>
            {formatUsd(snap.networkAvailable)}
          </span>
          {snap.networkAvailable < 0 ? " (negative = open loan book)." : "."} Daily ROI is paused on
          the loan-funded package until this book is cleared.
        </p>
        <Link href="/dashboard/loans" className="mt-3 inline-block text-sm text-gold hover:text-gold-bright">
          Open flash loan desk →
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Cooling period</p>
      <h3 className="mt-2 font-display text-2xl">
        Next flash loan in {snap.coolingDaysLeft} day{snap.coolingDaysLeft === 1 ? "" : "s"}
      </h3>
      <p className="mt-2 text-sm text-muted">
        After full recovery a new loan cannot be approved for two Asia/Dubai months. You can still
        apply; ops cannot approve until the cooling date.
      </p>
    </GlassCard>
  );
}
