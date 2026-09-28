import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateServBasket } from "@/lib/serv/basket";
import { evaluateBasketGuardrails } from "@/lib/guardrails";
import { mockDatabase } from "@/lib/db";

const CreateGoalRequestSchema = z.object({
  amountUsd: z.coerce.number().optional().default(50),
  frequency: z.enum(["WEEKLY", "MONTHLY"]).optional().default("WEEKLY"),
  theme: z.string().optional().default("Invest in top AI semiconductor and cloud infrastructure"),
  apiKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const theme =
      req.nextUrl.searchParams.get("theme") ||
      "Invest in top AI semiconductor and cloud infrastructure";
    const apiKey = req.nextUrl.searchParams.get("key") || undefined;

    const servBasket = await generateServBasket(theme, apiKey);
    const guardrailResult = evaluateBasketGuardrails(
      servBasket,
      mockDatabase.guardrailConfig
    );

    return NextResponse.json({
      status: "ok",
      theme,
      servBasket,
      guardrailResult,
      lastOpenServError: (globalThis as any).__lastOpenServError || undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
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
      const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        { error: details || "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
