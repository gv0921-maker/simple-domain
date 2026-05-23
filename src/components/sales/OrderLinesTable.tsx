import { useMemo, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, Plus, GripVertical, Lock, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculateLineTax,
  calculateOrderTotals,
} from '@/lib/services/sales';
import type {
  GSTType,
  LinePerLineDiscountType,
  OrderDiscountType,
  QuotationLine,
  SalesOrderLine,
} from '@/lib/services/sales/types';
import { getProducts } from '@/lib/services/inventory';
import { getSeasonalDiscountPct } from '@/lib/sales/seasonalPricing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type AnyLine = QuotationLine | SalesOrderLine;

interface ProductLite {
  id: string;
  name: string;
  barcode?: string;
  salePrice: number;
}

export interface OrderSummaryValue {
  totalUntaxed: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  orderDiscountAmount: number;
  grandTotal: number;
}

interface Props<L extends AnyLine> {
  lines: L[];
  onChange: (next: L[]) => void;
  /** GST type derived from billing/company state. */
  gstType: GSTType;
  /** Default GST rate applied when adding a new line (e.g. 18). */
  defaultGstRate?: number;
  /** Order-level discount controls. */
  orderDiscountType: OrderDiscountType;
  orderDiscountValue: number;
  onOrderDiscountChange: (type: OrderDiscountType, value: number) => void;
  /** Loyalty redemption (optional). */
  pointsAvailable?: number;
  pointsRedeemed?: number;
  onPointsRedeemedChange?: (points: number) => void;
  /** Role gating. */
  canApplyOrderDiscount: boolean;
  /** Allowed per-line discount types for the active role. */
  allowedLineDiscountTypes?: LinePerLineDiscountType[];
  disabled?: boolean;
  /** Notifies the parent of computed totals (so it can persist them). */
  onTotalsChange?: (totals: OrderSummaryValue) => void;
  /** Factory for a new line (so caller can provide order-line specifics). */
  newLine: (id: string) => L;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const ALL_LINE_DISCOUNT_TYPES: { value: Exclude<LinePerLineDiscountType, null>; label: string }[] = [
  { value: 'flat_order', label: 'Flat Order' },
  { value: 'item', label: 'Item Discount' },
  { value: 'loyalty', label: 'Loyalty Price' },
  { value: 'seasonal', label: 'Seasonal Price' },
];

function recomputeLine<L extends AnyLine>(line: L, gstType: GSTType): L {
  const units = line.units ?? line.quantity ?? 0;
  const unitPrice = line.unitPrice || 0;
  const netAmount = units * unitPrice;
  const gstRate = line.gstRate ?? 0;
  const tax = calculateLineTax(netAmount, gstRate, gstType);

  // Discount
  let discountAmount = 0;
  if (line.perLineDiscountType === 'item') {
    // discountValue interpreted as % when <=100, else flat ₹ for simplicity
    const v = line.discountValue || 0;
    discountAmount = v <= 100 ? netAmount * (v / 100) : v;
  } else if (line.perLineDiscountType === 'loyalty' || line.perLineDiscountType === 'seasonal') {
    discountAmount = (line.discountValue || 0) > 0 ? netAmount * ((line.discountValue || 0) / 100) : 0;
  }
  const finalAmount = Math.max(0, netAmount - discountAmount + tax.total);

  return {
    ...line,
    quantity: units,
    units,
    netAmount: Math.round(netAmount * 100) / 100,
    cgstAmount: tax.cgst,
    sgstAmount: tax.sgst,
    igstAmount: tax.igst,
    taxAmount: tax.total,
    subtotal: Math.round(netAmount * 100) / 100,
    total: Math.round(finalAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  } as L;
}

export function OrderLinesTable<L extends AnyLine>({
  lines,
  onChange,
  gstType,
  defaultGstRate = 18,
  orderDiscountType,
  orderDiscountValue,
  onOrderDiscountChange,
  pointsAvailable = 0,
  pointsRedeemed = 0,
  onPointsRedeemedChange,
  canApplyOrderDiscount,
  allowedLineDiscountTypes,
  disabled,
  onTotalsChange,
  newLine,
}: Props<L>) {
  const products = useMemo<ProductLite[]>(() => getProducts() as ProductLite[], []);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const barcodeMap = useMemo(() => {
    const m = new Map<string, ProductLite>();
    products.forEach((p) => { if (p.barcode) m.set(p.barcode, p); });
    return m;
  }, [products]);

  const totals = useMemo(() => {
    const t = calculateOrderTotals(lines, gstType, orderDiscountType, orderDiscountValue);
    return t;
  }, [lines, gstType, orderDiscountType, orderDiscountValue]);

  const grandAfterPoints = Math.max(0, totals.grandTotal - (pointsRedeemed || 0));

  // Notify parent of totals (in an effect-free, render-cycle-safe way)
  useMemoNotify(totals, grandAfterPoints, onTotalsChange);

  const updateLine = useCallback(
    (id: string, patch: Partial<L>) => {
      onChange(lines.map((l) => (l.id === id ? recomputeLine({ ...l, ...patch } as L, gstType) : l)));
    },
    [lines, onChange, gstType],
  );

  const removeLine = (id: string) => onChange(lines.filter((l) => l.id !== id));

  const moveLine = (from: number, to: number) => {
    if (to < 0 || to >= lines.length) return;
    const next = [...lines];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addLine = () => {
    const empty = newLine(crypto.randomUUID());
    const seeded = recomputeLine(
      { ...empty, quantity: 1, units: 1, gstRate: defaultGstRate } as L,
      gstType,
    );
    onChange([...lines, seeded]);
  };

  const onProductSelect = (line: L, productId: string) => {
    const p = productMap.get(productId);
    if (!p) return updateLine(line.id, { productId } as Partial<L>);
    updateLine(line.id, {
      productId: p.id,
      productName: p.name,
      barcode: p.barcode || '',
      unitPrice: p.salePrice || 0,
    } as Partial<L>);
  };

  /** When the user picks "seasonal" for a line, auto-resolve the best active promo. */
  const applySeasonalForLine = (line: L) => {
    if (!line.productId) return { discountValue: 0, name: undefined as string | undefined };
    const { pct, promotion } = getSeasonalDiscountPct(line.productId, line.unitPrice);
    return { discountValue: pct, name: promotion?.name };
  };

  const onBarcodeChange = (line: L, barcode: string) => {
    const matched = barcodeMap.get(barcode.trim());
    if (matched) {
      updateLine(line.id, {
        productId: matched.id,
        productName: matched.name,
        barcode,
        unitPrice: matched.salePrice || 0,
      } as Partial<L>);
    } else {
      updateLine(line.id, { barcode } as Partial<L>);
    }
  };

  const allowedTypes = allowedLineDiscountTypes ?? ALL_LINE_DISCOUNT_TYPES.map((t) => t.value);

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-10">#</TableHead>
              <TableHead className="min-w-[260px]">Product</TableHead>
              <TableHead className="w-20">Units</TableHead>
              <TableHead className="w-28">Unit Price</TableHead>
              <TableHead className="w-28">Net</TableHead>
              <TableHead className="w-16">GST%</TableHead>
              {gstType === 'cgst_sgst' ? (
                <>
                  <TableHead className="w-24">CGST</TableHead>
                  <TableHead className="w-24">SGST</TableHead>
                </>
              ) : (
                <TableHead className="w-24">IGST</TableHead>
              )}
              <TableHead className="min-w-[200px]">Discount</TableHead>
              <TableHead className="w-28 text-right">Final</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 && (
              <TableRow>
                <TableCell colSpan={gstType === 'cgst_sgst' ? 12 : 11} className="text-center text-muted-foreground py-6">
                  No lines yet. Click "Add Line" below.
                </TableCell>
              </TableRow>
            )}
            {lines.map((line, idx) => (
              <TableRow key={line.id} className="align-top">
                <TableCell className="pt-3">
                  <button
                    type="button"
                    className="text-muted-foreground cursor-grab"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => moveLine(idx, idx + 1)}
                    title="Move down (click) — drag handle"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="pt-3 text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="space-y-1.5">
                  <Select
                    value={line.productId || ''}
                    onValueChange={(v) => onProductSelect(line, v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={line.barcode || ''}
                    onChange={(e) => onBarcodeChange(line, e.target.value)}
                    placeholder=""
                    className="h-8 text-xs font-mono"
                    disabled={disabled}
                  />
                  <Textarea
                    value={line.customization || ''}
                    onChange={(e) => updateLine(line.id, { customization: e.target.value } as Partial<L>)}
                    placeholder=""
                    rows={1}
                    className="text-xs min-h-[28px]"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number" min={0}
                    value={line.units ?? 0}
                    onChange={(e) => updateLine(line.id, { units: Number(e.target.value), quantity: Number(e.target.value) } as Partial<L>)}
                    className="h-9"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number" min={0} step="0.01"
                    value={line.unitPrice ?? 0}
                    onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) } as Partial<L>)}
                    className="h-9"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell className="pt-3 text-sm">{formatINR(line.netAmount || 0)}</TableCell>
                <TableCell>
                  <Input
                    type="number" min={0} max={50}
                    value={line.gstRate ?? 0}
                    onChange={(e) => updateLine(line.id, { gstRate: Number(e.target.value) } as Partial<L>)}
                    className="h-9"
                    disabled={disabled}
                  />
                </TableCell>
                {gstType === 'cgst_sgst' ? (
                  <>
                    <TableCell className="pt-3 text-sm">{formatINR(line.cgstAmount || 0)}</TableCell>
                    <TableCell className="pt-3 text-sm">{formatINR(line.sgstAmount || 0)}</TableCell>
                  </>
                ) : (
                  <TableCell className="pt-3 text-sm">{formatINR(line.igstAmount || 0)}</TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Select
                      value={line.perLineDiscountType ?? 'none'}
                      onValueChange={(v) =>
                        {
                          const next = v === 'none' ? null : (v as LinePerLineDiscountType);
                          let discountValue = v === 'none' ? 0 : line.discountValue ?? 0;
                          if (next === 'seasonal') {
                            discountValue = applySeasonalForLine(line).discountValue;
                          }
                          updateLine(line.id, {
                            perLineDiscountType: next,
                            discountValue,
                          } as Partial<L>);
                        }
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {ALL_LINE_DISCOUNT_TYPES.filter((t) => t.value !== 'flat_order' && allowedTypes.includes(t.value)).map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {line.perLineDiscountType && (
                      line.perLineDiscountType === 'seasonal' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input
                                type="number" min={0}
                                value={line.discountValue ?? 0}
                                readOnly
                                className="h-8 text-xs cursor-help"
                                placeholder=""
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {applySeasonalForLine(line).name ?? 'No active promotion'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Input
                          type="number" min={0}
                          value={line.discountValue ?? 0}
                          onChange={(e) => updateLine(line.id, { discountValue: Number(e.target.value) } as Partial<L>)}
                          className="h-8 text-xs"
                          disabled={disabled}
                          placeholder=""
                        />
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell className="pt-3 text-sm font-medium text-right">{formatINR(line.finalAmount || line.total || 0)}</TableCell>
                <TableCell className="pt-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(line.id)} disabled={disabled}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" onClick={addLine} disabled={disabled} className="gap-2">
        <Plus className="h-4 w-4" /> Add Line
      </Button>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-96 space-y-2 text-sm">
          <SummaryRow label="Total Untaxed" value={formatINR(totals.totalUntaxed)} />
          {gstType === 'cgst_sgst' ? (
            <>
              <SummaryRow label="CGST" value={formatINR(totals.totalCGST)} muted />
              <SummaryRow label="SGST" value={formatINR(totals.totalSGST)} muted />
            </>
          ) : (
            <SummaryRow label="IGST" value={formatINR(totals.totalIGST)} muted />
          )}
          <SummaryRow label="Total GST" value={formatINR(totals.totalGST)} />

          {canApplyOrderDiscount && (
            <div className="flex items-center justify-between gap-2 py-1 border-t border-border">
              <Label className="text-muted-foreground">Order Discount</Label>
              <div className="flex items-center gap-1">
                <Select
                  value={orderDiscountType ?? 'none'}
                  onValueChange={(v) => onOrderDiscountChange(v === 'none' ? null : (v as OrderDiscountType), v === 'none' ? 0 : orderDiscountValue)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="amount">₹</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={0}
                  value={orderDiscountValue || 0}
                  onChange={(e) => onOrderDiscountChange(orderDiscountType, Number(e.target.value))}
                  className="h-8 w-24 text-xs"
                  disabled={disabled || !orderDiscountType}
                  placeholder=""
                />
              </div>
            </div>
          )}
          {totals.orderDiscountAmount > 0 && (
            <SummaryRow label="Discount" value={`- ${formatINR(totals.orderDiscountAmount)}`} muted />
          )}

          {pointsAvailable > 0 && onPointsRedeemedChange && (
            <div className="flex flex-col gap-1 py-1 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Loyalty Points Available</span>
                <span>{pointsAvailable.toLocaleString('en-IN')} pts ({formatINR(pointsAvailable)})</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Redeem</Label>
                <Input
                  type="number" min={0} max={Math.min(pointsAvailable, Math.floor(totals.grandTotal * 0.2))}
                  value={pointsRedeemed || 0}
                  onChange={(e) => onPointsRedeemedChange(Math.min(Number(e.target.value), pointsAvailable, Math.floor(totals.grandTotal * 0.2)))}
                  className="h-8 w-28 text-xs"
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              {pointsRedeemed > 0 && <SummaryRow label="Points Redeemed" value={`- ${formatINR(pointsRedeemed)}`} muted />}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t-2 border-border text-base font-semibold">
            <span>Grand Total</span>
            <span>{formatINR(grandAfterPoints)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-1', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Tiny shim: emit totals to parent without an effect (avoids stale callback closures). */
function useMemoNotify(
  totals: OrderSummaryValue,
  grandAfterPoints: number,
  cb?: (t: OrderSummaryValue) => void,
) {
  // Use a microtask so we don't call setState during render of the parent.
  if (cb) {
    queueMicrotask(() => cb({ ...totals, grandTotal: grandAfterPoints }));
  }
}