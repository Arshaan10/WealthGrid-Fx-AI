import { GlassCard } from "@/components/brand/GlassCard";
import { caps } from "@/config/rewards";
import { formatUsd } from "@/lib/utils";

function ProgressTrack({
  ratio,
  label,
  earned,
  cap,
  tone,
}: {
  ratio: number;
  label: string;
  earned: number;
  cap: number;
  tone: "gold" | "cream";
}) {
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="min-w-0 text-[10px] uppercase leading-4 tracking-[0.16em] text-muted">{label}</p>
        <p className="shrink-0 tabular-nums text-sm text-gold">{pct.toFixed(1)}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <div
          className={tone === "gold" ? "h-full rounded-full bg-gold-sheen" : "h-full rounded-full bg-cream/80"}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p
          className={`min-w-0 truncate font-display text-xl tabular-nums ${
            tone === "gold" ? "text-gold-bright" : "text-cream"
          }`}
        >
          {formatUsd(earned)}
        </p>
        <p className="shrink-0 text-sm tabular-nums text-muted">/ {formatUsd(cap)}</p>
      </div>
    </div>
  );
}

export function CapBar({
  personal,
  earned,
  cap,
}: {
  personal: number;
  earned: number;
  cap: number;
}) {
  const ratio = cap > 0 ? Math.min(1, earned / cap) : 0;
  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-center font-display text-2xl">Package cap</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gold-line/30 bg-black/25 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Personal</p>
          <p className="mt-1 font-display text-2xl text-gold-bright">{formatUsd(personal)}</p>
        </div>
        <div className="rounded-xl border border-gold-line/30 bg-black/25 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Earned</p>
          <p className="mt-1 font-display text-2xl text-cream">{formatUsd(earned)}</p>
        </div>
        <div className="rounded-xl border border-gold-line/30 bg-black/25 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{caps.tradingMultiple}× limit</p>
          <p className="mt-1 font-display text-2xl text-gold">{formatUsd(cap)}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/50">
        <div className="h-full rounded-full bg-gold-sheen" style={{ width: `${ratio * 100}%` }} />
      </div>
    </GlassCard>
  );
}

export function DualCapProgress({
  principal,
  networkPrincipal,
  tradingEarned,
  tradingCap,
  networkEarned,
  networkCap,
}: {
  principal: number;
  networkPrincipal?: number;
  tradingEarned: number;
  tradingCap: number;
  networkEarned: number;
  networkCap: number;
}) {
  const networkBasis = networkPrincipal ?? principal;
  return (
    <GlassCard className="overflow-hidden p-5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Lifetime ceilings</p>
          <h3 className="font-display text-2xl">Cap progress</h3>
        </div>
        <p className="shrink-0 text-xs text-muted">
          Paid {formatUsd(principal)} · {caps.tradingMultiple}× trading
          {networkBasis !== principal
            ? ` · network basis ${formatUsd(networkBasis)} (${caps.networkMultiple}×, includes unpaid loan)`
            : ` · ${caps.networkMultiple}× network`}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ProgressTrack
          tone="gold"
          label={`Daily trading ROI toward ${caps.tradingMultiple}×`}
          earned={tradingEarned}
          cap={tradingCap}
          ratio={tradingCap > 0 ? tradingEarned / tradingCap : 0}
        />
        <ProgressTrack
          tone="cream"
          label={`Network rewards toward ${caps.networkMultiple}×`}
          earned={networkEarned}
          cap={networkCap}
          ratio={networkCap > 0 ? networkEarned / networkCap : 0}
        />
      </div>
    </GlassCard>
  );
}
