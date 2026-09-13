import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { packages, referrals, withdrawal } from "../config/rewards";
import { addZonedMonths, eachTradingDay, parseDateKey, zonedDateKey, zonedIsoWeekKey } from "../lib/clock";

const prisma = new PrismaClient();

function noonUtc(daysAgo: number) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, 12, 0, 0));
  return date;
}

async function recomputeWallet(userId: string, type: "TRADING" | "NETWORK") {
  const entries = await prisma.ledgerEntry.findMany({
    where: { userId, walletType: type },
    select: { direction: true, amount: true },
  });
  const available = entries.reduce((sum, row) => {
    const amount = Number(row.amount.toString());
    return row.direction === "CREDIT" ? sum + amount : sum - amount;
  }, 0);
  await prisma.walletBalance.upsert({
    where: { userId_type: { userId, type } },
    update: { available: available.toFixed(4), pending: "0" },
    create: { userId, type, available: available.toFixed(4), pending: "0" },
  });
}

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

  const now = new Date();

  const admin = await prisma.user.upsert({
    where: { email: "admin@whealthgrid.com" },
    update: {
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "+15550000001",
      emailVerified: now,
      blocked: false,
    },
    create: {
      email: "admin@whealthgrid.com",
      name: "Desk Admin",
      phone: "+15550000001",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: now,
      referralCode: "WG-ADMIN1",
      walletAddress: "0x0000000000000000000000000000000000000001",
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@whealthgrid.com" },
    update: {
      passwordHash: demoHash,
      phone: "+15550000002",
      emailVerified: now,
    },
    create: {
      email: "demo@whealthgrid.com",
      name: "Aria Chen",
      phone: "+15550000002",
      passwordHash: demoHash,
      role: "USER",
      emailVerified: now,
      referralCode: "WG-DEMO01",
      walletAddress: "0x1111111111111111111111111111111111111111",
      createdAt: noonUtc(40),
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@whealthgrid.com" },
    update: {
      referredById: demo.id,
      phone: "+15550000003",
      emailVerified: now,
    },
    create: {
      email: "member@whealthgrid.com",
      name: "Leo Okonkwo",
      phone: "+15550000003",
      passwordHash: memberHash,
      role: "USER",
      emailVerified: now,
      referralCode: "WG-MEMB01",
      referredById: demo.id,
      createdAt: noonUtc(36),
    },
  });

  const extras = [
    { email: "nora@whealthgrid.com", name: "Nora Voss", phone: "+15550000004", code: "WG-NORA01", daysAgo: 28, amount: "150" },
    { email: "kenji@whealthgrid.com", name: "Kenji Sato", phone: "+15550000005", code: "WG-KENJ01", daysAgo: 22, amount: "100" },
    { email: "priya@whealthgrid.com", name: "Priya Raman", phone: "+15550000006", code: "WG-PRIY01", daysAgo: 18, amount: null },
    { email: "marc@whealthgrid.com", name: "Marc Duval", phone: "+15550000007", code: "WG-MARC01", daysAgo: 12, amount: null },
    { email: "blocked@whealthgrid.com", name: "Blocked Desk", phone: "+15550000008", code: "WG-BLCK01", daysAgo: 9, amount: null, blocked: true },
    { email: "sofia@whealthgrid.com", name: "Sofia Mendes", phone: "+15550000009", code: "WG-SOFI01", daysAgo: 5, amount: null },
  ] as const;

  const loanHash = await bcrypt.hash("Loan@12345", 12);
  const boosterHash = await bcrypt.hash("Booster@12345", 12);
  const recoveredHash = await bcrypt.hash("Recovered@12345", 12);

  const extraUsers: { id: string; email: string; name: string; amount: string | null }[] = [];
  for (const row of extras) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {
        passwordHash: demoHash,
        phone: row.phone,
        emailVerified: now,
        referredById: demo.id,
        blocked: "blocked" in row ? Boolean(row.blocked) : false,
      },
      create: {
        email: row.email,
        name: row.name,
        phone: row.phone,
        passwordHash: demoHash,
        role: "USER",
        emailVerified: now,
        referralCode: row.code,
        referredById: demo.id,
        blocked: "blocked" in row ? Boolean(row.blocked) : false,
        createdAt: noonUtc(row.daysAgo),
      },
    });
    extraUsers.push({ id: user.id, email: row.email, name: row.name, amount: row.amount });
  }

  async function ensureWallets(userId: string) {
    await prisma.walletBalance.upsert({
      where: { userId_type: { userId, type: "TRADING" } },
      update: {},
      create: { userId, type: "TRADING", available: 0, pending: 0 },
    });
    await prisma.walletBalance.upsert({
      where: { userId_type: { userId, type: "NETWORK" } },
      update: {},
      create: { userId, type: "NETWORK", available: 0, pending: 0 },
    });
  }

  await ensureWallets(admin.id);
  await ensureWallets(demo.id);
  await ensureWallets(member.id);
  for (const row of extraUsers) await ensureWallets(row.id);

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
      teamVolume: "500",
    },
    create: {
      userId: demo.id,
      currentRank: "elite-2",
      personalVolume: "500",
      teamVolume: "500",
    },
  });
  await prisma.rankProgress.upsert({
    where: { userId: member.id },
    update: { personalVolume: "200" },
    create: { userId: member.id, currentRank: "NONE", personalVolume: "200" },
  });

  async function ensureActivation(
    userId: string,
    amount: string,
    startedAt: Date,
    extra?: { fundingSource?: string; boosterTier?: string; flashLoanId?: string; roiStartsOn?: Date },
  ) {
    const existing = await prisma.packageActivation.findFirst({
      where: { userId, packageId: pro.id, amount, status: { in: ["ACTIVE", "COMPLETED"] } },
    });
    if (existing) return existing;
    return prisma.packageActivation.create({
      data: {
        userId,
        packageId: pro.id,
        amount,
        status: "ACTIVE",
        startedAt,
        fundingSource: extra?.fundingSource ?? "SELF",
        boosterTier: extra?.boosterTier ?? "NONE",
        flashLoanId: extra?.flashLoanId,
        roiStartsOn: extra?.roiStartsOn,
      },
    });
  }

  await ensureActivation(demo.id, "500", noonUtc(38));
  await ensureActivation(member.id, "200", noonUtc(34));
  for (const row of extraUsers) {
    if (row.amount) {
      await ensureActivation(row.id, row.amount, noonUtc(20));
      await prisma.rankProgress.upsert({
        where: { userId: row.id },
        update: { personalVolume: row.amount },
        create: { userId: row.id, currentRank: "NONE", personalVolume: row.amount },
      });
    } else {
      await prisma.rankProgress.upsert({
        where: { userId: row.id },
        update: {},
        create: { userId: row.id, currentRank: "NONE" },
      });
    }
  }

  const downlines = [member, ...extraUsers.map((row) => ({ id: row.id }))];
  for (const child of downlines) {
    await prisma.referral.upsert({
      where: { referrerId_refereeId: { referrerId: demo.id, refereeId: child.id } },
      update: {},
      create: { referrerId: demo.id, refereeId: child.id, level: 1 },
    });
  }

  const seriesExists = await prisma.rewardPayout.count({
    where: { periodKey: { startsWith: "DAILY:" } },
  });

  if (seriesExists === 0) {
    const opening: {
      userId: string;
      walletType: "TRADING" | "NETWORK";
      direction: "CREDIT" | "DEBIT";
      category: string;
      amount: string;
      balanceAfter: string;
      description: string;
      createdAt: Date;
    }[] = [
      {
        userId: demo.id,
        walletType: "TRADING" as const,
        direction: "CREDIT" as const,
        category: "DEPOSIT",
        amount: "1000",
        balanceAfter: "1000",
        description: "Seeded trading deposit (DEX placeholder approved)",
        createdAt: noonUtc(39),
      },
      {
        userId: demo.id,
        walletType: "TRADING" as const,
        direction: "DEBIT" as const,
        category: "PACKAGE",
        amount: "500",
        balanceAfter: "500",
        description: "Activated Pro package $500",
        createdAt: noonUtc(38),
      },
      {
        userId: member.id,
        walletType: "TRADING" as const,
        direction: "CREDIT" as const,
        category: "DEPOSIT",
        amount: "250",
        balanceAfter: "250",
        description: "Seeded trading deposit",
        createdAt: noonUtc(35),
      },
      {
        userId: member.id,
        walletType: "TRADING" as const,
        direction: "DEBIT" as const,
        category: "PACKAGE",
        amount: "200",
        balanceAfter: "50",
        description: "Activated Pro package $200",
        createdAt: noonUtc(34),
      },
    ];

    const nora = extraUsers.find((row) => row.email === "nora@whealthgrid.com");
    const kenji = extraUsers.find((row) => row.email === "kenji@whealthgrid.com");
    if (nora) {
      opening.push(
        {
          userId: nora.id,
          walletType: "TRADING",
          direction: "CREDIT",
          category: "DEPOSIT",
          amount: "200",
          balanceAfter: "200",
          description: "Seeded trading deposit",
          createdAt: noonUtc(21),
        },
        {
          userId: nora.id,
          walletType: "TRADING",
          direction: "DEBIT",
          category: "PACKAGE",
          amount: "150",
          balanceAfter: "50",
          description: "Activated Pro package $150",
          createdAt: noonUtc(20),
        },
      );
    }
    if (kenji) {
      opening.push(
        {
          userId: kenji.id,
          walletType: "TRADING",
          direction: "CREDIT",
          category: "DEPOSIT",
          amount: "160",
          balanceAfter: "160",
          description: "Seeded trading deposit",
          createdAt: noonUtc(21),
        },
        {
          userId: kenji.id,
          walletType: "TRADING",
          direction: "DEBIT",
          category: "PACKAGE",
          amount: "100",
          balanceAfter: "60",
          description: "Activated Pro package $100",
          createdAt: noonUtc(20),
        },
      );
    }

    const ledgerCount = await prisma.ledgerEntry.count({
      where: { userId: { in: [demo.id, member.id] }, category: "DEPOSIT" },
    });
    if (ledgerCount === 0) {
      await prisma.ledgerEntry.createMany({ data: opening });
    }

    const desks = [
      { userId: demo.id, principal: 500, start: noonUtc(37) },
      { userId: member.id, principal: 200, start: noonUtc(33) },
      ...(nora ? [{ userId: nora.id, principal: 150, start: noonUtc(19) }] : []),
      ...(kenji ? [{ userId: kenji.id, principal: 100, start: noonUtc(19) }] : []),
    ];

    const tradingDays = eachTradingDay(noonUtc(37), noonUtc(1));
    const payouts: {
      userId: string;
      type: string;
      amount: string;
      status: string;
      note: string;
      periodKey: string;
      createdAt: Date;
    }[] = [];
    const ledger: {
      userId: string;
      walletType: "TRADING" | "NETWORK";
      direction: "CREDIT";
      category: string;
      amount: string;
      balanceAfter: string;
      description: string;
      createdAt: Date;
    }[] = [];

    const running: Record<string, { trading: number; network: number }> = {};
    const bump = (userId: string, wallet: "TRADING" | "NETWORK", amount: number) => {
      running[userId] ??= { trading: 0, network: 0 };
      if (wallet === "TRADING") running[userId].trading += amount;
      else running[userId].network += amount;
      return wallet === "TRADING" ? running[userId].trading : running[userId].network;
    };

    const demoDirects = [
      { userId: member.id, name: "Leo Okonkwo", amount: 200, when: noonUtc(34) },
      ...(nora ? [{ userId: nora.id, name: "Nora Voss", amount: 150, when: noonUtc(20) }] : []),
      ...(kenji ? [{ userId: kenji.id, name: "Kenji Sato", amount: 100, when: noonUtc(20) }] : []),
    ];
    for (const row of demoDirects) {
      const bonus = Number(((row.amount * referrals.directPct) / 100).toFixed(4));
      const periodKey = `DIRECT:seed:${row.userId}`;
      payouts.push({
        userId: demo.id,
        type: "DIRECT",
        amount: bonus.toFixed(4),
        status: "PAID",
        note: `${referrals.directPct}% direct on ${row.name} activation → Network wallet`,
        periodKey,
        createdAt: row.when,
      });
      ledger.push({
        userId: demo.id,
        walletType: "NETWORK",
        direction: "CREDIT",
        category: "REFERRAL",
        amount: bonus.toFixed(4),
        balanceAfter: bump(demo.id, "NETWORK", bonus).toFixed(4),
        description: `${referrals.directPct}% direct on ${row.name} activation → Network wallet`,
        createdAt: row.when,
      });
    }

    for (const day of tradingDays) {
      const dateKey = zonedDateKey(day);
      for (const desk of desks) {
        if (day.getTime() < desk.start.getTime()) continue;
        const daily = Number(((desk.principal * proCfg.dailyRatePct) / 100).toFixed(4));
        payouts.push({
          userId: desk.userId,
          type: "DAILY",
          amount: daily.toFixed(4),
          status: "PAID",
          note: `Daily trading ROI ${proCfg.dailyRatePct}% of ${desk.principal.toFixed(2)} → Trading wallet`,
          periodKey: `DAILY:${dateKey}`,
          createdAt: day,
        });
        ledger.push({
          userId: desk.userId,
          walletType: "TRADING",
          direction: "CREDIT",
          category: "REWARD",
          amount: daily.toFixed(4),
          balanceAfter: bump(desk.userId, "TRADING", daily).toFixed(4),
          description: `Daily trading ROI ${proCfg.dailyRatePct}% of ${desk.principal.toFixed(2)} → Trading wallet`,
          createdAt: day,
        });

        if (desk.userId !== demo.id) {
          const team = Number(((daily * referrals.teamTradingPct[0]) / 100).toFixed(4));
          payouts.push({
            userId: demo.id,
            type: "TEAM",
            amount: team.toFixed(4),
            status: "PAID",
            note: `L1 team trading ${referrals.teamTradingPct[0]}% of daily credit`,
            periodKey: `TEAM:${dateKey}:${desk.userId}:L1`,
            createdAt: day,
          });
          ledger.push({
            userId: demo.id,
            walletType: "NETWORK",
            direction: "CREDIT",
            category: "REFERRAL",
            amount: team.toFixed(4),
            balanceAfter: bump(demo.id, "NETWORK", team).toFixed(4),
            description: `L1 team trading ${referrals.teamTradingPct[0]}% of daily credit`,
            createdAt: day,
          });
        }
      }
    }

    const weeks = new Set<string>();
    for (const day of tradingDays) {
      const week = zonedIsoWeekKey(day);
      if (weeks.has(week)) continue;
      weeks.add(week);
      for (const desk of desks) {
        const amount = Number(((desk.principal * 0.2) / 100).toFixed(4));
        payouts.push({
          userId: desk.userId,
          type: "LOYALTY",
          amount: amount.toFixed(4),
          status: "PAID",
          note: "Weekly loyalty 0.2% of active principal (Network wallet)",
          periodKey: `LOYALTY:${week}`,
          createdAt: day,
        });
        ledger.push({
          userId: desk.userId,
          walletType: "NETWORK",
          direction: "CREDIT",
          category: "REWARD",
          amount: amount.toFixed(4),
          balanceAfter: bump(desk.userId, "NETWORK", amount).toFixed(4),
          description: "Weekly loyalty 0.2% of active principal (Network wallet)",
          createdAt: day,
        });
      }
    }

    payouts.push({
      userId: demo.id,
      type: "RANK",
      amount: "15.0000",
      status: "PAID",
      note: "Elite 2 rank recognition → Network wallet",
      periodKey: "RANK:elite-2",
      createdAt: noonUtc(10),
    });
    ledger.push({
      userId: demo.id,
      walletType: "NETWORK",
      direction: "CREDIT",
      category: "REWARD",
      amount: "15.0000",
      balanceAfter: bump(demo.id, "NETWORK", 15).toFixed(4),
      description: "Elite 2 rank recognition → Network wallet",
      createdAt: noonUtc(10),
    });

    await prisma.rewardPayout.createMany({ data: payouts });
    await prisma.ledgerEntry.createMany({ data: ledger });

    const seedGross = 80;
    const seedFee = Number(((seedGross * withdrawal.feePct) / 100).toFixed(2));
    const seedNet = Number((seedGross - seedFee).toFixed(2));

    if ((await prisma.ledgerEntry.count({ where: { userId: demo.id, category: "WITHDRAWAL" } })) === 0) {
      await prisma.ledgerEntry.create({
        data: {
          userId: demo.id,
          walletType: "TRADING",
          direction: "DEBIT",
          category: "WITHDRAWAL",
          amount: String(seedGross),
          balanceAfter: "0",
          description: "Withdrawal auto-approved — treasury payout (seed)",
          createdAt: noonUtc(6),
        },
      });
    }

    const existingWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: { userId: demo.id },
      orderBy: { createdAt: "asc" },
    });
    let seedWithdrawalId = existingWithdrawal?.id;
    if (!existingWithdrawal) {
      const created = await prisma.withdrawalRequest.create({
        data: {
          userId: demo.id,
          amount: String(seedGross),
          feeAmount: String(seedFee),
          netAmount: String(seedNet),
          walletType: "TRADING",
          toAddress: "0x1111111111111111111111111111111111111111",
          status: "APPROVED",
          reviewedAt: noonUtc(6),
          createdAt: noonUtc(6),
          note: "Seeded auto-approved payout from company treasury",
        },
      });
      seedWithdrawalId = created.id;
    }

    const moreWithdrawals = [
      { userId: member.id, amount: 40, daysAgo: 14, wallet: "TRADING" },
      { userId: demo.id, amount: 25, daysAgo: 3, wallet: "NETWORK" },
    ];
    for (const row of moreWithdrawals) {
      const exists = await prisma.withdrawalRequest.findFirst({
        where: { userId: row.userId, amount: String(row.amount), createdAt: noonUtc(row.daysAgo) },
      });
      if (exists) continue;
      const fee = Number(((row.amount * withdrawal.feePct) / 100).toFixed(2));
      await prisma.withdrawalRequest.create({
        data: {
          userId: row.userId,
          amount: String(row.amount),
          feeAmount: String(fee),
          netAmount: String(row.amount - fee),
          walletType: row.wallet,
          status: "CONFIRMED",
          createdAt: noonUtc(row.daysAgo),
          reviewedAt: noonUtc(row.daysAgo),
          note: "Seeded volume sample",
        },
      });
      await prisma.ledgerEntry.create({
        data: {
          userId: row.userId,
          walletType: row.wallet,
          direction: "DEBIT",
          category: "WITHDRAWAL",
          amount: String(row.amount),
          balanceAfter: "0",
          description: "Seeded withdrawal for analytics volume",
          createdAt: noonUtc(row.daysAgo),
        },
      });
    }

    const depositDays = [32, 27, 21, 16, 11, 7, 2];
    for (const daysAgo of depositDays) {
      const exists = await prisma.depositIntent.findFirst({
        where: { userId: demo.id, createdAt: noonUtc(daysAgo), status: "APPROVED" },
      });
      if (exists) continue;
      await prisma.depositIntent.create({
        data: {
          userId: demo.id,
          amount: String(80 + daysAgo),
          walletType: "TRADING",
          status: "APPROVED",
          createdAt: noonUtc(daysAgo),
          reviewedAt: noonUtc(daysAgo),
          note: "Seeded approved deposit for analytics",
        },
      });
    }

    if ((await prisma.depositIntent.count({ where: { status: "PENDING" } })) === 0) {
      await prisma.depositIntent.create({
        data: {
          userId: demo.id,
          amount: "250",
          walletType: "TRADING",
          status: "PENDING",
          note: "Awaiting USDT send to company wallet",
          fromAddress: "0x1111111111111111111111111111111111111111",
        },
      });
    }

    const treasury = await prisma.treasury.upsert({
      where: { id: "company" },
      update: {},
      create: { id: "company", balance: "0" },
    });

    if ((await prisma.treasuryMovement.count()) === 0) {
      const openingPool = 10000;
      const afterPayout = Number((openingPool - seedNet).toFixed(2));
      await prisma.treasury.update({
        where: { id: "company" },
        data: { balance: String(afterPayout) },
      });
      await prisma.treasuryMovement.createMany({
        data: [
          {
            treasuryId: "company",
            direction: "CREDIT",
            category: "TOPUP",
            amount: String(openingPool),
            balanceAfter: String(openingPool),
            description: "Seeded company payout pool",
            actorId: admin.id,
            createdAt: noonUtc(40),
          },
          {
            treasuryId: "company",
            direction: "DEBIT",
            category: "PAYOUT",
            amount: String(seedNet),
            balanceAfter: String(afterPayout),
            description: "Seeded demo withdrawal payout",
            refId: seedWithdrawalId,
            actorId: admin.id,
            createdAt: noonUtc(6),
          },
          {
            treasuryId: "company",
            direction: "CREDIT",
            category: "TOPUP",
            amount: "2500",
            balanceAfter: String(afterPayout + 2500),
            description: "Mid-cycle treasury top-up",
            actorId: admin.id,
            createdAt: noonUtc(18),
          },
          {
            treasuryId: "company",
            direction: "DEBIT",
            category: "PAYOUT",
            amount: "38",
            balanceAfter: String(afterPayout + 2500 - 38),
            description: "Seeded member withdrawal payout",
            actorId: admin.id,
            createdAt: noonUtc(14),
          },
        ],
      });
      await prisma.treasury.update({
        where: { id: "company" },
        data: { balance: String(afterPayout + 2500 - 38) },
      });
    } else if (Number(treasury.balance.toString()) === 0) {
      await prisma.treasury.update({
        where: { id: "company" },
        data: { balance: "10000" },
      });
    }

    if ((await prisma.supportTicket.count()) === 0) {
      await prisma.supportTicket.create({
        data: {
          userId: demo.id,
          subject: "Welcome desk check",
          status: "OPEN",
          messages: {
            create: {
              authorId: demo.id,
              body: "Seeded ticket — confirm deposits auto-credit after chain confirmations.",
            },
          },
        },
      });
    }

    if ((await prisma.announcement.count()) === 0) {
      await prisma.announcement.create({
        data: {
          title: "Trading credits are Mon–Fri only",
          body: "Daily trading ROI now books to the Trading wallet Monday–Friday in Asia/Dubai time, capped at 2× package principal. Network rewards (direct, team, loyalty, ranks) book to the Network wallet 24/7, capped at 3×.",
          published: true,
          authorId: admin.id,
        },
      });
    }
  }

  const loanUser = await prisma.user.upsert({
    where: { email: "loan@whealthgrid.com" },
    update: {
      passwordHash: loanHash,
      phone: "+15550000010",
      emailVerified: now,
      referredById: demo.id,
    },
    create: {
      email: "loan@whealthgrid.com",
      name: "Lina Kovacs",
      phone: "+15550000010",
      passwordHash: loanHash,
      role: "USER",
      emailVerified: now,
      referralCode: "WG-LOAN01",
      referredById: demo.id,
      createdAt: noonUtc(16),
    },
  });

  const boosterUser = await prisma.user.upsert({
    where: { email: "booster@whealthgrid.com" },
    update: {
      passwordHash: boosterHash,
      phone: "+15550000011",
      emailVerified: now,
    },
    create: {
      email: "booster@whealthgrid.com",
      name: "Hassan Al-Farsi",
      phone: "+15550000011",
      passwordHash: boosterHash,
      role: "USER",
      emailVerified: now,
      referralCode: "WG-BOOST1",
      createdAt: noonUtc(14),
    },
  });

  const recoveredUser = await prisma.user.upsert({
    where: { email: "recovered@whealthgrid.com" },
    update: {
      passwordHash: recoveredHash,
      phone: "+15550000012",
      emailVerified: now,
    },
    create: {
      email: "recovered@whealthgrid.com",
      name: "Mira Solberg",
      phone: "+15550000012",
      passwordHash: recoveredHash,
      role: "USER",
      emailVerified: now,
      referralCode: "WG-RECV01",
      createdAt: noonUtc(80),
    },
  });

  const whales = [
    { email: "whale1@whealthgrid.com", name: "Whale Desk One", phone: "+15550000013", code: "WG-WHL01", amount: "30000" },
    { email: "whale2@whealthgrid.com", name: "Whale Desk Two", phone: "+15550000014", code: "WG-WHL02", amount: "25000" },
  ] as const;
  const whaleUsers: { id: string; amount: string }[] = [];
  for (const row of whales) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {
        passwordHash: demoHash,
        phone: row.phone,
        emailVerified: now,
        referredById: boosterUser.id,
      },
      create: {
        email: row.email,
        name: row.name,
        phone: row.phone,
        passwordHash: demoHash,
        role: "USER",
        emailVerified: now,
        referralCode: row.code,
        referredById: boosterUser.id,
        createdAt: noonUtc(10),
      },
    });
    whaleUsers.push({ id: user.id, amount: row.amount });
  }

  const scenarioUsers = [loanUser, boosterUser, recoveredUser, ...whaleUsers.map((row) => ({ id: row.id }))];
  for (const row of scenarioUsers) await ensureWallets(row.id);

  await prisma.referral.upsert({
    where: { referrerId_refereeId: { referrerId: demo.id, refereeId: loanUser.id } },
    update: {},
    create: { referrerId: demo.id, refereeId: loanUser.id, level: 1 },
  });
  for (const whale of whaleUsers) {
    await prisma.referral.upsert({
      where: { referrerId_refereeId: { referrerId: boosterUser.id, refereeId: whale.id } },
      update: {},
      create: { referrerId: boosterUser.id, refereeId: whale.id, level: 1 },
    });
  }

  if ((await prisma.flashLoanApplication.count({ where: { userId: member.id, status: "PENDING" } })) === 0) {
    await prisma.flashLoanApplication.create({
      data: {
        userId: member.id,
        requested: "800",
        status: "PENDING",
        note: "Seeded pending application for admin review",
        createdAt: noonUtc(1),
      },
    });
  }

  if ((await prisma.flashLoan.count({ where: { userId: loanUser.id } })) === 0) {
    const application = await prisma.flashLoanApplication.create({
      data: {
        userId: loanUser.id,
        requested: "500",
        status: "APPROVED",
        note: "Seeded outstanding flash loan",
        createdAt: noonUtc(12),
        reviewedAt: noonUtc(11),
        reviewedBy: admin.id,
      },
    });
    const loan = await prisma.flashLoan.create({
      data: {
        userId: loanUser.id,
        applicationId: application.id,
        requested: "500",
        approved: "500",
        principal: "500",
        repaid: "150",
        status: "OUTSTANDING",
        approvedAt: noonUtc(11),
      },
    });
    await ensureActivation(loanUser.id, "500", noonUtc(10), {
      fundingSource: "LOAN",
      boosterTier: "NONE",
      flashLoanId: loan.id,
    });
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: loanUser.id,
          walletType: "NETWORK",
          direction: "DEBIT",
          category: "LOAN",
          amount: "500",
          balanceAfter: "-500",
          description: "Flash loan liability 500.00 — Network vault",
          refId: loan.id,
          createdAt: noonUtc(11),
        },
        {
          userId: loanUser.id,
          walletType: "NETWORK",
          direction: "CREDIT",
          category: "REFERRAL",
          amount: "150",
          balanceAfter: "-350",
          description: "Seeded network credit applied to flash-loan recovery",
          createdAt: noonUtc(4),
        },
      ],
    });
    await prisma.rankProgress.upsert({
      where: { userId: loanUser.id },
      update: { personalVolume: "500" },
      create: { userId: loanUser.id, currentRank: "NONE", personalVolume: "500" },
    });
  }

  if ((await prisma.flashLoan.count({ where: { userId: recoveredUser.id } })) === 0) {
    const recoveredAt = noonUtc(20);
    const application = await prisma.flashLoanApplication.create({
      data: {
        userId: recoveredUser.id,
        requested: "400",
        status: "APPROVED",
        note: "Seeded recovered flash loan",
        createdAt: noonUtc(70),
        reviewedAt: noonUtc(69),
        reviewedBy: admin.id,
      },
    });
    const loan = await prisma.flashLoan.create({
      data: {
        userId: recoveredUser.id,
        applicationId: application.id,
        requested: "400",
        approved: "400",
        principal: "400",
        repaid: "400",
        status: "RECOVERED",
        approvedAt: noonUtc(69),
        recoveredAt,
        coolingUntil: addZonedMonths(recoveredAt, 2),
      },
    });
    await ensureActivation(recoveredUser.id, "400", noonUtc(68), {
      fundingSource: "LOAN",
      boosterTier: "NONE",
      flashLoanId: loan.id,
      roiStartsOn: noonUtc(19),
    });
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: recoveredUser.id,
          walletType: "NETWORK",
          direction: "DEBIT",
          category: "LOAN",
          amount: "400",
          balanceAfter: "-400",
          description: "Flash loan liability 400.00 — Network vault",
          createdAt: noonUtc(69),
        },
        {
          userId: recoveredUser.id,
          walletType: "NETWORK",
          direction: "CREDIT",
          category: "REFERRAL",
          amount: "400",
          balanceAfter: "0",
          description: "Seeded full flash-loan recovery",
          createdAt: recoveredAt,
        },
      ],
    });
    await prisma.rankProgress.upsert({
      where: { userId: recoveredUser.id },
      update: { personalVolume: "400" },
      create: { userId: recoveredUser.id, currentRank: "NONE", personalVolume: "400" },
    });
  }

  await ensureActivation(boosterUser.id, "200", noonUtc(9), { fundingSource: "SELF", boosterTier: "ULTRA" });
  if ((await prisma.ledgerEntry.count({ where: { userId: boosterUser.id, category: "PACKAGE" } })) === 0) {
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: boosterUser.id,
          walletType: "TRADING",
          direction: "CREDIT",
          category: "DEPOSIT",
          amount: "300",
          balanceAfter: "300",
          description: "Seeded trading deposit for Ultra booster",
          createdAt: noonUtc(10),
        },
        {
          userId: boosterUser.id,
          walletType: "TRADING",
          direction: "DEBIT",
          category: "PACKAGE",
          amount: "200",
          balanceAfter: "100",
          description: "Activated Pro package $200 (ULTRA)",
          createdAt: noonUtc(9),
        },
      ],
    });
  }
  await prisma.rankProgress.upsert({
    where: { userId: boosterUser.id },
    update: { personalVolume: "200" },
    create: { userId: boosterUser.id, currentRank: "NONE", personalVolume: "200" },
  });

  for (const whale of whaleUsers) {
    await ensureActivation(whale.id, whale.amount, noonUtc(8), { fundingSource: "ADMIN", boosterTier: "NONE" });
    await prisma.rankProgress.upsert({
      where: { userId: whale.id },
      update: { personalVolume: whale.amount },
      create: { userId: whale.id, currentRank: "NONE", personalVolume: whale.amount },
    });
  }

  if ((await prisma.packageActivation.count({ where: { userId: demo.id, fundingSource: "ADMIN" } })) === 0) {
    await ensureActivation(demo.id, "150", noonUtc(3), { fundingSource: "ADMIN", boosterTier: "NONE" });
  }

  for (const userId of [
    demo.id,
    member.id,
    loanUser.id,
    boosterUser.id,
    recoveredUser.id,
    ...extraUsers.map((row) => row.id),
    ...whaleUsers.map((row) => row.id),
  ]) {
    await recomputeWallet(userId, "TRADING");
    await recomputeWallet(userId, "NETWORK");
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED",
      entity: "SYSTEM",
      meta: JSON.stringify({
        message: "Analytics + flash loan + booster seed applied",
        date: parseDateKey(zonedDateKey(now)).toISOString(),
      }),
    },
  });

  console.log("Seeded Whealth Grid Fx AI:");
  console.log("  admin@whealthgrid.com / Admin@12345");
  console.log("  demo@whealthgrid.com  / Demo@12345");
  console.log("  member@whealthgrid.com / Member@12345 (bonus demo downline)");
  console.log("  loan@whealthgrid.com / Loan@12345 (outstanding flash loan, Network −$350)");
  console.log("  booster@whealthgrid.com / Booster@12345 (Ultra + $55k active directs)");
  console.log("  recovered@whealthgrid.com / Recovered@12345 (cooling period after recovery)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
