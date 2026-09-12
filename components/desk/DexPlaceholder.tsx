import { Wallet } from "lucide-react";
import { GoldButton } from "@/components/brand/GoldButton";

export function DexPlaceholder({
  onAcknowledge,
  busy,
}: {
  onAcknowledge: () => void;
  busy?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gold-line bg-black/30 p-4">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 text-gold" size={18} />
        <div>
          <p className="text-sm font-semibold text-cream">Connect wallet (coming next)</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Phase 1 does not call a chain. This records a pending intent in the
            database so the admin queue and ledger can be exercised. DEX deposit
            and withdrawal settlement ships in a later phase.
          </p>
          <GoldButton
            type="button"
            variant="ghost"
            className="mt-3"
            disabled={busy}
            onClick={onAcknowledge}
          >
            {busy ? "Recording…" : "Record DEX placeholder intent"}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}
