import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Valence database with realistic Robinhood Chain assets & user data...");

  // Upsert primary user
  const user = await prisma.user.upsert({
    where: { walletAddress: "0x71C43939626A3b8A88a8f1B5D34559828e184e8B" },
    update: {},
    create: {
      id: "usr_alice_rhc",
      walletAddress: "0x71C43939626A3b8A88a8f1B5D34559828e184e8B",
      telegramChatId: "987654321",
    },
  });

  // Guardrail Config
  await prisma.guardrailConfig.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      maxHoldingWeightPct: 35.0,
      maxSlippageBps: 50,
      maxOraclePremiumBps: 100,
      minPoolLiquidityUsd: 250000.0,
    },
  });

  // Alert Settings
  await prisma.alertSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      telegramEnabled: true,
      inAppEnabled: true,
    },
  });

  // Goal: AI & Semiconductors
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      amountUsd: 50.0,
      frequency: "WEEKLY",
      theme: "$50/week into AI & semiconductors",
      active: true,
      nextExecutionAt: new Date(Date.now() + 2 * 86400000),
      baskets: {
        create: {
          rationale: JSON.stringify({
            summary: "Comprehensive exposure to the AI hardware supply chain and compute ecosystem.",
            theme: "AI & semiconductors",
          }),
          wasTrimmed: false,
          holdings: {
            create: [
              {
                ticker: "NVDA",
                weightPct: 30.0,
                rationale: "Dominant AI accelerator architecture & CUDA ecosystem moat.",
              },
              {
                ticker: "TSM",
                weightPct: 30.0,
                rationale: "Exclusive fabrication monopoly for advanced sub-3nm AI chips.",
              },
              {
                ticker: "AMD",
                weightPct: 20.0,
                rationale: "Datacenter AI accelerator challenger with MI300.",
              },
              {
                ticker: "MSFT",
                weightPct: 20.0,
                rationale: "Hyperscale AI deployment and Copilot monetization platform.",
              },
            ],
          },
        },
      },
    },
  });

  // Historical Trades
  const tradesData = [
    { ticker: "NVDA", amountUsd: 15.0, feeUsd: 0.075, action: "BUY" as const, txHash: "0x8f2a9e1d5c4e1b764a89d1239c091f84b6531c30e7629b3d0e917d541c8f12a3" },
    { ticker: "TSM", amountUsd: 15.0, feeUsd: 0.075, action: "BUY" as const, txHash: "0x3b1c7f90e8a245d6108e4531ac991b5c432098e7164b3c9902187fa541d8e94a" },
    { ticker: "AMD", amountUsd: 10.0, feeUsd: 0.050, action: "BUY" as const, txHash: "0x7a9e2f41b02167d4e5891ac320948e1b6540321c89012a45b78912e430f81c9a" },
    { ticker: "MSFT", amountUsd: 10.0, feeUsd: 0.050, action: "BUY" as const, txHash: "0x4e6d19a287b891c345a0928e19b8417c635209148b52109418e7c1048b291a0c" },
  ];

  for (const t of tradesData) {
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        goalId: goal.id,
        ticker: t.ticker,
        amountUsd: t.amountUsd,
        action: t.action,
        status: "CONFIRMED",
        txHash: t.txHash,
        executedAt: new Date(Date.now() - 7 * 86400000),
      },
    });

    await prisma.feeAccrual.create({
      data: {
        userId: user.id,
        tradeId: trade.id,
        feeUsd: t.feeUsd,
      },
    });
  }

  // Also seed one Guardrail-rejected trade to show deterministic rejection in Activity
  await prisma.trade.create({
    data: {
      userId: user.id,
      goalId: goal.id,
      ticker: "MEME_HIGH_SLIP",
      amountUsd: 25.0,
      action: "REJECTED",
      status: "FAILED",
      rejectionReason: "Liquidity Guardrail: Pool liquidity of $42,500 is below safe minimum of $250,000",
      executedAt: new Date(Date.now() - 15 * 86400000),
    },
  });

  console.log("Valence seed successfully completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
