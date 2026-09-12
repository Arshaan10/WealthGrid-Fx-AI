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
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className={`font-display text-2xl ${tone === "gold" ? "text-gold-bright" : "text-cream"}`}>
            {formatUsd(earned)}
            <span className="ml-2 text-sm text-muted">/ {formatUsd(cap)}</span>
          </p>
        </div>
        <p className="text-sm text-gold">{pct.toFixed(1)}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <div
          className={tone === "gold" ? "h-full rounded-full bg-gold-sheen" : "h-full rounded-full bg-cream/80"}
          style={{ width: `${pct}%` }}
        />
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
  tradingEarned,
  tradingCap,
  networkEarned,
  networkCap,
}: {
  principal: number;
  tradingEarned: number;
  tradingCap: number;
  networkEarned: number;
  networkCap: number;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Lifetime ceilings</p>
          <h3 className="font-display text-2xl">Cap progress</h3>
        </div>
        <p className="text-xs text-muted">
          Principal {formatUsd(principal)} · trading {caps.tradingMultiple}× · network {caps.networkMultiple}×
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
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
