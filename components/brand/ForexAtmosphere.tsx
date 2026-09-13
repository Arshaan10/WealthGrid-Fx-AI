export function ForexAtmosphere({ variant = "page" }: { variant?: "page" | "hero" | "desk" }) {
  const intensity = variant === "hero" ? 1 : variant === "desk" ? 0.55 : 0.88;
  const gid = `gold-stroke-${variant}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden"
      style={{ opacity: intensity }}
    >
      <div className="absolute inset-0 desk-grid" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_55%)]" />
      <div className="absolute -left-16 top-[-8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_68%)] blur-2xl" />
      <div className="absolute right-[-6%] top-[12%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.16),transparent_70%)]" />
      <svg
        className="absolute inset-0 h-full w-full max-w-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
            <stop offset="35%" stopColor="#f3d77a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M0 560 C 140 510, 220 620, 360 540 S 560 410, 720 470 980 650, 1140 500 1320 390, 1440 420"
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="1.8"
        />
        <path
          d="M0 620 C 180 600, 260 690, 400 640 S 620 510, 780 560 1020 720, 1200 590 1360 500, 1440 530"
          fill="none"
          stroke="#d4af37"
          strokeOpacity="0.35"
          strokeWidth="1.1"
        />
        {candles.map((c) => (
          <g key={c.x} opacity="0.55">
            <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke="#f3d77a" strokeWidth="1.2" />
            <rect
              x={c.x - 6}
              y={Math.min(c.open, c.close)}
              width="12"
              height={Math.max(6, Math.abs(c.close - c.open))}
              fill={c.close >= c.open ? "rgba(212,175,55,0.55)" : "rgba(10,10,12,0.85)"}
              stroke="#d4af37"
            />
          </g>
        ))}
        {nodes.map((n) => (
          <g key={`${n.x}-${n.y}`}>
            <circle cx={n.x} cy={n.y} r="3" fill="#f3d77a" opacity="0.85" />
            <circle cx={n.x} cy={n.y} r="12" fill="none" stroke="#d4af37" strokeOpacity="0.35" />
          </g>
        ))}
        <line x1="180" y1="160" x2="310" y2="120" stroke="#d4af37" strokeOpacity="0.4" />
        <line x1="310" y1="120" x2="430" y2="190" stroke="#d4af37" strokeOpacity="0.4" />
        <line x1="430" y1="190" x2="560" y2="140" stroke="#d4af37" strokeOpacity="0.28" />
        <line x1="1040" y1="110" x2="1180" y2="160" stroke="#d4af37" strokeOpacity="0.4" />
        <line x1="1180" y1="160" x2="1280" y2="90" stroke="#d4af37" strokeOpacity="0.4" />
        <line x1="860" y1="150" x2="1040" y2="110" stroke="#d4af37" strokeOpacity="0.28" />
        <g opacity="0.7">
          <path d="M980 210 l9 16 h-18 z" fill="#d4af37" />
          <text x="1000" y="224" fill="#f3d77a" fontSize="11" fontFamily="sans-serif">
            BUY
          </text>
          <path d="M640 300 l9 -16 h-18 z" fill="#8a7020" />
          <text x="656" y="298" fill="#d4af37" fontSize="11" fontFamily="sans-serif">
            SIG
          </text>
        </g>
      </svg>
      {variant === "desk" ? (
        <div className="absolute inset-0 bg-[var(--bg-void)]/55" />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--bg-void)] to-transparent" />
    </div>
  );
}

const candles = [
  { x: 70, high: 500, low: 620, open: 540, close: 590 },
  { x: 115, high: 470, low: 600, open: 580, close: 500 },
  { x: 160, high: 450, low: 580, open: 510, close: 470 },
  { x: 205, high: 430, low: 560, open: 480, close: 530 },
  { x: 250, high: 410, low: 540, open: 520, close: 430 },
  { x: 295, high: 390, low: 520, open: 440, close: 410 },
  { x: 340, high: 380, low: 510, open: 420, close: 470 },
  { x: 1080, high: 240, low: 360, open: 330, close: 270 },
  { x: 1125, high: 230, low: 350, open: 280, close: 310 },
  { x: 1170, high: 220, low: 340, open: 305, close: 245 },
  { x: 1215, high: 210, low: 330, open: 250, close: 230 },
  { x: 1260, high: 200, low: 320, open: 240, close: 280 },
  { x: 1305, high: 190, low: 310, open: 270, close: 215 },
  { x: 1350, high: 180, low: 300, open: 220, close: 200 },
];

const nodes = [
  { x: 180, y: 160 },
  { x: 310, y: 120 },
  { x: 430, y: 190 },
  { x: 560, y: 140 },
  { x: 860, y: 150 },
  { x: 1040, y: 110 },
  { x: 1180, y: 160 },
  { x: 1280, y: 90 },
];
