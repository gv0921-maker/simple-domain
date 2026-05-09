// B2C Loyalty Engine — pure functions, no I/O.

import type { LoyaltyTier } from '@/lib/data/sales/types';

export const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 25_000 },
  silver: { min: 25_001, max: 1_00_000 },
  gold: { min: 1_00_001, max: Infinity },
} as const;

export const TIER_POINTS_RATE: Record<LoyaltyTier, number> = {
  bronze: 0.01, // 1%
  silver: 0.02, // 2%
  gold: 0.03,   // 3%
};

export const TIER_DISCOUNT_PCT: Record<LoyaltyTier, number> = {
  bronze: 2,
  silver: 5,
  gold: 10,
};

export const POINT_VALUE_INR = 1;          // 1 point = ₹1
export const MAX_REDEMPTION_PCT = 0.20;    // ≤ 20% of grand total

export function getTierFromSpend(lifetimeSpend: number): LoyaltyTier {
  if (lifetimeSpend >= TIER_THRESHOLDS.gold.min) return 'gold';
  if (lifetimeSpend >= TIER_THRESHOLDS.silver.min) return 'silver';
  return 'bronze';
}

export function calculatePointsEarned(orderValue: number, tier: LoyaltyTier): number {
  return Math.floor((orderValue || 0) * TIER_POINTS_RATE[tier]);
}

export function getLoyaltyDiscountPct(tier: LoyaltyTier): number {
  return TIER_DISCOUNT_PCT[tier];
}

export function calculateRedemptionAmount(points: number): number {
  return Math.max(0, Math.floor(points)) * POINT_VALUE_INR;
}

export function maxRedeemablePoints(grandTotal: number, pointsAvailable: number): number {
  const cap = Math.floor((grandTotal || 0) * MAX_REDEMPTION_PCT / POINT_VALUE_INR);
  return Math.max(0, Math.min(pointsAvailable || 0, cap));
}

/** Progress (0..1) and the spend remaining to the next tier. */
export function getTierProgress(lifetimeSpend: number): {
  tier: LoyaltyTier;
  next?: LoyaltyTier;
  progress: number;
  remaining: number;
} {
  const tier = getTierFromSpend(lifetimeSpend);
  if (tier === 'gold') return { tier, progress: 1, remaining: 0 };
  const nextMin = tier === 'bronze' ? TIER_THRESHOLDS.silver.min : TIER_THRESHOLDS.gold.min;
  const tierMin = TIER_THRESHOLDS[tier].min;
  const span = nextMin - tierMin;
  const progress = Math.max(0, Math.min(1, (lifetimeSpend - tierMin) / span));
  return {
    tier,
    next: tier === 'bronze' ? 'silver' : 'gold',
    progress,
    remaining: Math.max(0, nextMin - lifetimeSpend),
  };
}

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};
