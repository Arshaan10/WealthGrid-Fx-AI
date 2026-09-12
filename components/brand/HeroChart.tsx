export function HeroChart() {
  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">EURUSD · AI grid</p>
      <p className="mt-1 font-display text-2xl gold-text">1.08742</p>
      <svg viewBox="0 0 360 160" className="mt-3 h-36 w-full" aria-hidden>
        <defs>
          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 50, 80, 110, 140].map((y) => (
          <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#d4af37" strokeOpacity="0.12" />
        ))}
        <path
          d="M0 110 L30 98 L60 120 L90 86 L120 94 L150 70 L180 82 L210 58 L240 72 L270 48 L300 60 L330 40 L360 52"
          fill="none"
          stroke="#f3d77a"
          strokeWidth="1.6"
        />
        <path
          d="M0 110 L30 98 L60 120 L90 86 L120 94 L150 70 L180 82 L210 58 L240 72 L270 48 L300 60 L330 40 L360 52 V160 H0 Z"
          fill="url(#heroFill)"
        />
        {[
          [28, 88, 118, 98, 108],
          [70, 96, 132, 122, 104],
          [112, 70, 110, 86, 96],
          [154, 58, 96, 72, 68],
          [196, 50, 90, 82, 58],
          [238, 44, 86, 70, 52],
          [280, 38, 78, 62, 46],
          [322, 32, 70, 54, 40],
        ].map(([x, high, low, open, close]) => (
          <g key={x} opacity="0.85">
            <line x1={x} y1={high} x2={x} y2={low} stroke="#d4af37" />
            <rect
              x={x - 5}
              y={Math.min(open, close)}
              width="10"
              height={Math.max(5, Math.abs(close - open))}
              fill={close < open ? "#d4af37" : "#1a1608"}
              stroke="#d4af37"
            />
          </g>
        ))}
        <circle cx="270" cy="48" r="3" fill="#f3d77a" />
        <text x="278" y="44" fill="#f3d77a" fontSize="9">
          SIG
        </text>
      </svg>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.16em] text-muted">
        <span>Neural overlay armed</span>
        <span>Not a live feed</span>
      </div>
    </div>
  );
}
