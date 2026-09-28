/**
 * Valence Fee Accounting Module (Phase 8)
 * Accrues automated protocol management fees on executed swaps.
 */

export interface FeeCalculation {
  grossAmountUsd: number;
  feeBps: number;
  feeUsd: number;
  netAmountUsd: number;
}

// Configurable protocol fee in basis points (50 bps = 0.50%)
export const PROTOCOL_FEE_BPS = 50;

/**
 * Calculate protocol management fee deducted before swap execution
 */
export function calculateProtocolFee(
  grossAmountUsd: number,
  feeBps = PROTOCOL_FEE_BPS
): FeeCalculation {
  const feeFraction = feeBps / 10000;
  const feeUsd = Math.round(grossAmountUsd * feeFraction * 1000) / 1000;
  const netAmountUsd = Math.round((grossAmountUsd - feeUsd) * 100) / 100;

  return {
    grossAmountUsd,
    feeBps,
    feeUsd,
    netAmountUsd,
  };
}
