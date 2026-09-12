import { ArrowRightLeft, Clock3, Wallet } from "lucide-react";
import { GlassCard } from "@/components/brand/GlassCard";
import { rewardsClock, walletRouting } from "@/config/rewards";

export function RoutingBanner() {
  return (
    <GlassCard className="p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gold-line/40 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-gold">
            <Wallet size={16} />
            <p className="text-[11px] uppercase tracking-[0.18em]">Trading desk</p>
          </div>
          <p className="mt-2 font-display text-xl text-gold-bright">{walletRouting.trading.copy}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{walletRouting.trading.detail}</p>
        </div>
        <div className="rounded-xl border border-gold-line/40 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-cream">
            <ArrowRightLeft size={16} />
            <p className="text-[11px] uppercase tracking-[0.18em]">Network desk</p>
          </div>
          <p className="mt-2 font-display text-xl text-cream">{walletRouting.network.copy}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{walletRouting.network.detail}</p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[11px] text-muted">
        <Clock3 size={12} />
        Calendar timezone: {rewardsClock.timezone} — {rewardsClock.note}
      </p>
    </GlassCard>
  );
}
