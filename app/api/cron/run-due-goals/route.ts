import { NextRequest, NextResponse } from "next/server";
import { mockDatabase } from "@/lib/db";
import { generateServBasket } from "@/lib/serv/basket";
import { evaluateBasketGuardrails } from "@/lib/guardrails";
import { executeBasketSwaps } from "@/lib/chain/execute";
import { sendTelegramNotification } from "@/lib/telegram";

/**
 * Phase 6: Scheduler Cron Handler
 * Automates Phase 3 (SERV reasoning) -> Phase 4 (Guardrails) -> Phase 5 (Robinhood Chain MCP)
 * Executed by Vercel Cron or direct manual trigger.
 */
export async function POST(req: NextRequest) {
  try {
    // Check authorization header if CRON_SECRET is set
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const activeGoals = mockDatabase.goals.filter((g) => g.active);
    const results = [];

    for (const goal of activeGoals) {
      console.log(`[Cron] Processing recurring goal ${goal.id}: ${goal.theme}`);

      // Phase 3: SERV Reasoning proposal
      const servProposal = await generateServBasket(goal.theme);

      // Phase 4: Deterministic Guardrails
      const guardrailResult = evaluateBasketGuardrails(
        servProposal,
        mockDatabase.guardrailConfig
      );

      // CRITICAL REQUIREMENT: If guardrails reject, do NOT drop silently!
      // Log outcome directly to the Activity Ledger as REJECTED so user has complete visibility!
      if (!guardrailResult.passed || guardrailResult.status === "REJECTED") {
        for (const rej of guardrailResult.rejectedHoldings) {
          const rejectedTrade = {
            id: `trd_cron_rej_${Date.now()}_${rej.ticker.toLowerCase()}`,
            userId: goal.userId,
            goalId: goal.id,
            ticker: rej.ticker,
            action: "REJECTED" as const,
            amountUsd: Math.round(((goal.amountUsd * rej.weightPct) / 100) * 100) / 100,
            status: "FAILED" as const,
            rejectionReason: rej.reason || "Safety thresholds breached",
            executedAt: new Date().toISOString(),
            feeUsd: 0,
          };
          mockDatabase.trades.unshift(rejectedTrade);

          // Push rejection alert to Telegram
          if (mockDatabase.user.telegramChatId && mockDatabase.alertSetting.telegramEnabled) {
            sendTelegramNotification(mockDatabase.user.telegramChatId, {
              ticker: rej.ticker,
              action: "REJECTED",
              amountUsd: rejectedTrade.amountUsd,
              rejectionReason: rejectedTrade.rejectionReason,
              status: "FAILED",
            }).catch(console.error);
          }
        }

        results.push({
          goalId: goal.id,
          status: "GUARDRAIL_INTERVENED_REJECTED",
          reasons: guardrailResult.reasons,
        });
        continue;
      }

      // Phase 5: Robinhood Chain MCP Execution for approved/trimmed holdings
      const executionHoldings = guardrailResult.approvedHoldings.map((h) => ({
        ticker: h.ticker,
        weightPct: h.weightPct,
        amountUsd: Math.round(((goal.amountUsd * h.weightPct) / 100) * 100) / 100,
      }));

      const execution = await executeBasketSwaps({
        userId: goal.userId,
        goalId: goal.id,
        theme: goal.theme,
        holdings: executionHoldings,
      });

      // Update next scheduled run date
      goal.nextExecutionAt = new Date(
        Date.now() + (goal.frequency === "WEEKLY" ? 7 : 30) * 86400000
      ).toISOString();

      results.push({
        goalId: goal.id,
        status: "EXECUTED",
        wasTrimmed: guardrailResult.status === "TRIMMED",
        receipts: execution.receipts,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedCount: activeGoals.length,
      results,
    });
  } catch (error: unknown) {
    console.error("Error executing scheduler cron:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Scheduler failure" },
      { status: 500 }
    );
  }
}

// Allow GET for easy test invocation in browser or test tools
export async function GET(req: NextRequest) {
  return POST(req);
}
