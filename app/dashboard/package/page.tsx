import { GlassCard } from "@/components/brand/GlassCard";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { StatusPill } from "@/components/desk/StatusPill";
import { ActivatePackageForm } from "@/components/desk/ActivatePackageForm";
import { packages } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { asNumber, formatUsd } from "@/lib/utils";

export default async function PackagePage() {
  const session = await requireUser();
  const [activation, trading] = await Promise.all([
    prisma.packageActivation.findFirst({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      include: { package: true },
    }),
    prisma.walletBalance.findUnique({
      where: { userId_type: { userId: session.user.id, type: "TRADING" } },
    }),
  ]);
  const pro = packages[0];

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">{pro.name}</p>
        <h2 className="mt-2 font-display text-4xl">Activate from ${pro.minAmountUsd}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{pro.blurb}</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
          <div>Daily ~{pro.dailyRatePct}%</div>
          <div>Package cap ~{pro.maxReturnPct}%</div>
          <div>Network toward ~{pro.networkCapPct}%</div>
        </dl>
      </GlassCard>

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
