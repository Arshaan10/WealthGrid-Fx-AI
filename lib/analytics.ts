import {
  isNetworkRewardType,
  isTradingRewardType,
  rewardsClock,
} from "@/config/rewards";
import { eachCalendarDay, zonedDateKey } from "@/lib/clock";
import { prisma } from "@/lib/prisma";
import { asNumber } from "@/lib/utils";

export type DayPoint = { date: string; trading: number; network: number };
export type NamedPoint = { label: string; value: number };
export type VolumePoint = { date: string; deposits: number; withdrawals: number };

function emptyDay(date: string): DayPoint {
  return { date, trading: 0, network: 0 };
}

function fillDays(from: Date, to: Date, hits: Map<string, DayPoint>): DayPoint[] {
  return eachCalendarDay(from, to).map((day) => {
    const key = zonedDateKey(day, rewardsClock.timezone);
    return hits.get(key) ?? emptyDay(key);
  });
}

function shortLabel(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${month}/${day}`;
}

export function labelDay(point: DayPoint) {
  return { ...point, label: shortLabel(point.date) };
}

export function rollupWeekly(points: DayPoint[]) {
  const buckets: { label: string; trading: number; network: number }[] = [];
  for (let i = 0; i < points.length; i += 7) {
    const slice = points.slice(i, i + 7);
    const last = slice[slice.length - 1];
    buckets.push({
      label: last ? shortLabel(last.date) : `W${buckets.length + 1}`,
      trading: Number(slice.reduce((sum, row) => sum + row.trading, 0).toFixed(2)),
      network: Number(slice.reduce((sum, row) => sum + row.network, 0).toFixed(2)),
    });
  }
  return buckets;
}

export async function userEarningsSeries(userId: string, days = 28): Promise<DayPoint[]> {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const rows = await prisma.rewardPayout.findMany({
    where: { userId, status: "PAID", createdAt: { gte: from } },
    select: { type: true, amount: true, createdAt: true },
  });

  const hits = new Map<string, DayPoint>();
  for (const row of rows) {
    const key = zonedDateKey(row.createdAt, rewardsClock.timezone);
    const bucket = hits.get(key) ?? emptyDay(key);
    const amount = asNumber(row.amount);
    if (isTradingRewardType(row.type)) bucket.trading += amount;
    else if (isNetworkRewardType(row.type)) bucket.network += amount;
    hits.set(key, bucket);
  }

  return fillDays(from, to, hits).map((point) => ({
    ...point,
    trading: Number(point.trading.toFixed(2)),
    network: Number(point.network.toFixed(2)),
  }));
}

export function weeklyTradingBarsFromSeries(series: DayPoint[], weeks = 6) {
  const slice = series.slice(-weeks * 7);
  const buckets: { label: string; value: number }[] = [];

  for (let i = 0; i < slice.length; i += 7) {
    const week = slice.slice(i, i + 7);
    const value = week.reduce((sum, row) => sum + row.trading, 0);
    const last = week[week.length - 1];
    buckets.push({
      label: last ? shortLabel(last.date) : `W${buckets.length + 1}`,
      value: Number(value.toFixed(2)),
    });
  }

  return buckets;
}

export async function userWeeklyTradingBars(userId: string, weeks = 6) {
  const series = await userEarningsSeries(userId, weeks * 7);
  return weeklyTradingBarsFromSeries(series, weeks);
}

export async function platformVolumeSeries(days = 21): Promise<VolumePoint[]> {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const [deposits, withdrawals] = await Promise.all([
    prisma.depositIntent.findMany({
      where: { status: "APPROVED", createdAt: { gte: from } },
      select: { amount: true, createdAt: true },
    }),
    prisma.withdrawalRequest.findMany({
      where: {
        status: { in: ["APPROVED", "SENDING", "CONFIRMING", "SENT", "CONFIRMED"] },
        createdAt: { gte: from },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const hits = new Map<string, VolumePoint>();
  const ensure = (key: string) => hits.get(key) ?? { date: key, deposits: 0, withdrawals: 0 };

  for (const row of deposits) {
    const key = zonedDateKey(row.createdAt, rewardsClock.timezone);
    const bucket = ensure(key);
    bucket.deposits += asNumber(row.amount);
    hits.set(key, bucket);
  }
  for (const row of withdrawals) {
    const key = zonedDateKey(row.createdAt, rewardsClock.timezone);
    const bucket = ensure(key);
    bucket.withdrawals += asNumber(row.amount);
    hits.set(key, bucket);
  }

  return eachCalendarDay(from, to).map((day) => {
    const key = zonedDateKey(day, rewardsClock.timezone);
    const point = hits.get(key) ?? { date: key, deposits: 0, withdrawals: 0 };
    return {
      date: key,
      deposits: Number(point.deposits.toFixed(2)),
      withdrawals: Number(point.withdrawals.toFixed(2)),
    };
  });
}

export async function platformRegistrationSeries(days = 21): Promise<NamedPoint[]> {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true },
  });

  const hits = new Map<string, number>();
  for (const row of users) {
    const key = zonedDateKey(row.createdAt, rewardsClock.timezone);
    hits.set(key, (hits.get(key) ?? 0) + 1);
  }

  return eachCalendarDay(from, to).map((day) => {
    const key = zonedDateKey(day, rewardsClock.timezone);
    return { label: shortLabel(key), value: hits.get(key) ?? 0 };
  });
}

export async function platformRewardMix(): Promise<NamedPoint[]> {
  const rows = await prisma.rewardPayout.groupBy({
    by: ["type"],
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  const trading = rows
    .filter((row) => isTradingRewardType(row.type))
    .reduce((sum, row) => sum + asNumber(row._sum.amount ?? 0), 0);
  const network = rows
    .filter((row) => isNetworkRewardType(row.type))
    .reduce((sum, row) => sum + asNumber(row._sum.amount ?? 0), 0);

  return [
    { label: "Trading", value: Number(trading.toFixed(2)) },
    { label: "Network", value: Number(network.toFixed(2)) },
  ];
}

export async function platformRewardByType(): Promise<NamedPoint[]> {
  const rows = await prisma.rewardPayout.groupBy({
    by: ["type"],
    where: { status: "PAID" },
    _sum: { amount: true },
  });
  return rows
    .map((row) => ({ label: row.type, value: Number(asNumber(row._sum.amount ?? 0).toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
}

export async function platformKpis() {
  const from30 = new Date();
  from30.setUTCDate(from30.getUTCDate() - 30);

  const [
    users,
    blocked,
    activations,
    openTickets,
    treasury,
    depositAgg,
    withdrawAgg,
    rewardAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { blocked: true } }),
    prisma.packageActivation.count({ where: { status: "ACTIVE" } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } }),
    prisma.treasury.findUnique({ where: { id: "company" } }),
    prisma.depositIntent.aggregate({
      where: { status: "APPROVED", createdAt: { gte: from30 } },
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: {
        status: { in: ["APPROVED", "SENDING", "CONFIRMING", "SENT", "CONFIRMED"] },
        createdAt: { gte: from30 },
      },
      _sum: { amount: true },
    }),
    prisma.rewardPayout.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  return {
    users,
    blocked,
    activations,
    openTickets,
    treasury: asNumber(treasury?.balance ?? 0),
    deposits30: asNumber(depositAgg._sum.amount ?? 0),
    withdrawals30: asNumber(withdrawAgg._sum.amount ?? 0),
    rewardsPaid: asNumber(rewardAgg._sum.amount ?? 0),
  };
}
