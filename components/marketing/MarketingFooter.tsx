import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { RiskDisclaimer } from "@/components/brand/RiskDisclaimer";
import { nav } from "@/config/site";

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-gold-line/50 bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm text-muted">
            A gold-desk control plane for AI grid trading structure, ranks, and
            network rewards. Withdrawals settle from company treasury; on-chain
            wallet-connect send is later.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted hover:text-gold-bright">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="text-muted hover:text-gold-bright">
            Login
          </Link>
          <Link href="/register" className="text-muted hover:text-gold-bright">
            Register
          </Link>
        </div>
        <div className="md:col-span-2">
          <RiskDisclaimer compact />
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted/70">
            © {new Date().getFullYear()} Whealth Grid Fx AI · Phase 1
          </p>
        </div>
      </div>
    </footer>
  );
}
