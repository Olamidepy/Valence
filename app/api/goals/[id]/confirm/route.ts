import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mockDatabase, MockGoal, MockBasketHolding } from "@/lib/db";
import { executeBasketSwaps } from "@/lib/chain/execute";
import { ROBINHOOD_CHAIN_REGISTRY } from "@/lib/serv/basket";

const ConfirmGoalSchema = z.object({
  amountUsd: z.number().min(0.01),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  theme: z.string().min(2),
  rationale: z.string().optional(),
  wasTrimmed: z.boolean().default(false),
  holdings: z.array(
    z.object({
      ticker: z.string(),
      weightPct: z.number(),
      rationale: z.string().optional(),
    })
  ),
  executeImmediate: z.boolean().default(true),
  liveTxHash: z.string().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = ConfirmGoalSchema.parse(body);

    const goalId = params.id;
    const basketId = `bsk_${Date.now()}`;

    // Map holdings with registry data
    const holdingsWithPrices: MockBasketHolding[] = parsed.holdings.map((h, i) => {
      const reg = ROBINHOOD_CHAIN_REGISTRY[h.ticker] || {
        name: `${h.ticker} Tokenized Equity`,
        currentPriceUsd: 100,
        change24hPct: 0,
        poolLiquidityUsd: 5000000,
      };

      return {
        id: `hld_${basketId}_${i}`,
        ticker: h.ticker,
        name: reg.name,
        weightPct: h.weightPct,
        rationale: h.rationale || "Algorithmic allocation based on target theme.",
        priceUsd: reg.currentPriceUsd,
        change24hPct: reg.change24hPct,
        poolLiquidityUsd: reg.poolLiquidityUsd,
      };
    });

    const newGoal: MockGoal = {
      id: goalId,
      userId: mockDatabase.user.id,
      amountUsd: parsed.amountUsd,
      frequency: parsed.frequency,
      theme: parsed.theme,
      active: true,
      nextExecutionAt: new Date(
        Date.now() + (parsed.frequency === "WEEKLY" ? 7 : 30) * 86400000
      ).toISOString(),
      createdAt: new Date().toISOString(),
      basket: {
        id: basketId,
        generatedAt: new Date().toISOString(),
        rationale:
          parsed.rationale ||
          `Automated ${parsed.frequency.toLowerCase()} investment plan into ${parsed.theme}.`,
        wasTrimmed: parsed.wasTrimmed,
        holdings: holdingsWithPrices,
      },
    };

    // Save to DB
    mockDatabase.goals.unshift(newGoal);

    // If immediate execution requested for live demo
    let executionResult = null;
    if (parsed.executeImmediate) {
      const executionHoldings = parsed.holdings.map((h) => ({
        ticker: h.ticker,
        weightPct: h.weightPct,
        amountUsd: Math.round(((parsed.amountUsd * h.weightPct) / 100) * 100) / 100,
      }));

      executionResult = await executeBasketSwaps({
        userId: mockDatabase.user.id,
        goalId: newGoal.id,
        theme: newGoal.theme,
        txHash: parsed.liveTxHash || undefined,
        holdings: executionHoldings,
      });
    }

    return NextResponse.json({
      success: true,
      goal: newGoal,
      execution: executionResult,
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/goals/[id]/confirm:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid confirmation payload", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || "Failed to confirm goal" },
      { status: 500 }
    );
  }
}
