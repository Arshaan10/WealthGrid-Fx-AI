import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "APPROVED" ||
    status === "SENT" ||
    status === "PAID" ||
    status === "ACTIVE" ||
    status === "published" ||
    status === "CREDIT" ||
    status === "TOPUP"
      ? "text-success border-success/30 bg-success/10"
      : status === "REJECTED" ||
          status === "CANCELLED" ||
          status === "FAILED_SEND" ||
          status === "DEBIT" ||
          status === "PAYOUT"
        ? "text-danger border-danger/30 bg-danger/10"
        : "text-gold border-gold-line bg-gold-dim";

  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider", tone)}>
      {status}
    </span>
  );
}
