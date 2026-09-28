import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mockDatabase } from "@/lib/db";

const UpdateGuardrailSchema = z.object({
  maxHoldingWeightPct: z.number().min(10).max(100),
  maxSlippageBps: z.number().min(5).max(500),
  maxOraclePremiumBps: z.number().min(10).max(1000),
  minPoolLiquidityUsd: z.number().min(10000).max(10000000),
});

export async function GET() {
  return NextResponse.json({
    config: mockDatabase.guardrailConfig,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateGuardrailSchema.parse(body);

    mockDatabase.guardrailConfig = {
      ...mockDatabase.guardrailConfig,
      ...parsed,
    };

    return NextResponse.json({
      success: true,
      config: mockDatabase.guardrailConfig,
      message: "Deterministic guardrail parameters successfully updated.",
    });
  } catch (error: unknown) {
    console.error("Error in PATCH /api/settings/guardrails:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid guardrail bounds", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update guardrails" },
      { status: 500 }
    );
  }
}
