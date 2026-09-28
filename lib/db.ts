import { PrismaClient } from "@prisma/client";

// Global singleton for PrismaClient in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export interface MockUser {
  id: string;
  walletAddress: string;
  telegramChatId?: string;
  createdAt: string;
}

export interface MockGuardrailConfig {
  id: string;
  userId: string;
  maxHoldingWeightPct: number;
  maxSlippageBps: number;
  maxOraclePremiumBps: number;
  minPoolLiquidityUsd: number;
}

export interface MockBasketHolding {
  id: string;
  ticker: string;
  name: string;
  weightPct: number;
  rationale: string;
  priceUsd: number;
  change24hPct: number;
  poolLiquidityUsd: number;
}

export interface MockGoal {
  id: string;
  userId: string;
  amountUsd: number;
  frequency: "WEEKLY" | "MONTHLY";
  theme: string;
  active: boolean;
  nextExecutionAt: string;
  createdAt: string;
  basket: {
    id: string;
    generatedAt: string;
    rationale: string;
    wasTrimmed: boolean;
    holdings: MockBasketHolding[];
  };
}

export interface MockTrade {
  id: string;
  userId: string;
  goalId: string;
  ticker: string;
  action: "BUY" | "SELL" | "REBALANCE" | "REJECTED";
  amountUsd: number;
  txHash?: string;
  status: "CONFIRMED" | "FAILED" | "PENDING";
  rejectionReason?: string;
  executedAt: string;
  feeUsd: number;
}

export interface MockPortfolioHistoryPoint {
  date: string;
  value: number;
  invested: number;
}

// In-Memory Seed State that hydrates Phase 1 & 2 instantly
const initialMockDatabase = {
  user: {
    id: "usr_alice_rhc",
    walletAddress: "0x71C43939626A3b8A88a8f1B5D34559828e184e8B",
    telegramChatId: "987654321",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  } as MockUser,

  guardrailConfig: {
    id: "grc_default_alice",
    userId: "usr_alice_rhc",
    maxHoldingWeightPct: 35.0,
    maxSlippageBps: 50,
    maxOraclePremiumBps: 100,
    minPoolLiquidityUsd: 250000.0,
  } as MockGuardrailConfig,

  alertSetting: {
    id: "alt_default_alice",
    userId: "usr_alice_rhc",
    telegramEnabled: true,
    inAppEnabled: true,
  },

  goals: [
    {
      id: "goal_ai_semis",
      userId: "usr_alice_rhc",
      amountUsd: 50.0,
      frequency: "WEEKLY",
      theme: "$50/week into AI & semiconductors",
      active: true,
      nextExecutionAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      basket: {
        id: "bsk_ai_v1",
        generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        rationale:
          "Targeted allocation across the full AI compute stack: foundational GPU silicon, foundry manufacturing, challenger architectures, and hyperscale deployment infrastructure.",
        wasTrimmed: false,
        holdings: [
          {
            id: "hld_nvda",
            ticker: "NVDA",
            name: "NVIDIA Corp (Tokenized)",
            weightPct: 30.0,
            rationale: "Dominant AI accelerator architecture & CUDA software ecosystem moat.",
            priceUsd: 134.8,
            change24hPct: 3.4,
            poolLiquidityUsd: 18500000,
          },
          {
            id: "hld_tsm",
            ticker: "TSM",
            name: "Taiwan Semiconductor (Tokenized)",
            weightPct: 30.0,
            rationale: "Exclusive fabrication monopoly for sub-3nm advanced packaging & leading node AI chips.",
            priceUsd: 182.4,
            change24hPct: 2.1,
            poolLiquidityUsd: 12400000,
          },
          {
            id: "hld_amd",
            ticker: "AMD",
            name: "Advanced Micro Devices (Tokenized)",
            weightPct: 20.0,
            rationale: "Primary challenger in AI accelerators with MI300 series datacenter traction.",
            priceUsd: 156.2,
            change24hPct: -0.8,
            poolLiquidityUsd: 8700000,
          },
          {
            id: "hld_msft",
            ticker: "MSFT",
            name: "Microsoft Corp (Tokenized)",
            weightPct: 20.0,
            rationale: "Hyperscaler monetization engine via Azure AI infrastructure and enterprise Copilot.",
            priceUsd: 432.5,
            change24hPct: 1.2,
            poolLiquidityUsd: 22000000,
          },
        ],
      },
    },
  ] as MockGoal[],

  trades: [
    {
      id: "trd_101",
      userId: "usr_alice_rhc",
      goalId: "goal_ai_semis",
      ticker: "NVDA",
      action: "BUY",
      amountUsd: 15.0,
      txHash: "0x8f2a9e1d5c4e1b764a89d1239c091f84b6531c30e7629b3d0e917d541c8f12a3",
      status: "CONFIRMED",
      executedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      feeUsd: 0.075,
    },
    {
      id: "trd_102",
      userId: "usr_alice_rhc",
      goalId: "goal_ai_semis",
      ticker: "TSM",
      action: "BUY",
      amountUsd: 15.0,
      txHash: "0x3b1c7f90e8a245d6108e4531ac991b5c432098e7164b3c9902187fa541d8e94a",
      status: "CONFIRMED",
      executedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      feeUsd: 0.075,
    },
    {
      id: "trd_103",
      userId: "usr_alice_rhc",
      goalId: "goal_ai_semis",
      ticker: "AMD",
      action: "BUY",
      amountUsd: 10.0,
      txHash: "0x7a9e2f41b02167d4e5891ac320948e1b6540321c89012a45b78912e430f81c9a",
      status: "CONFIRMED",
      executedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      feeUsd: 0.05,
    },
    {
      id: "trd_104",
      userId: "usr_alice_rhc",
      goalId: "goal_ai_semis",
      ticker: "MSFT",
      action: "BUY",
      amountUsd: 10.0,
      txHash: "0x4e6d19a287b891c345a0928e19b8417c635209148b52109418e7c1048b291a0c",
      status: "CONFIRMED",
      executedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      feeUsd: 0.05,
    },
    {
      id: "trd_105",
      userId: "usr_alice_rhc",
      goalId: "goal_ai_semis",
      ticker: "NVDA",
      action: "BUY",
      amountUsd: 15.0,
      txHash: "0x12a9e87b6c543210fe9876a543210dcba9876543210fe9876a543210dcba9876",
      status: "CONFIRMED",
      executedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      feeUsd: 0.075,
    },
    {
      id: "trd_106",
      userId: "usr_alice_rhc",
      goalId: "goal_ai_semis",
      ticker: "ILLIQUID_MOCK",
      action: "REJECTED",
      amountUsd: 25.0,
      status: "FAILED",
      rejectionReason:
        "Liquidity Guardrail: Pool liquidity of $42,500 is below safe minimum of $250,000",
      executedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      feeUsd: 0.0,
    },
  ] as MockTrade[],

  portfolioHistory: [
    { date: "Day 1", value: 1250, invested: 1250 },
    { date: "Day 5", value: 1380, invested: 1350 },
    { date: "Day 10", value: 1540, invested: 1450 },
    { date: "Day 15", value: 1720, invested: 1550 },
    { date: "Day 20", value: 1980, invested: 1650 },
    { date: "Day 25", value: 2210, invested: 1750 },
    { date: "Today", value: 2480, invested: 1850 },
  ] as MockPortfolioHistoryPoint[],
};

// Global persistent in-memory database store across Next.js API routes
const globalForMock = globalThis as unknown as {
  valenceDb: typeof initialMockDatabase | undefined;
};

export const mockDatabase = globalForMock.valenceDb ?? initialMockDatabase;
if (process.env.NODE_ENV !== "production") {
  globalForMock.valenceDb = mockDatabase;
}

