import type { ReactNode } from "react";
import { GlassCard } from "@/components/brand/GlassCard";

export function MetricGrid({
  title,
  action,
  items,
}: {
  title: string;
  action?: ReactNode;
  items: { label: string; value: string }[];
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl">{title}</h3>
        {action}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-gold-line/30 bg-black/25 px-4 py-3">
            <p className="font-display text-2xl text-gold-bright">{item.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
