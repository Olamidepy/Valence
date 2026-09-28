/**
 * Valence Deterministic Guardrail Engine (Phase 4)
 * Pure, deterministic, zero-network module for validating investment baskets.
 * "The AI proposes, deterministic code disposes."
 */

export interface BasketHoldingProposal {
  ticker: string;
  weightPct: number;
  rationale: string;
  expectedSlippageBps?: number;
  poolLiquidityUsd?: number;
  currentPriceUsd?: number;
  oraclePriceUsd?: number;
}

export interface BasketProposal {
  theme?: string;
  rationale?: string;
  holdings: BasketHoldingProposal[];
}

export interface GuardrailConfig {
  maxHoldingWeightPct: number; // e.g. 35 (%)
  maxSlippageBps: number; // e.g. 50 (0.50%)
  maxOraclePremiumBps: number; // e.g. 100 (1.00%)
  minPoolLiquidityUsd: number; // e.g. 250,000 ($)
}

export interface RuleCheckResult {
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export interface GuardrailEvaluationResult {
  status: "APPROVED" | "TRIMMED" | "REJECTED";
  passed: boolean;
  reasons: string[];
  approvedHoldings: Array<{
    ticker: string;
    weightPct: number;
    rationale: string;
    wasTrimmed?: boolean;
    originalWeightPct?: number;
  }>;
  rejectedHoldings: Array<{
    ticker: string;
    weightPct: number;
    reason: string;
  }>;
  ruleBreakdown: {
    maxWeight: RuleCheckResult;
    maxSlippage: RuleCheckResult;
    oraclePremium: RuleCheckResult;
    minLiquidity: RuleCheckResult;
  };
}

export const DEFAULT_GUARDRAIL_CONFIG: GuardrailConfig = {
  maxHoldingWeightPct: 35, // Max 35% in any single stock
  maxSlippageBps: 50, // Max 50 bps (0.5%) slippage
  maxOraclePremiumBps: 100, // Max 100 bps (1.0%) premium over Chainlink oracle
  minPoolLiquidityUsd: 250_000, // Min $250k on-chain pool depth
};

/**
 * Rule 1: Check and optionally trim any holding exceeding max weight limit.
 * Trims excessive weights strictly to maxHoldingWeightPct and distributes remaining weight
 * strictly among uncapped assets without violating limits.
 */
export function evaluateMaxHoldingWeight(
  holdings: BasketHoldingProposal[],
  maxHoldingWeightPct: number,
  allowTrim = true
): {
  passed: boolean;
  wasTrimmed: boolean;
  reasons: string[];
  adjustedHoldings: BasketHoldingProposal[];
} {
  const reasons: string[] = [];
  let wasTrimmed = false;

  if (!holdings || holdings.length === 0) {
    return {
      passed: false,
      wasTrimmed: false,
      reasons: ["Basket cannot be empty"],
      adjustedHoldings: [],
    };
  }

  const excessiveHoldings = holdings.filter(
    (h) => h.weightPct > maxHoldingWeightPct
  );

  if (excessiveHoldings.length === 0) {
    return {
      passed: true,
      wasTrimmed: false,
      reasons: [],
      adjustedHoldings: holdings.map((h) => ({ ...h })),
    };
  }

  if (!allowTrim) {
    const tickers = excessiveHoldings
      .map((h) => `${h.ticker} (${h.weightPct}% > max ${maxHoldingWeightPct}%)`)
      .join(", ");
    return {
      passed: false,
      wasTrimmed: false,
      reasons: [`Single holding weight exceeded limit: ${tickers}`],
      adjustedHoldings: [...holdings],
    };
  }

  // Mathematically check if N assets can hold 100% with the cap
  if (holdings.length * maxHoldingWeightPct < 100) {
    return {
      passed: false,
      wasTrimmed: false,
      reasons: [
        `Cannot rebalance: basket has only ${holdings.length} assets with a max cap of ${maxHoldingWeightPct}% (requires at least ${Math.ceil(100 / maxHoldingWeightPct)} assets)`,
      ],
      adjustedHoldings: [...holdings],
    };
  }

  wasTrimmed = true;
  for (const h of excessiveHoldings) {
    reasons.push(
      `Trimmed ${h.ticker} from ${h.weightPct}% to guardrail ceiling of ${maxHoldingWeightPct}%`
    );
  }

  // Iterative constrained rebalancing algorithm
  const result = holdings.map((h) => ({
    ...h,
    originalWeightPct: h.weightPct > maxHoldingWeightPct ? h.weightPct : undefined,
    weightPct: h.weightPct,
    isCapped: false,
  }));

  const cappedIndices = new Set<number>();

  while (true) {
    let newlyCapped = false;
    for (let i = 0; i < result.length; i++) {
      if (!cappedIndices.has(i) && result[i].weightPct >= maxHoldingWeightPct) {
        result[i].weightPct = maxHoldingWeightPct;
        cappedIndices.add(i);
        newlyCapped = true;
      }
    }

    const cappedSum = Array.from(cappedIndices).reduce(
      (sum, idx) => sum + result[idx].weightPct,
      0
    );
    const uncappedIndices = result
      .map((_, i) => i)
      .filter((i) => !cappedIndices.has(i));

    if (uncappedIndices.length === 0) {
      break;
    }

    const uncappedTarget = 100 - cappedSum;
    const currentUncappedSum = uncappedIndices.reduce(
      (sum, idx) => sum + result[idx].weightPct,
      0
    );

    if (currentUncappedSum <= 0) {
      const equalShare = uncappedTarget / uncappedIndices.length;
      for (const idx of uncappedIndices) {
        result[idx].weightPct = equalShare;
      }
    } else {
      const factor = uncappedTarget / currentUncappedSum;
      for (const idx of uncappedIndices) {
        result[idx].weightPct = result[idx].weightPct * factor;
      }
    }

    const anyExceeded = uncappedIndices.some(
      (idx) => result[idx].weightPct > maxHoldingWeightPct + 0.0001
    );

    if (!anyExceeded && !newlyCapped) {
      break;
    }
  }

  // Round to 1 decimal place
  const rounded = result.map((h) => ({
    ticker: h.ticker,
    rationale: h.rationale,
    expectedSlippageBps: h.expectedSlippageBps,
    poolLiquidityUsd: h.poolLiquidityUsd,
    currentPriceUsd: h.currentPriceUsd,
    change24hPct: (h as unknown as { change24hPct?: number }).change24hPct,
    oraclePriceUsd: h.oraclePriceUsd,
    originalWeightPct: h.originalWeightPct,
    weightPct: Math.round(h.weightPct * 10) / 10,
  }));

  // Fix rounding diff on uncapped asset
  const roundedSum = rounded.reduce((acc, h) => acc + h.weightPct, 0);
  const diff = Math.round((100 - roundedSum) * 10) / 10;
  if (diff !== 0) {
    const adjustableIndex = rounded.findIndex((h) => h.weightPct + diff <= maxHoldingWeightPct);
    if (adjustableIndex !== -1) {
      rounded[adjustableIndex].weightPct = Math.round((rounded[adjustableIndex].weightPct + diff) * 10) / 10;
    }
  }

  return {
    passed: true,
    wasTrimmed: true,
    reasons,
    adjustedHoldings: rounded,
  };
}

/**
 * Rule 2: Ensure expected slippage does not exceed maximum allowable bps.
 */
export function evaluateMaxSlippage(
  holdings: BasketHoldingProposal[],
  maxSlippageBps: number
): RuleCheckResult {
  const violations: string[] = [];

  for (const h of holdings) {
    if (h.expectedSlippageBps !== undefined && h.expectedSlippageBps > maxSlippageBps) {
      violations.push(
        `${h.ticker} expected slippage ${h.expectedSlippageBps} bps exceeds max limit of ${maxSlippageBps} bps`
      );
    }
  }

  if (violations.length > 0) {
    return {
      passed: false,
      message: violations.join("; "),
      details: { violations },
    };
  }

  return { passed: true };
}

/**
 * Rule 3: Check spot execution price against Chainlink oracle feed.
 */
export function evaluateOraclePremium(
  holdings: BasketHoldingProposal[],
  maxOraclePremiumBps: number
): RuleCheckResult {
  const violations: string[] = [];

  for (const h of holdings) {
    if (
      h.currentPriceUsd !== undefined &&
      h.oraclePriceUsd !== undefined &&
      h.oraclePriceUsd > 0
    ) {
      const premiumBps = Math.round(
        ((h.currentPriceUsd - h.oraclePriceUsd) / h.oraclePriceUsd) * 10000
      );
      if (premiumBps > maxOraclePremiumBps) {
        violations.push(
          `${h.ticker} pool price ($${h.currentPriceUsd}) exceeds Chainlink oracle ($${h.oraclePriceUsd}) by ${premiumBps} bps (limit: ${maxOraclePremiumBps} bps)`
        );
      }
    }
  }

  if (violations.length > 0) {
    return {
      passed: false,
      message: violations.join("; "),
      details: { violations },
    };
  }

  return { passed: true };
}

/**
 * Rule 4: Verify on-chain Robinhood Chain liquidity depth for each asset.
 */
export function evaluateMinLiquidity(
  holdings: BasketHoldingProposal[],
  minPoolLiquidityUsd: number
): RuleCheckResult {
  const violations: string[] = [];

  for (const h of holdings) {
    if (
      h.poolLiquidityUsd !== undefined &&
      h.poolLiquidityUsd < minPoolLiquidityUsd
    ) {
      violations.push(
        `${h.ticker} pool liquidity of $${h.poolLiquidityUsd.toLocaleString()} is below safe minimum of $${minPoolLiquidityUsd.toLocaleString()}`
      );
    }
  }

  if (violations.length > 0) {
    return {
      passed: false,
      message: violations.join("; "),
      details: { violations },
    };
  }

  return { passed: true };
}

/**
 * Master Guardrail Evaluator
 */
export function evaluateBasketGuardrails(
  proposal: BasketProposal,
  config: GuardrailConfig = DEFAULT_GUARDRAIL_CONFIG
): GuardrailEvaluationResult {
  const allReasons: string[] = [];
  const rejectedHoldings: Array<{ ticker: string; weightPct: number; reason: string }> = [];

  // Check 1: Slippage Check
  const slippageResult = evaluateMaxSlippage(proposal.holdings, config.maxSlippageBps);
  if (!slippageResult.passed && slippageResult.message) {
    allReasons.push(`Slippage Guardrail: ${slippageResult.message}`);
  }

  // Check 2: Oracle Premium Check
  const oracleResult = evaluateOraclePremium(proposal.holdings, config.maxOraclePremiumBps);
  if (!oracleResult.passed && oracleResult.message) {
    allReasons.push(`Oracle Premium Guardrail: ${oracleResult.message}`);
  }

  // Check 3: Pool Liquidity Check
  const liquidityResult = evaluateMinLiquidity(proposal.holdings, config.minPoolLiquidityUsd);
  if (!liquidityResult.passed && liquidityResult.message) {
    allReasons.push(`Liquidity Guardrail: ${liquidityResult.message}`);
  }

  const hasHardFailure = !slippageResult.passed || !oracleResult.passed || !liquidityResult.passed;

  // Check 4: Max Weight Check with Auto-trim
  const weightResult = evaluateMaxHoldingWeight(
    proposal.holdings,
    config.maxHoldingWeightPct,
    true
  );

  if (!weightResult.passed && weightResult.reasons.length > 0) {
    allReasons.push(...weightResult.reasons);
  }

  if (hasHardFailure) {
    for (const h of proposal.holdings) {
      const reasonsForH: string[] = [];
      if (h.expectedSlippageBps && h.expectedSlippageBps > config.maxSlippageBps) {
        reasonsForH.push(`Slippage ${h.expectedSlippageBps} bps > ${config.maxSlippageBps} bps`);
      }
      if (h.currentPriceUsd && h.oraclePriceUsd && h.oraclePriceUsd > 0) {
        const premium = Math.round(((h.currentPriceUsd - h.oraclePriceUsd) / h.oraclePriceUsd) * 10000);
        if (premium > config.maxOraclePremiumBps) {
          reasonsForH.push(`Oracle premium ${premium} bps > ${config.maxOraclePremiumBps} bps`);
        }
      }
      if (h.poolLiquidityUsd && h.poolLiquidityUsd < config.minPoolLiquidityUsd) {
        reasonsForH.push(`Liquidity $${h.poolLiquidityUsd} < $${config.minPoolLiquidityUsd}`);
      }
      if (reasonsForH.length > 0) {
        rejectedHoldings.push({
          ticker: h.ticker,
          weightPct: h.weightPct,
          reason: reasonsForH.join(", "),
        });
      }
    }

    return {
      status: "REJECTED",
      passed: false,
      reasons: allReasons,
      approvedHoldings: [],
      rejectedHoldings,
      ruleBreakdown: {
        maxWeight: {
          passed: weightResult.passed,
          message: weightResult.reasons.join("; ") || undefined,
        },
        maxSlippage: slippageResult,
        oraclePremium: oracleResult,
        minLiquidity: liquidityResult,
      },
    };
  }

  const status: "APPROVED" | "TRIMMED" = weightResult.wasTrimmed ? "TRIMMED" : "APPROVED";
  const approvedHoldings = weightResult.adjustedHoldings.map((h) => ({
    ticker: h.ticker,
    weightPct: h.weightPct,
    rationale: h.rationale,
    priceUsd: h.currentPriceUsd,
    change24hPct: (h as unknown as { change24hPct?: number }).change24hPct,
    poolLiquidityUsd: h.poolLiquidityUsd,
    wasTrimmed: (h as { originalWeightPct?: number }).originalWeightPct !== undefined,
    originalWeightPct: (h as { originalWeightPct?: number }).originalWeightPct,
  }));

  return {
    status,
    passed: true,
    reasons: weightResult.reasons,
    approvedHoldings,
    rejectedHoldings: [],
    ruleBreakdown: {
      maxWeight: {
        passed: true,
        message: weightResult.wasTrimmed ? "Trimmed excessive weights to limit" : undefined,
      },
      maxSlippage: slippageResult,
      oraclePremium: oracleResult,
      minLiquidity: liquidityResult,
    },
  };
}
