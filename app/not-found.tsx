import { GoldLink } from "@/components/brand/GoldButton";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function NotFound() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
        <h1 className="mt-3 font-display text-5xl">Signal lost</h1>
        <p className="mt-4 text-sm text-muted">
          That route is not on the Whealth Grid desk.
        </p>
        <GoldLink href="/" className="mt-8">
          Return home
        </GoldLink>
      </div>
    </MarketingShell>
  );
}
