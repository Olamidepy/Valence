// CommonJS mirror for zero-transpilation test runner
const DEFAULT_GUARDRAIL_CONFIG = {
  maxHoldingWeightPct: 35,
  maxSlippageBps: 50,
  maxOraclePremiumBps: 100,
  minPoolLiquidityUsd: 250000,
};

function evaluateMaxHoldingWeight(holdings, maxHoldingWeightPct, allowTrim = true) {
  const reasons = [];
  let wasTrimmed = false;

  if (!holdings || holdings.length === 0) {
    return { passed: false, wasTrimmed: false, reasons: ["Basket cannot be empty"], adjustedHoldings: [] };
  }

  const excessiveHoldings = holdings.filter((h) => h.weightPct > maxHoldingWeightPct);

  if (excessiveHoldings.length === 0) {
    return { passed: true, wasTrimmed: false, reasons: [], adjustedHoldings: holdings.map((h) => ({ ...h })) };
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

  const result = holdings.map((h) => ({
    ...h,
    originalWeightPct: h.weightPct > maxHoldingWeightPct ? h.weightPct : undefined,
    weightPct: h.weightPct,
  }));

  const cappedIndices = new Set();

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

  const rounded = result.map((h) => ({
    ticker: h.ticker,
    rationale: h.rationale,
    expectedSlippageBps: h.expectedSlippageBps,
    poolLiquidityUsd: h.poolLiquidityUsd,
    currentPriceUsd: h.currentPriceUsd,
    oraclePriceUsd: h.oraclePriceUsd,
    originalWeightPct: h.originalWeightPct,
    weightPct: Math.round(h.weightPct * 10) / 10,
  }));

  const roundedSum = rounded.reduce((acc, h) => acc + h.weightPct, 0);
  const diff = Math.round((100 - roundedSum) * 10) / 10;
  if (diff !== 0) {
    const adjustableIndex = rounded.findIndex((h) => h.weightPct + diff <= maxHoldingWeightPct);
    if (adjustableIndex !== -1) {
      rounded[adjustableIndex].weightPct = Math.round((rounded[adjustableIndex].weightPct + diff) * 10) / 10;
    }
  }

  return { passed: true, wasTrimmed: true, reasons, adjustedHoldings: rounded };
}

function evaluateMaxSlippage(holdings, maxSlippageBps) {
  const violations = [];
  for (const h of holdings) {
    if (h.expectedSlippageBps !== undefined && h.expectedSlippageBps > maxSlippageBps) {
      violations.push(
        `${h.ticker} expected slippage ${h.expectedSlippageBps} bps exceeds max limit of ${maxSlippageBps} bps`
      );
    }
  }
  if (violations.length > 0) {
    return { passed: false, message: violations.join("; "), details: { violations } };
  }
  return { passed: true };
}

function evaluateOraclePremium(holdings, maxOraclePremiumBps) {
  const violations = [];
  for (const h of holdings) {
    if (h.currentPriceUsd !== undefined && h.oraclePriceUsd !== undefined && h.oraclePriceUsd > 0) {
      const premiumBps = Math.round(((h.currentPriceUsd - h.oraclePriceUsd) / h.oraclePriceUsd) * 10000);
      if (premiumBps > maxOraclePremiumBps) {
        violations.push(
          `${h.ticker} pool price ($${h.currentPriceUsd}) exceeds Chainlink oracle ($${h.oraclePriceUsd}) by ${premiumBps} bps (limit: ${maxOraclePremiumBps} bps)`
        );
      }
    }
  }
  if (violations.length > 0) {
    return { passed: false, message: violations.join("; "), details: { violations } };
  }
  return { passed: true };
}

function evaluateMinLiquidity(holdings, minPoolLiquidityUsd) {
  const violations = [];
  for (const h of holdings) {
    if (h.poolLiquidityUsd !== undefined && h.poolLiquidityUsd < minPoolLiquidityUsd) {
      violations.push(
        `${h.ticker} pool liquidity of $${h.poolLiquidityUsd.toLocaleString()} is below safe minimum of $${minPoolLiquidityUsd.toLocaleString()}`
      );
    }
  }
  if (violations.length > 0) {
    return { passed: false, message: violations.join("; "), details: { violations } };
  }
  return { passed: true };
}

function evaluateBasketGuardrails(proposal, config = DEFAULT_GUARDRAIL_CONFIG) {
  const allReasons = [];
  const rejectedHoldings = [];

  const slippageResult = evaluateMaxSlippage(proposal.holdings, config.maxSlippageBps);
  if (!slippageResult.passed && slippageResult.message) {
    allReasons.push(`Slippage Guardrail: ${slippageResult.message}`);
  }

  const oracleResult = evaluateOraclePremium(proposal.holdings, config.maxOraclePremiumBps);
  if (!oracleResult.passed && oracleResult.message) {
    allReasons.push(`Oracle Premium Guardrail: ${oracleResult.message}`);
  }

  const liquidityResult = evaluateMinLiquidity(proposal.holdings, config.minPoolLiquidityUsd);
  if (!liquidityResult.passed && liquidityResult.message) {
    allReasons.push(`Liquidity Guardrail: ${liquidityResult.message}`);
  }

  const hasHardFailure = !slippageResult.passed || !oracleResult.passed || !liquidityResult.passed;

  const weightResult = evaluateMaxHoldingWeight(proposal.holdings, config.maxHoldingWeightPct, true);

  if (!weightResult.passed && weightResult.reasons.length > 0) {
    allReasons.push(...weightResult.reasons);
  }

  if (hasHardFailure) {
    for (const h of proposal.holdings) {
      const reasonsForH = [];
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
        rejectedHoldings.push({ ticker: h.ticker, weightPct: h.weightPct, reason: reasonsForH.join(", ") });
      }
    }

    return {
      status: "REJECTED",
      passed: false,
      reasons: allReasons,
      approvedHoldings: [],
      rejectedHoldings,
      ruleBreakdown: {
        maxWeight: { passed: weightResult.passed, message: weightResult.reasons.join("; ") || undefined },
        maxSlippage: slippageResult,
        oraclePremium: oracleResult,
        minLiquidity: liquidityResult,
      },
    };
  }

  const status = weightResult.wasTrimmed ? "TRIMMED" : "APPROVED";
  const approvedHoldings = weightResult.adjustedHoldings.map((h) => ({
    ticker: h.ticker,
    weightPct: h.weightPct,
    rationale: h.rationale,
    priceUsd: h.currentPriceUsd,
    change24hPct: h.change24hPct,
    poolLiquidityUsd: h.poolLiquidityUsd,
    wasTrimmed: h.originalWeightPct !== undefined,
    originalWeightPct: h.originalWeightPct,
  }));

  return {
    status,
    passed: true,
    reasons: weightResult.reasons,
    approvedHoldings,
    rejectedHoldings: [],
    ruleBreakdown: {
      maxWeight: { passed: true, message: weightResult.wasTrimmed ? "Trimmed excessive weights to limit" : undefined },
      maxSlippage: slippageResult,
      oraclePremium: oracleResult,
      minLiquidity: liquidityResult,
    },
  };
}

module.exports = {
  DEFAULT_GUARDRAIL_CONFIG,
  evaluateMaxHoldingWeight,
  evaluateMaxSlippage,
  evaluateOraclePremium,
  evaluateMinLiquidity,
  evaluateBasketGuardrails,
};
