import { riskDisclaimer } from "@/config/rewards";
import { cn } from "@/lib/utils";

export function RiskDisclaimer({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-gold-line/70 bg-black/40 px-4 py-3 text-xs leading-relaxed text-muted",
        className,
      )}
    >
      <p className="mb-1 font-semibold uppercase tracking-[0.18em] text-gold/80">
        Risk disclosure
      </p>
      <p>{compact ? riskDisclaimer.short : riskDisclaimer.long}</p>
    </aside>
  );
}
