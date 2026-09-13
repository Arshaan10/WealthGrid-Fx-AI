"use client";

import { useEffect, useState } from "react";
import type { FxQuote } from "@/lib/fx";
import { cn } from "@/lib/utils";

const FALLBACK: FxQuote[] = [
  { pair: "EURUSD", price: 1.0842, change: 0.12 },
  { pair: "GBPUSD", price: 1.2718, change: -0.08 },
  { pair: "USDJPY", price: 149.62, change: 0.21 },
  { pair: "USDCHF", price: 0.8621, change: -0.05 },
  { pair: "AUDUSD", price: 0.6614, change: 0.09 },
  { pair: "USDCAD", price: 1.3592, change: 0.04 },
  { pair: "NZDUSD", price: 0.6028, change: -0.11 },
  { pair: "XAUUSD", price: 2384.6, change: 0.34 },
];

function formatPrice(pair: string, price: number) {
  if (pair === "XAUUSD" || pair === "USDJPY") return price.toFixed(2);
  return price.toFixed(4);
}

function QuoteChip({ quote }: { quote: FxQuote }) {
  const up = quote.change >= 0;
  return (
    <span className="mx-5 inline-flex items-baseline gap-2 whitespace-nowrap font-mono text-[11px] tracking-wide sm:text-xs">
      <span className="font-semibold text-gold-bright">{quote.pair}</span>
      <span className="text-cream">{formatPrice(quote.pair, quote.price)}</span>
      <span className={cn(up ? "text-success" : "text-danger")}>
        {up ? "+" : ""}
        {quote.change.toFixed(2)}%
      </span>
    </span>
  );
}

export function ForexTicker({
  initial,
  source,
  compact = false,
}: {
  initial?: FxQuote[];
  source?: "live" | "mock";
  compact?: boolean;
}) {
  const [quotes, setQuotes] = useState<FxQuote[]>(initial?.length ? initial : FALLBACK);
  const [feed, setFeed] = useState<"live" | "mock">(source ?? "mock");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/fx", { cache: "no-store" });
        const data = (await res.json()) as { quotes?: FxQuote[]; source?: "live" | "mock" };
        if (!cancelled && data.quotes?.length) {
          setQuotes(data.quotes);
          if (data.source) setFeed(data.source);
        }
      } catch {
        /* keep last quotes */
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const loop = [...quotes, ...quotes];

  return (
    <div
      className={cn(
        "relative min-w-0 max-w-full overflow-hidden border-y border-gold-line/50 bg-black/80",
        compact ? "py-1.5" : "py-2",
      )}
      aria-label="Live Forex pairs"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black to-transparent" />
      <p className="sr-only">
        {feed === "live" ? "Live public FX rates" : "Indicative FX rates"} refreshed every minute.
      </p>
      <div className="ticker-track flex w-max max-w-none items-center">
        {loop.map((quote, index) => (
          <QuoteChip key={`${quote.pair}-${index}`} quote={quote} />
        ))}
      </div>
    </div>
  );
}
