/**
 * Unit tests for Valence Pure Deterministic Guardrail Engine (Phase 4)
 * Uses Node test runner (node --test).
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Import compiled or transpiled guardrails or write JS equivalent for standalone test
const {
  evaluateMaxHoldingWeight,
  evaluateMaxSlippage,
  evaluateOraclePremium,
  evaluateMinLiquidity,
  evaluateBasketGuardrails,
  DEFAULT_GUARDRAIL_CONFIG,
} = require('./guardrails.js');

describe('Guardrail Engine — Rule 1: Max Holding Weight', () => {
  test('passes balanced basket without modification', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 25, rationale: 'AI lead' },
      { ticker: 'TSM', weightPct: 25, rationale: 'Foundry dominant' },
      { ticker: 'AMD', weightPct: 25, rationale: 'Datacenter GPU' },
      { ticker: 'MSFT', weightPct: 25, rationale: 'Cloud infra' },
    ];
    const result = evaluateMaxHoldingWeight(holdings, 35, true);
    assert.equal(result.passed, true);
    assert.equal(result.wasTrimmed, false);
    assert.equal(result.adjustedHoldings.length, 4);
  });

  test('auto-trims overweighted holding and renormalizes to 100%', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 60, rationale: 'Too concentrated' },
      { ticker: 'TSM', weightPct: 20, rationale: 'Foundry' },
      { ticker: 'AMD', weightPct: 20, rationale: 'GPU competitor' },
    ];
    const result = evaluateMaxHoldingWeight(holdings, 35, true);
    assert.equal(result.passed, true);
    assert.equal(result.wasTrimmed, true);
    const sum = result.adjustedHoldings.reduce((acc, h) => acc + h.weightPct, 0);
    assert.equal(Math.round(sum), 100);
    const nvda = result.adjustedHoldings.find((h) => h.ticker === 'NVDA');
    assert.ok(nvda.weightPct <= 35.1);
  });

  test('rejects overweighted holding when autoTrim is disabled', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 50, rationale: 'Concentrated' },
      { ticker: 'AAPL', weightPct: 50, rationale: 'Consumer' },
    ];
    const result = evaluateMaxHoldingWeight(holdings, 35, false);
    assert.equal(result.passed, false);
    assert.ok(result.reasons[0].includes('weight exceeded'));
  });
});

describe('Guardrail Engine — Rule 2: Max Slippage', () => {
  test('passes when all expected slippages are within max threshold', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 50, rationale: 'AI', expectedSlippageBps: 15 },
      { ticker: 'MSFT', weightPct: 50, rationale: 'Cloud', expectedSlippageBps: 22 },
    ];
    const result = evaluateMaxSlippage(holdings, 50);
    assert.equal(result.passed, true);
  });

  test('fails when any holding exceeds max allowable slippage', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 50, rationale: 'AI', expectedSlippageBps: 15 },
      { ticker: 'SMH', weightPct: 50, rationale: 'ETF', expectedSlippageBps: 85 }, // > 50 bps
    ];
    const result = evaluateMaxSlippage(holdings, 50);
    assert.equal(result.passed, false);
    assert.ok(result.message.includes('SMH expected slippage 85 bps exceeds max limit of 50 bps'));
  });
});

describe('Guardrail Engine — Rule 3: Max Oracle Premium vs Chainlink', () => {
  test('passes when pool spot price matches or is close to oracle price', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 100, rationale: 'AI', currentPriceUsd: 130.2, oraclePriceUsd: 130.0 }, // +15 bps
    ];
    const result = evaluateOraclePremium(holdings, 100);
    assert.equal(result.passed, true);
  });

  test('rejects when pool price has excessive premium over Chainlink oracle', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 100, rationale: 'AI', currentPriceUsd: 133.0, oraclePriceUsd: 130.0 }, // ~230 bps premium > 100 bps
    ];
    const result = evaluateOraclePremium(holdings, 100);
    assert.equal(result.passed, false);
    assert.ok(result.message.includes('exceeds Chainlink oracle'));
  });
});

describe('Guardrail Engine — Rule 4: Minimum Pool Liquidity', () => {
  test('passes when pool liquidity exceeds minimum threshold', () => {
    const holdings = [
      { ticker: 'NVDA', weightPct: 100, rationale: 'AI', poolLiquidityUsd: 12_000_000 },
    ];
    const result = evaluateMinLiquidity(holdings, 250_000);
    assert.equal(result.passed, true);
  });

  test('rejects illiquid tokenized stock pool', () => {
    const holdings = [
      { ticker: 'SPEC', weightPct: 100, rationale: 'Illiquid', poolLiquidityUsd: 45_000 },
    ];
    const result = evaluateMinLiquidity(holdings, 250_000);
    assert.equal(result.passed, false);
    assert.ok(result.message.includes('below safe minimum'));
  });
});

describe('Guardrail Engine — Master Evaluation & Bad Mock Rejection', () => {
  test('approves healthy basket', () => {
    const healthyProposal = {
      theme: 'AI & Semiconductors',
      holdings: [
        { ticker: 'NVDA', weightPct: 30, rationale: 'AI GPU lead', expectedSlippageBps: 15, poolLiquidityUsd: 15_000_000, currentPriceUsd: 130.1, oraclePriceUsd: 130.0 },
        { ticker: 'TSM', weightPct: 30, rationale: 'Key foundry', expectedSlippageBps: 20, poolLiquidityUsd: 8_000_000, currentPriceUsd: 175.2, oraclePriceUsd: 175.0 },
        { ticker: 'AMD', weightPct: 20, rationale: 'Datacenter', expectedSlippageBps: 25, poolLiquidityUsd: 5_000_000, currentPriceUsd: 155.0, oraclePriceUsd: 155.0 },
        { ticker: 'MSFT', weightPct: 20, rationale: 'Hyperscaler', expectedSlippageBps: 12, poolLiquidityUsd: 25_000_000, currentPriceUsd: 430.0, oraclePriceUsd: 430.0 },
      ],
    };
    const result = evaluateBasketGuardrails(healthyProposal, DEFAULT_GUARDRAIL_CONFIG);
    assert.equal(result.status, 'APPROVED');
    assert.equal(result.passed, true);
    assert.equal(result.approvedHoldings.length, 4);
    assert.equal(result.rejectedHoldings.length, 0);
  });

  test('correctly rejects deliberately-bad mock proposal with illiquidity and high slippage', () => {
    const deliberatelyBadProposal = {
      theme: 'Bad Proposal',
      holdings: [
        { ticker: 'BAD_STOCK', weightPct: 50, rationale: 'Shady pool', expectedSlippageBps: 250, poolLiquidityUsd: 30_000, currentPriceUsd: 110, oraclePriceUsd: 100 },
        { ticker: 'NVDA', weightPct: 50, rationale: 'Healthy', expectedSlippageBps: 10, poolLiquidityUsd: 10_000_000, currentPriceUsd: 130, oraclePriceUsd: 130 },
      ],
    };
    const result = evaluateBasketGuardrails(deliberatelyBadProposal, DEFAULT_GUARDRAIL_CONFIG);
    assert.equal(result.status, 'REJECTED');
    assert.equal(result.passed, false);
    assert.ok(result.rejectedHoldings.length > 0);
    assert.ok(result.reasons.some((r) => r.includes('Slippage') || r.includes('Liquidity') || r.includes('Oracle')));
  });
});
