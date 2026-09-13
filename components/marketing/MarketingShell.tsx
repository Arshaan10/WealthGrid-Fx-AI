import type { ReactNode } from "react";
import { ForexAtmosphere } from "@/components/brand/ForexAtmosphere";
import { ForexTicker } from "@/components/brand/ForexTicker";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { getFxQuotes } from "@/lib/fx";

export async function MarketingShell({
  children,
  atmosphere = "page",
}: {
  children: ReactNode;
  atmosphere?: "page" | "hero";
}) {
  const fx = await getFxQuotes();
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden">
      <ForexAtmosphere variant={atmosphere} />
      <MarketingHeader />
      <div className="relative z-20">
        <ForexTicker initial={fx.quotes} source={fx.source} />
      </div>
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
