import { Wallet } from "lucide-react";
import { GoldButton } from "@/components/brand/GoldButton";

export function DexPlaceholder({
  onAcknowledge,
  busy,
  title = "Connect wallet (coming next)",
  body = "Phase 1 does not call a chain. This records a pending intent in the database so the admin queue and ledger can be exercised. DEX deposit settlement ships in a later phase.",
  actionLabel = "Record DEX placeholder intent",
  busyLabel = "Recording…",
  showAction = true,
}: {
  onAcknowledge?: () => void;
  busy?: boolean;
  title?: string;
  body?: string;
  actionLabel?: string;
  busyLabel?: string;
  showAction?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gold-line bg-black/30 p-4">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 text-gold" size={18} />
        <div>
          <p className="text-sm font-semibold text-cream">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
          {showAction && onAcknowledge ? (
            <GoldButton
              type="button"
              variant="ghost"
              className="mt-3"
              disabled={busy}
              onClick={onAcknowledge}
            >
              {busy ? busyLabel : actionLabel}
            </GoldButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
