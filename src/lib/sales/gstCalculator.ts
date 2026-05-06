// GST calculation engine — CGST/SGST when intra-state, IGST when inter-state.
// Pure functions; no UI imports.
import { getCompanySettings } from './companySettings';
import type { GSTType, OrderDiscountType, QuotationLine, SalesOrderLine } from '@/lib/data/sales/types';

type AnyLine = QuotationLine | SalesOrderLine;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Determines tax type by comparing billing state with company state. */
export function determineGSTType(_billingCity: string, billingState: string): GSTType {
  const company = getCompanySettings();
  const companyState = (company?.state || '').toLowerCase().trim();
  const target = (billingState || '').toLowerCase().trim();
  if (!companyState || !target) return 'cgst_sgst';
  return target === companyState ? 'cgst_sgst' : 'igst';
}

/** Tax breakdown for a single line. */
export function calculateLineTax(
  netAmount: number,
  gstRate: number,
  gstType: GSTType,
): { cgst: number; sgst: number; igst: number; total: number } {
  const totalGST = (netAmount * (gstRate || 0)) / 100;
  if (gstType === 'cgst_sgst') {
    const half = totalGST / 2;
    return { cgst: round2(half), sgst: round2(half), igst: 0, total: round2(totalGST) };
  }
  return { cgst: 0, sgst: 0, igst: round2(totalGST), total: round2(totalGST) };
}

/** Whole-order totals including order-level discount and per-line GST aggregation. */
export function calculateOrderTotals(
  lines: AnyLine[],
  gstType: GSTType,
  orderDiscountType: OrderDiscountType,
  orderDiscountValue: number,
): {
  totalUntaxed: number;
  orderDiscountAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  grandTotal: number;
} {
  const totalUntaxed = lines.reduce((s, l) => s + (l.netAmount ?? l.subtotal ?? 0), 0);

  let orderDiscountAmount = 0;
  if (orderDiscountType === 'percent') {
    orderDiscountAmount = totalUntaxed * ((orderDiscountValue || 0) / 100);
  } else if (orderDiscountType === 'amount') {
    orderDiscountAmount = orderDiscountValue || 0;
  }
  orderDiscountAmount = Math.min(orderDiscountAmount, totalUntaxed);
  const discountedUntaxed = totalUntaxed - orderDiscountAmount;

  const totalCGST = gstType === 'cgst_sgst' ? lines.reduce((s, l) => s + (l.cgstAmount || 0), 0) : 0;
  const totalSGST = gstType === 'cgst_sgst' ? lines.reduce((s, l) => s + (l.sgstAmount || 0), 0) : 0;
  const totalIGST = gstType === 'igst' ? lines.reduce((s, l) => s + (l.igstAmount || 0), 0) : 0;
  const totalGST = totalCGST + totalSGST + totalIGST;

  return {
    totalUntaxed: round2(totalUntaxed),
    orderDiscountAmount: round2(orderDiscountAmount),
    totalCGST: round2(totalCGST),
    totalSGST: round2(totalSGST),
    totalIGST: round2(totalIGST),
    totalGST: round2(totalGST),
    grandTotal: round2(discountedUntaxed + totalGST),
  };
}