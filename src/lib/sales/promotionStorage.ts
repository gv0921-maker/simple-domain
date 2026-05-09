// Seasonal promotion storage. localStorage-backed; Phase 5 swaps to Supabase
// behind the same API, so callers should always go through this module.

import { getItem, setItem } from '@/lib/storage';
import { syncPromotionUpsert, syncPromotionDelete } from '@/lib/sales/supabaseSync';

export type PromotionDiscountType = 'percent' | 'amount';

export interface SeasonalPromotion {
  id: string;
  name: string;
  startDate: string;          // ISO date (YYYY-MM-DD)
  endDate: string;            // ISO date
  discountType: PromotionDiscountType;
  discountValue: number;
  applicableProductIds: string[];
  minOrderValue?: number;
  createdBy?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const KEY = 'sales_seasonal_promotions';

export function getPromotions(): SeasonalPromotion[] {
  return getItem<SeasonalPromotion[]>(KEY, []);
}

export function getPromotion(id: string): SeasonalPromotion | undefined {
  return getPromotions().find((p) => p.id === id);
}

export function savePromotion(p: Partial<SeasonalPromotion> & { id?: string }): SeasonalPromotion {
  const all = getPromotions();
  const now = new Date().toISOString();
  const idx = p.id ? all.findIndex((x) => x.id === p.id) : -1;
  const next: SeasonalPromotion = {
    id: p.id || crypto.randomUUID(),
    name: p.name || 'Untitled Promotion',
    startDate: p.startDate || now.slice(0, 10),
    endDate: p.endDate || now.slice(0, 10),
    discountType: p.discountType || 'percent',
    discountValue: p.discountValue ?? 0,
    applicableProductIds: p.applicableProductIds || [],
    minOrderValue: p.minOrderValue,
    createdBy: p.createdBy,
    active: p.active ?? true,
    createdAt: idx >= 0 ? all[idx].createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) all[idx] = next; else all.push(next);
  setItem(KEY, all);
  syncPromotionUpsert(next);
  return next;
}

export function deletePromotion(id: string): void {
  setItem(KEY, getPromotions().filter((p) => p.id !== id));
  syncPromotionDelete(id);
}
