import type { ReactNode } from "react";
import { GlassCard } from "@/components/brand/GlassCard";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">{label}</p>
          <p className="mt-2 font-display text-3xl gold-text">{value}</p>
          {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
        </div>
        {icon ? <div className="text-gold/70">{icon}</div> : null}
      </div>
    </GlassCard>
  );
}
