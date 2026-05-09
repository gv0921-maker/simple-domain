/**
 * Phase 5 — Write-through mirror to Supabase for sales add-on data.
 *
 * Strategy: localStorage remains the source of truth for offline-first behavior.
 * Each save/delete fires a best-effort mirror call to Supabase. Failures are
 * logged but never thrown so the app keeps working offline / unauthenticated.
 *
 * Tables backed by this sync:
 *   - sales_seasonal_promotions
 *   - sales_fiscal_positions
 *   - sales_loyalty_transactions  (append-only)
 */
import { supabase } from '@/integrations/supabase/client';
import type { SeasonalPromotion } from '@/lib/sales/promotionStorage';
import type { FiscalPosition } from '@/lib/services/sales/types';

function warn(scope: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`[supabaseSync] ${scope} failed:`, err);
}

// ---------- Seasonal Promotions ----------
export function syncPromotionUpsert(p: SeasonalPromotion): void {
  supabase
    .from('sales_seasonal_promotions')
    .upsert(
      {
        client_id: p.id,
        name: p.name,
        description: (p as any).description ?? null,
        start_date: p.startDate,
        end_date: p.endDate,
        discount_type: p.discountType,
        discount_value: p.discountValue,
        applicable_product_ids: p.applicableProductIds || [],
        active: p.active,
        created_by: p.createdBy ?? null,
      },
      { onConflict: 'client_id' },
    )
    .then(({ error }) => { if (error) warn('promotion upsert', error); });
}

export function syncPromotionDelete(clientId: string): void {
  supabase
    .from('sales_seasonal_promotions')
    .delete()
    .eq('client_id', clientId)
    .then(({ error }) => { if (error) warn('promotion delete', error); });
}

// ---------- Fiscal Positions ----------
export function syncFiscalPositionUpsert(fp: FiscalPosition): void {
  supabase
    .from('sales_fiscal_positions')
    .upsert(
      {
        client_id: fp.id,
        name: fp.name,
        code: fp.code,
        country_code: fp.countryCode ?? null,
        tax_mappings: fp.taxMappings || [],
        is_active: fp.isActive,
      },
      { onConflict: 'client_id' },
    )
    .then(({ error }) => { if (error) warn('fiscal upsert', error); });
}

export function syncFiscalPositionDelete(clientId: string): void {
  supabase
    .from('sales_fiscal_positions')
    .delete()
    .eq('client_id', clientId)
    .then(({ error }) => { if (error) warn('fiscal delete', error); });
}

// ---------- Loyalty Transactions (append-only) ----------
export type LoyaltyTxnType = 'earn' | 'redeem' | 'tier_upgrade' | 'adjust';

export function logLoyaltyTransaction(args: {
  contactId: string;
  orderId?: string;
  txnType: LoyaltyTxnType;
  points?: number;
  amount?: number;
  notes?: string;
  createdBy?: string;
}): void {
  supabase
    .from('sales_loyalty_transactions')
    .insert({
      contact_id: args.contactId,
      order_id: args.orderId ?? null,
      txn_type: args.txnType,
      points: args.points ?? 0,
      amount: args.amount ?? 0,
      notes: args.notes ?? null,
      created_by: args.createdBy ?? null,
    })
    .then(({ error }) => { if (error) warn('loyalty insert', error); });
}