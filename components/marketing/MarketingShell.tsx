import type { ReactNode } from "react";
import { ForexAtmosphere } from "@/components/brand/ForexAtmosphere";
import { ForexTicker } from "@/components/brand/ForexTicker";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export function MarketingShell({
  children,
  atmosphere = "page",
}: {
  children: ReactNode;
  atmosphere?: "page" | "hero";
}) {
  return (
    <div className="relative min-h-screen">
      <ForexAtmosphere variant={atmosphere} />
      <MarketingHeader />
      <div className="relative z-20">
        <ForexTicker />
      </div>
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
