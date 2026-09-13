import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { StatusPill } from "@/components/desk/StatusPill";
import { ActivatePackageForm } from "@/components/desk/ActivatePackageForm";
import { LoanActivateForm } from "@/components/desk/LoanActivateForm";
import { DualCapProgress } from "@/components/desk/CapBar";
import { RoutingBanner } from "@/components/desk/RoutingBanner";
import { boosters, caps, packages } from "@/config/rewards";
import { resolveDailyRatePct } from "@/lib/boosters";
import { getLoanDeskSnapshot } from "@/lib/flash-loans";
import { getCapSnapshot } from "@/lib/rewards";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatUsd } from "@/lib/utils";

export default async function PackagePage() {
  const session = await requireUser();
  const [activations, trading, capSnap, loanSnap] = await Promise.all([
    prisma.packageActivation.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      include: { package: true, flashLoan: true },
    }),
    prisma.walletBalance.findUnique({
      where: { userId_type: { userId: session.user.id, type: "TRADING" } },
    }),
    getCapSnapshot(session.user.id),
    getLoanDeskSnapshot(session.user.id),
  ]);
  const pro = packages[0];
  const liveRates = await Promise.all(
    activations
      .filter((row) => row.status === "ACTIVE")
      .map(async (row) => ({
        id: row.id,
        ...(await resolveDailyRatePct({
          userId: session.user.id,
          boosterTier: row.boosterTier,
          fundingSource: row.fundingSource,
        })),
      })),
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">{pro.name}</p>
        <h2 className="mt-2 font-display text-4xl">Activate from ${pro.minAmountUsd}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{pro.blurb}</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
          <div>Regular / admin 1% (Mon–Fri → Trading)</div>
          <div>Trading cap {caps.tradingMultiple}× ({pro.maxReturnPct}%)</div>
          <div>Network cap {caps.networkMultiple}× ({pro.networkCapPct}%)</div>
        </dl>
      </GlassCard>
      <RoutingBanner />
      {capSnap.principal > 0 ? (
        <DualCapProgress
          principal={capSnap.principal}
          tradingEarned={capSnap.tradingEarned}
          tradingCap={capSnap.tradingCap}
          networkEarned={capSnap.networkEarned}
          networkCap={capSnap.networkCap}
        />
      ) : null}

      {activations.length > 0 ? (
        <div className="space-y-3">
          {activations.map((activation) => {
            const live = liveRates.find((row) => row.id === activation.id);
            const paused =
              activation.fundingSource === "LOAN" && activation.flashLoan?.status === "OUTSTANDING";
            return (
              <GlassCard key={activation.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-2xl">
                    {activation.package.name} · {formatUsd(activation.amount)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={activation.status} />
                    <StatusPill status={activation.fundingSource} />
                    <StatusPill status={activation.boosterTier} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {paused
                    ? "Daily ROI paused — flash loan outstanding on this package."
                    : live
                      ? `Live rate ${live.ratePct}%/day from ${boosters.tiers[live.tier].name} (active directs ${formatUsd(live.activeDirectVolume)}).`
                      : "Completed or cancelled — renew with a new activation after 2×."}
                  {activation.roiStartsOn
                    ? ` ROI starts ${activation.roiStartsOn.toISOString().slice(0, 10)} (Asia/Dubai).`
                    : ""}
                </p>
              </GlassCard>
            );
          })}
        </div>
      ) : null}

      {loanSnap.canActivateLoan && loanSnap.outstanding ? (
        <LoanActivateForm approved={loanSnap.outstanding.approved} />
      ) : null}

      <ActivatePackageForm min={pro.minAmountUsd} available={asNumber(trading?.available ?? 0)} />
      <RiskDisclaimer />
    </div>
  );
}
