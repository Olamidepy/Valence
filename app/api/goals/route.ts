import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateServBasket } from "@/lib/serv/basket";
import { evaluateBasketGuardrails } from "@/lib/guardrails";
import { mockDatabase } from "@/lib/db";

const CreateGoalRequestSchema = z.object({
  amountUsd: z.coerce.number().min(0.01, "Minimum investment amount is $0.01").default(10),
  frequency: z.enum(["WEEKLY", "MONTHLY"]).default("WEEKLY"),
  theme: z.string().min(3, "Goal description must be at least 3 characters"),
  apiKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateGoalRequestSchema.parse(body);

    const customKey =
      parsed.apiKey ||
      req.headers.get("x-serv-api-key") ||
      req.headers.get("x-gemini-api-key") ||
      undefined;

    // Phase 3: SERV Reasoning proposal generation (OpenServ / Gemini / Institutional)
    const servBasket = await generateServBasket(parsed.theme, customKey);

    // Phase 4: Deterministic Guardrail evaluation
    const guardrailResult = evaluateBasketGuardrails(
      servBasket,
      mockDatabase.guardrailConfig
    );

    const goalId = `goal_${Date.now()}`;
    const previewData = {
      id: goalId,
      amountUsd: parsed.amountUsd,
      frequency: parsed.frequency,
      theme: parsed.theme,
      servBasket,
      guardrailResult,
      requiresConfirmation: true,
      lastOpenServError: (globalThis as any).__lastOpenServError || undefined,
    };

    return NextResponse.json(previewData, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in POST /api/goals:", error);
    if (error instanceof z.ZodError) {
      const firstMsg = error.errors[0]?.message || "Validation error";
      return NextResponse.json(
        { error: firstMsg, details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
