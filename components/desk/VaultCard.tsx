import type { ReactNode } from "react";
import { GlassCard } from "@/components/brand/GlassCard";
import { formatUsd } from "@/lib/utils";

export function VaultCard({
  title,
  available,
  pending,
  accent = "gold",
  footer,
}: {
  title: string;
  available: number;
  pending?: number;
  accent?: "gold" | "cream";
  footer?: ReactNode;
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80">{title}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Available</p>
          <p className={`mt-1 font-display text-3xl ${accent === "gold" ? "gold-text" : "text-cream"}`}>
            {formatUsd(available)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Pending</p>
          <p className="mt-1 font-display text-3xl text-cream">{formatUsd(pending ?? 0)}</p>
        </div>
      </div>
      {footer ? <div className="mt-4 text-xs text-muted">{footer}</div> : null}
    </GlassCard>
  );
}

export function VaultStrip({
  trading,
  network,
}: {
  trading: { available: number; pending?: number };
  network: { available: number; pending?: number };
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <VaultCard
        title="Trading vault"
        available={trading.available}
        pending={trading.pending}
        footer="USDT booked to your Trading wallet after on-chain confirmations."
      />
      <VaultCard
        title="Network vault"
        available={network.available}
        pending={network.pending}
        accent="cream"
        footer="Referral and network credits. Withdrawals debit the selected vault immediately."
      />
    </div>
  );
}
