import { boosterTierBySlug, boosters, type BoosterTier } from "@/config/rewards";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "@/lib/treasury";
import { asNumber } from "@/lib/utils";

export async function getActiveDirectVolume(userId: string, db: DbClient = prisma): Promise<number> {
  const directs = await db.user.findMany({
    where: { referredById: userId },
    select: { id: true },
  });
  if (directs.length === 0) return 0;
  const agg = await db.packageActivation.aggregate({
    where: {
      userId: { in: directs.map((row) => row.id) },
      status: "ACTIVE",
    },
    _sum: { amount: true },
  });
  return asNumber(agg._sum.amount ?? 0);
}

export function dailyRatePctForTier(tier: BoosterTier, activeDirectVolume: number): number {
  const spec = boosters.tiers[tier];
  const sorted = [...spec.thresholds].sort((a, b) => b.minActiveDirectVolume - a.minActiveDirectVolume);
  for (const row of sorted) {
    if (activeDirectVolume >= row.minActiveDirectVolume) return row.dailyPct;
  }
  return boosters.regularDailyRatePct;
}

export async function resolveDailyRatePct(input: {
  userId: string;
  boosterTier: string;
  fundingSource: string;
  db?: DbClient;
}) {
  const tier = boosterTierBySlug(input.boosterTier);
  const volume = await getActiveDirectVolume(input.userId, input.db);
  if (input.fundingSource === "ADMIN" || input.fundingSource === "LOAN" || tier === "NONE") {
    return { tier, ratePct: boosters.regularDailyRatePct, activeDirectVolume: volume };
  }
  return { tier, ratePct: dailyRatePctForTier(tier, volume), activeDirectVolume: volume };
}
