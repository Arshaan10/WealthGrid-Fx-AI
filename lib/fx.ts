export type FxQuote = {
  pair: string;
  price: number;
  change: number;
};

type Cache = { at: number; quotes: FxQuote[]; source: "live" | "mock" };

const TTL_MS = 60_000;

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

let cache: Cache | null = null;

function hashDay(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function mockQuotes(): FxQuote[] {
  const seed = hashDay();
  return FALLBACK.map((q, i) => {
    const wobble = ((seed + i * 17) % 100) / 10000;
    const sign = (seed + i) % 2 === 0 ? 1 : -1;
    return {
      pair: q.pair,
      price: Number((q.price * (1 + sign * wobble)).toFixed(q.pair === "XAUUSD" || q.pair === "USDJPY" ? 2 : 4)),
      change: Number((q.change + sign * wobble * 100).toFixed(2)),
    };
  });
}

function pairFromUsd(base: string, usdPerBase: number, usdPerQuote: number, decimals: number): number {
  return Number((usdPerQuote / usdPerBase).toFixed(decimals));
}

export async function getFxQuotes(): Promise<{ quotes: FxQuote[]; source: "live" | "mock"; asOf: string }> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return { quotes: cache.quotes, source: cache.source, asOf: new Date(cache.at).toISOString() };
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("fx http");
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (json.result !== "success" || !json.rates) throw new Error("fx payload");

    const r = json.rates;
    const eur = r.EUR;
    const gbp = r.GBP;
    const jpy = r.JPY;
    const chf = r.CHF;
    const aud = r.AUD;
    const cad = r.CAD;
    const nzd = r.NZD;

    if (!eur || !gbp || !jpy || !chf || !aud || !cad || !nzd) throw new Error("fx missing");

    const xau = r.XAU;
    const gold = xau
      ? Number((1 / xau).toFixed(2))
      : mockQuotes().find((q) => q.pair === "XAUUSD")!.price;

    const live: FxQuote[] = [
      { pair: "EURUSD", price: pairFromUsd("EUR", eur, 1, 4), change: 0 },
      { pair: "GBPUSD", price: pairFromUsd("GBP", gbp, 1, 4), change: 0 },
      { pair: "USDJPY", price: Number(jpy.toFixed(2)), change: 0 },
      { pair: "USDCHF", price: Number(chf.toFixed(4)), change: 0 },
      { pair: "AUDUSD", price: pairFromUsd("AUD", aud, 1, 4), change: 0 },
      { pair: "USDCAD", price: Number(cad.toFixed(4)), change: 0 },
      { pair: "NZDUSD", price: pairFromUsd("NZD", nzd, 1, 4), change: 0 },
      { pair: "XAUUSD", price: gold, change: 0 },
    ];

    const prev = cache?.quotes;
    const quotes = live.map((q) => {
      const last = prev?.find((p) => p.pair === q.pair);
      const change = last ? Number((((q.price - last.price) / last.price) * 100).toFixed(2)) : mockQuotes().find((m) => m.pair === q.pair)?.change ?? 0;
      return { ...q, change };
    });

    cache = { at: Date.now(), quotes, source: "live" };
    return { quotes, source: "live", asOf: new Date(cache.at).toISOString() };
  } catch {
    const quotes = mockQuotes();
    cache = { at: Date.now(), quotes, source: "mock" };
    return { quotes, source: "mock", asOf: new Date(cache.at).toISOString() };
  }
}
