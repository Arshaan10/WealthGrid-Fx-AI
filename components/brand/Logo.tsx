import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3", className)}>
      <span className="relative grid h-10 w-10 place-items-center rounded-md border border-gold-line bg-black/50 shadow-gold">
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
          <rect x="6" y="22" width="4" height="10" fill="#d4af37" opacity="0.55" />
          <rect x="13" y="14" width="4" height="18" fill="#f3d77a" />
          <rect x="20" y="18" width="4" height="14" fill="#d4af37" opacity="0.75" />
          <rect x="27" y="10" width="4" height="22" fill="#f3d77a" />
          <circle cx="29" cy="9" r="2" fill="#f3d77a" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg tracking-wide gold-text sm:text-xl">
          {compact ? "Whealth" : "Whealth Grid"}
        </span>
        {!compact ? (
          <span className="block text-[10px] uppercase tracking-[0.28em] text-muted">
            Fx AI
          </span>
        ) : null}
      </span>
    </Link>
  );
}
