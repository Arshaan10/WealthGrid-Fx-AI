import { formatUsd } from "@/lib/utils";

type DualPoint = { label: string; trading: number; network: number };
type BarPoint = { label: string; value: number };
type GroupedPoint = { label: string; deposits: number; withdrawals: number };
type Slice = { label: string; value: number; color: string };

function maxOf(values: number[], fallback = 1) {
  return Math.max(fallback, ...values);
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = Math.ceil(value / pow);
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

export function DualAreaChart({
  points,
  height = 220,
}: {
  points: DualPoint[];
  height?: number;
}) {
  const width = 640;
  const pad = { top: 16, right: 12, bottom: 28, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const peak = niceMax(maxOf(points.flatMap((p) => [p.trading, p.network])));
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const toPath = (key: "trading" | "network") => {
    if (points.length === 0) return "";
    return points
      .map((point, i) => {
        const x = pad.left + i * step;
        const y = pad.top + innerH - (point[key] / peak) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const toArea = (key: "trading" | "network") => {
    const line = toPath(key);
    if (!line || points.length === 0) return "";
    const lastX = pad.left + (points.length - 1) * step;
    return `${line} L${lastX.toFixed(1)},${pad.top + innerH} L${pad.left},${pad.top + innerH} Z`;
  };

  const ticks = points.filter((_, i) => i === 0 || i === points.length - 1 || i % 7 === 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Earnings over time">
      <defs>
        <linearGradient id="tradeFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4efe3" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f4efe3" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH * (1 - t)}
          y2={pad.top + innerH * (1 - t)}
          stroke="rgba(212,175,55,0.12)"
        />
      ))}
      <path d={toArea("network")} fill="url(#netFill)" />
      <path d={toArea("trading")} fill="url(#tradeFill)" />
      <path d={toPath("network")} fill="none" stroke="#f4efe3" strokeWidth="2" />
      <path d={toPath("trading")} fill="none" stroke="#d4af37" strokeWidth="2.2" />
      {ticks.map((point) => {
        const i = points.indexOf(point);
        return (
          <text
            key={point.label + i}
            x={pad.left + i * step}
            y={height - 6}
            textAnchor="middle"
            fill="#9c9484"
            fontSize="10"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}

export function GoldBarChart({
  points,
  height = 200,
  color = "#d4af37",
}: {
  points: BarPoint[];
  height?: number;
  color?: string;
}) {
  const width = 640;
  const pad = { top: 12, right: 8, bottom: 28, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const peak = niceMax(maxOf(points.map((p) => p.value)));
  const gap = 8;
  const barW = points.length ? (innerW - gap * points.length) / points.length : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
      {points.map((point, i) => {
        const h = (point.value / peak) * innerH;
        const x = pad.left + i * (barW + gap) + gap / 2;
        const y = pad.top + innerH - h;
        return (
          <g key={point.label + i}>
            <rect x={x} y={pad.top} width={barW} height={innerH} rx="4" fill="rgba(212,175,55,0.06)" />
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx="4" fill={color} />
            <text x={x + barW / 2} y={height - 6} textAnchor="middle" fill="#9c9484" fontSize="10">
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function GroupedVolumeChart({
  points,
  height = 200,
}: {
  points: GroupedPoint[];
  height?: number;
}) {
  const width = 720;
  const pad = { top: 12, right: 8, bottom: 28, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const peak = niceMax(maxOf(points.flatMap((p) => [p.deposits, p.withdrawals])));
  const gap = 10;
  const groupW = points.length ? (innerW - gap * points.length) / points.length : 0;
  const barW = Math.max(3, (groupW - 4) / 2);
  const sample = points.filter((_, i) => i === 0 || i === points.length - 1 || i % 4 === 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Deposit and withdrawal volume">
      {points.map((point, i) => {
        const x = pad.left + i * (groupW + gap) + gap / 2;
        const dH = (point.deposits / peak) * innerH;
        const wH = (point.withdrawals / peak) * innerH;
        return (
          <g key={point.label + i}>
            <rect
              x={x}
              y={pad.top + innerH - dH}
              width={barW}
              height={Math.max(dH, 1)}
              rx="3"
              fill="#d4af37"
            />
            <rect
              x={x + barW + 3}
              y={pad.top + innerH - wH}
              width={barW}
              height={Math.max(wH, 1)}
              rx="3"
              fill="#f4efe3"
            />
          </g>
        );
      })}
      {sample.map((point) => {
        const i = points.indexOf(point);
        const x = pad.left + i * (groupW + gap) + gap / 2 + groupW / 2;
        return (
          <text key={point.label} x={x} y={height - 6} textAnchor="middle" fill="#9c9484" fontSize="10">
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  slices,
  center,
}: {
  slices: Slice[];
  center?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="14" />
        {slices.map((slice) => {
          const len = (slice.value / total) * c;
          const dash = `${len} ${c - len}`;
          const node = (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return node;
        })}
        {center ? (
          <text x="60" y="64" textAnchor="middle" fill="#f3d77a" fontSize="11" fontFamily="Georgia, serif">
            {center}
          </text>
        ) : null}
      </svg>
      <ul className="space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="text-muted">{slice.label}</span>
            <span className="ml-auto font-medium text-cream">{formatUsd(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
