import { NextResponse } from "next/server";
import { mockDatabase } from "@/lib/db";

export async function GET() {
  try {
    const activeGoal = mockDatabase.goals.find((g) => g.active) || mockDatabase.goals[0];
    const currentBasket = activeGoal?.basket;

    // Calculate portfolio aggregate metrics
    const history = mockDatabase.portfolioHistory;
    const latestValue = history[history.length - 1]?.value || 2480;
    const initialInvested = history[history.length - 1]?.invested || 1850;
    const totalReturnUsd = latestValue - initialInvested;
    const totalReturnPct = ((latestValue - initialInvested) / initialInvested) * 100;

    return NextResponse.json({
      portfolio: {
        totalValueUsd: latestValue,
        totalInvestedUsd: initialInvested,
        totalReturnUsd,
        totalReturnPct,
        currency: "USD",
        chain: "Robinhood Chain Mainnet",
      },
      activeGoal,
      currentBasket,
      nextScheduledBuy: {
        date: activeGoal?.nextExecutionAt || new Date(Date.now() + 86400000).toISOString(),
        amountUsd: activeGoal?.amountUsd || 50,
        frequency: activeGoal?.frequency || "WEEKLY",
        theme: activeGoal?.theme || "AI & Semiconductors",
      },
      history,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/portfolio:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load portfolio" },
      { status: 500 }
    );
  }
}
