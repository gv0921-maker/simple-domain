// Pure helpers over promotion storage.

import { getPromotions, type SeasonalPromotion } from './promotionStorage';

function isActive(p: SeasonalPromotion, today: string): boolean {
  return p.active && p.startDate <= today && p.endDate >= today;
}

export function getActivePromotionsForProduct(productId: string, when?: Date): SeasonalPromotion[] {
  const today = (when ?? new Date()).toISOString().slice(0, 10);
  return getPromotions().filter(
    (p) =>
      isActive(p, today) &&
      (p.applicableProductIds.length === 0 || p.applicableProductIds.includes(productId)),
  );
}

/** Best = highest effective % discount. For 'amount' type we cannot compare
 * without a unit price, so we return the first active. */
export function getBestPromotionForProduct(
  productId: string,
  unitPrice?: number,
  when?: Date,
): SeasonalPromotion | undefined {
  const list = getActivePromotionsForProduct(productId, when);
  if (list.length === 0) return undefined;
  if (!unitPrice) return list[0];
  return list
    .map((p) => {
      const pct = p.discountType === 'percent' ? p.discountValue : (p.discountValue / unitPrice) * 100;
      return { p, pct };
    })
    .sort((a, b) => b.pct - a.pct)[0]?.p;
}

/** Convenience: discount % to apply to a line. */
export function getSeasonalDiscountPct(productId: string, unitPrice?: number): {
  pct: number;
  promotion?: SeasonalPromotion;
} {
  const promo = getBestPromotionForProduct(productId, unitPrice);
  if (!promo) return { pct: 0 };
  if (promo.discountType === 'percent') return { pct: promo.discountValue, promotion: promo };
  if (!unitPrice) return { pct: 0, promotion: promo };
  return { pct: Math.min(100, (promo.discountValue / unitPrice) * 100), promotion: promo };
}
