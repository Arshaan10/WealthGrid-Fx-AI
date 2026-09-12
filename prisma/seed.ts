import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { packages } from "../config/rewards";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const demoHash = await bcrypt.hash("Demo@12345", 12);
  const memberHash = await bcrypt.hash("Member@12345", 12);

  const proCfg = packages[0];

  const pro = await prisma.package.upsert({
    where: { slug: proCfg.slug },
    update: {
      name: proCfg.name,
      minAmount: proCfg.minAmountUsd,
      dailyRate: proCfg.dailyRatePct,
      maxReturn: proCfg.maxReturnPct,
      networkCap: proCfg.networkCapPct,
      active: true,
    },
    create: {
      slug: proCfg.slug,
      name: proCfg.name,
      minAmount: proCfg.minAmountUsd,
      dailyRate: proCfg.dailyRatePct,
      maxReturn: proCfg.maxReturnPct,
      networkCap: proCfg.networkCapPct,
      active: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@whealthgrid.com" },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: {
      email: "admin@whealthgrid.com",
      name: "Desk Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      referralCode: "WG-ADMIN1",
      walletAddress: "0xADMIN0000000000000000000000000000000001",
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@whealthgrid.com" },
    update: { passwordHash: demoHash },
    create: {
      email: "demo@whealthgrid.com",
      name: "Aria Chen",
      passwordHash: demoHash,
      role: "USER",
      referralCode: "WG-DEMO01",
      walletAddress: "0xDEMO00000000000000000000000000000000001",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@whealthgrid.com" },
    update: { referredById: demo.id },
    create: {
      email: "member@whealthgrid.com",
      name: "Leo Okonkwo",
      passwordHash: memberHash,
      role: "USER",
      referralCode: "WG-MEMB01",
      referredById: demo.id,
    },
  });

  async function ensureWallets(
    userId: string,
    trading: { available: string; pending: string },
    network: { available: string; pending: string },
  ) {
    await prisma.walletBalance.upsert({
      where: { userId_type: { userId, type: "TRADING" } },
      update: trading,
      create: { userId, type: "TRADING", ...trading },
    });
    await prisma.walletBalance.upsert({
      where: { userId_type: { userId, type: "NETWORK" } },
      update: network,
      create: { userId, type: "NETWORK", ...network },
    });
  }

  await ensureWallets(admin.id, { available: "0", pending: "0" }, { available: "0", pending: "0" });
  await ensureWallets(
    demo.id,
    { available: "420.00", pending: "80.00" },
    { available: "63.50", pending: "0" },
  );
  await ensureWallets(
    member.id,
    { available: "50.00", pending: "0" },
    { available: "0", pending: "0" },
  );

  await prisma.rankProgress.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, currentRank: "NONE" },
  });
  await prisma.rankProgress.upsert({
    where: { userId: demo.id },
    update: {
      currentRank: "elite-2",
      personalVolume: "500",
      teamVolume: "50",
    },
    create: {
      userId: demo.id,
      currentRank: "elite-2",
      personalVolume: "500",
      teamVolume: "50",
    },
  });
  await prisma.rankProgress.upsert({
    where: { userId: member.id },
    update: {},
    create: { userId: member.id, currentRank: "NONE", personalVolume: "50" },
  });

  const existingActivation = await prisma.packageActivation.findFirst({
    where: { userId: demo.id, packageId: pro.id, status: "ACTIVE" },
  });
  if (!existingActivation) {
    await prisma.packageActivation.create({
      data: {
        userId: demo.id,
        packageId: pro.id,
        amount: "500",
        status: "ACTIVE",
      },
    });
  }

  await prisma.referral.upsert({
    where: { referrerId_refereeId: { referrerId: demo.id, refereeId: member.id } },
    update: {},
    create: { referrerId: demo.id, refereeId: member.id, level: 1 },
  });

  const ledgerCount = await prisma.ledgerEntry.count({ where: { userId: demo.id } });
  if (ledgerCount === 0) {
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: demo.id,
          walletType: "TRADING",
          direction: "CREDIT",
          category: "DEPOSIT",
          amount: "1000",
          balanceAfter: "1000",
          description: "Seeded trading deposit (DEX placeholder approved)",
        },
        {
          userId: demo.id,
          walletType: "TRADING",
          direction: "DEBIT",
          category: "PACKAGE",
          amount: "500",
          balanceAfter: "500",
          description: "Activated Pro package $500",
        },
        {
          userId: demo.id,
          walletType: "NETWORK",
          direction: "CREDIT",
          category: "REFERRAL",
          amount: "3.50",
          balanceAfter: "3.50",
          description: "Direct referral 7% on Leo Okonkwo $50 activation",
        },
        {
          userId: demo.id,
          walletType: "TRADING",
          direction: "CREDIT",
          category: "REWARD",
          amount: "2.50",
          balanceAfter: "502.50",
          description: "Illustrative daily trading credit (seed)",
        },
        {
          userId: demo.id,
          walletType: "TRADING",
          direction: "DEBIT",
          category: "WITHDRAWAL",
          amount: "80",
          balanceAfter: "420.00",
          description: "Withdrawal reserved — pending DEX settlement",
        },
      ],
    });
  }

  if ((await prisma.rewardPayout.count({ where: { userId: demo.id } })) === 0) {
    await prisma.rewardPayout.createMany({
      data: [
        {
          userId: demo.id,
          type: "DAILY",
          amount: "2.50",
          status: "PAID",
          note: "Illustrative daily credit against $500 Pro",
        },
        {
          userId: demo.id,
          type: "DIRECT",
          amount: "3.50",
          status: "PAID",
          note: "7% direct on referred Pro activation",
        },
        {
          userId: demo.id,
          type: "LOYALTY",
          amount: "5.00",
          status: "PENDING",
          note: "Weekly loyalty window (not yet released)",
        },
      ],
    });
  }

  if ((await prisma.depositIntent.count()) === 0) {
    await prisma.depositIntent.create({
      data: {
        userId: demo.id,
        amount: "250",
        walletType: "TRADING",
        status: "PENDING",
        note: "Awaiting DEX connect (Phase 1 placeholder)",
      },
    });
  }

  if ((await prisma.withdrawalRequest.count()) === 0) {
    await prisma.withdrawalRequest.create({
      data: {
        userId: demo.id,
        amount: "80",
        walletType: "TRADING",
        toAddress: "0xDEMO00000000000000000000000000000000001",
        status: "PENDING",
        note: "Reserved on trading wallet — DEX payout later",
      },
    });
  }

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({
      data: {
        title: "Phase 1 desk is live",
        body: "Welcome to Whealth Grid Fx AI. Package activation, wallets, and the admin queue are online. DEX wallet connect arrives in the next phase — deposit and withdraw intents are recorded only.",
        published: true,
        authorId: admin.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED",
      entity: "SYSTEM",
      meta: JSON.stringify({ message: "Phase 1 seed applied" }),
    },
  });

  console.log("Seeded Whealth Grid Fx AI:");
  console.log("  admin@whealthgrid.com / Admin@12345");
  console.log("  demo@whealthgrid.com  / Demo@12345");
  console.log("  member@whealthgrid.com / Member@12345 (bonus demo downline)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
