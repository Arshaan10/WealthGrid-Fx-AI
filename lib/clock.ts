import { rewardsClock } from "@/config/rewards";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Calendar date `YYYY-MM-DD` in the configured rewards timezone. */
export function zonedDateKey(date: Date, timeZone = rewardsClock.timezone): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** JS weekday (0 = Sunday) in the configured rewards timezone. */
export function zonedWeekday(date: Date, timeZone = rewardsClock.timezone): number {
  const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return WEEKDAY_INDEX[label] ?? 0;
}

export function isTradingWeekday(date: Date, timeZone = rewardsClock.timezone): boolean {
  const weekday = zonedWeekday(date, timeZone);
  return (rewardsClock.tradingWeekdays as readonly number[]).includes(weekday);
}

/** ISO week key `YYYY-Www` in the rewards timezone (for weekly loyalty idempotency). */
export function zonedIsoWeekKey(date: Date, timeZone = rewardsClock.timezone): string {
  const key = zonedDateKey(date, timeZone);
  const [year, month, day] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const thursday = new Date(utc);
  thursday.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Parse `YYYY-MM-DD` as noon UTC so the calendar day is unambiguous in Asia/Dubai (UTC+4).
 */
export function parseDateKey(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!match) {
    throw new Error(`Expected YYYY-MM-DD, got "${key}"`);
  }
  return new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function eachCalendarDay(from: Date, to: Date): Date[] {
  const start = parseDateKey(zonedDateKey(from));
  const end = parseDateKey(zonedDateKey(to));
  const days: Date[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addUtcDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function eachTradingDay(from: Date, to: Date, timeZone = rewardsClock.timezone): Date[] {
  return eachCalendarDay(from, to).filter((day) => isTradingWeekday(day, timeZone));
}
