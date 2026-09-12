export function ForexAtmosphere({ variant = "page" }: { variant?: "page" | "hero" | "desk" }) {
  const intensity = variant === "hero" ? 0.55 : variant === "desk" ? 0.28 : 0.4;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: intensity }}
    >
      <div className="absolute inset-0 desk-grid" />
      <div className="absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.16),transparent_68%)] blur-2xl" />
      <div className="absolute right-[-8%] top-[20%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.1),transparent_70%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
            <stop offset="40%" stopColor="#f3d77a" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 540 C 160 500, 220 610, 360 560 S 560 430, 720 480 980 640, 1140 520 1320 400, 1440 430"
          fill="none"
          stroke="url(#goldStroke)"
          strokeWidth="1.4"
        />
        <path
          d="M0 610 C 180 590, 260 680, 400 640 S 620 520, 780 570 1020 710, 1200 600 1360 520, 1440 540"
          fill="none"
          stroke="#d4af37"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        {candles.map((c) => (
          <g key={c.x} opacity="0.22">
            <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke="#d4af37" strokeWidth="1" />
            <rect
              x={c.x - 5}
              y={Math.min(c.open, c.close)}
              width="10"
              height={Math.max(4, Math.abs(c.close - c.open))}
              fill={c.close < c.open ? "#d4af37" : "transparent"}
              stroke="#d4af37"
            />
          </g>
        ))}
        {nodes.map((n) => (
          <g key={`${n.x}-${n.y}`}>
            <circle cx={n.x} cy={n.y} r="2.4" fill="#f3d77a" opacity="0.55" />
            <circle cx={n.x} cy={n.y} r="10" fill="none" stroke="#d4af37" strokeOpacity="0.18" />
          </g>
        ))}
        <line x1="180" y1="210" x2="310" y2="168" stroke="#d4af37" strokeOpacity="0.16" />
        <line x1="310" y1="168" x2="430" y2="240" stroke="#d4af37" strokeOpacity="0.16" />
        <line x1="1040" y1="140" x2="1180" y2="190" stroke="#d4af37" strokeOpacity="0.16" />
        <line x1="1180" y1="190" x2="1280" y2="120" stroke="#d4af37" strokeOpacity="0.16" />
        <g opacity="0.35">
          <path d="M980 250 l8 14 h-16 z" fill="#d4af37" />
          <text x="996" y="262" fill="#f3d77a" fontSize="10" fontFamily="sans-serif">
            BUY
          </text>
          <path d="M620 330 l8 -14 h-16 z" fill="#8a7020" />
          <text x="636" y="328" fill="#d4af37" fontSize="10" fontFamily="sans-serif">
            SIG
          </text>
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg-void)] to-transparent" />
    </div>
  );
}

const candles = [
  { x: 90, high: 420, low: 510, open: 440, close: 490 },
  { x: 130, high: 400, low: 500, open: 480, close: 420 },
  { x: 170, high: 390, low: 470, open: 430, close: 405 },
  { x: 210, high: 380, low: 460, open: 410, close: 445 },
  { x: 250, high: 360, low: 450, open: 440, close: 375 },
  { x: 290, high: 350, low: 430, open: 380, close: 360 },
  { x: 1180, high: 280, low: 360, open: 340, close: 300 },
  { x: 1220, high: 270, low: 350, open: 305, close: 330 },
  { x: 1260, high: 260, low: 340, open: 325, close: 275 },
  { x: 1300, high: 250, low: 330, open: 280, close: 260 },
];

const nodes = [
  { x: 180, y: 210 },
  { x: 310, y: 168 },
  { x: 430, y: 240 },
  { x: 1040, y: 140 },
  { x: 1180, y: 190 },
  { x: 1280, y: 120 },
  { x: 860, y: 200 },
];
