import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { StatusPill } from "@/components/desk/StatusPill";
import { ActivatePackageForm } from "@/components/desk/ActivatePackageForm";
import { DualCapProgress } from "@/components/desk/CapBar";
import { RoutingBanner } from "@/components/desk/RoutingBanner";
import { caps, packages } from "@/config/rewards";
import { getCapSnapshot } from "@/lib/rewards";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatUsd } from "@/lib/utils";

export default async function PackagePage() {
  const session = await requireUser();
  const [activation, trading, capSnap] = await Promise.all([
    prisma.packageActivation.findFirst({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      include: { package: true },
    }),
    prisma.walletBalance.findUnique({
      where: { userId_type: { userId: session.user.id, type: "TRADING" } },
    }),
    getCapSnapshot(session.user.id),
  ]);
  const pro = packages[0];

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">{pro.name}</p>
        <h2 className="mt-2 font-display text-4xl">Activate from ${pro.minAmountUsd}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{pro.blurb}</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
          <div>Daily ~{pro.dailyRatePct}% (Mon–Fri → Trading)</div>
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

      {activation ? (
        <GlassCard>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">Current activation</h3>
            <StatusPill status={activation.status} />
          </div>
          <p className="mt-3 text-sm text-muted">
            {activation.package.name} · {formatUsd(activation.amount)}
          </p>
        </GlassCard>
      ) : (
        <ActivatePackageForm
          min={pro.minAmountUsd}
          available={asNumber(trading?.available ?? 0)}
        />
      )}
      <RiskDisclaimer />
    </div>
  );
}
