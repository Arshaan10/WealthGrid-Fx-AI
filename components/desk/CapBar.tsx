import { GlassCard } from "@/components/brand/GlassCard";
import { formatUsd } from "@/lib/utils";

export function CapBar({
  personal,
  earned,
  cap,
}: {
  personal: number;
  earned: number;
  cap: number;
}) {
  const ratio = cap > 0 ? Math.min(100, (earned / cap) * 100) : 0;
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
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">250% limit</p>
          <p className="mt-1 font-display text-2xl text-gold">{formatUsd(cap)}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/50">
        <div className="h-full rounded-full bg-gold-sheen" style={{ width: `${ratio}%` }} />
      </div>
    </GlassCard>
  );
}
