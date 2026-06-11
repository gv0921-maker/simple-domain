import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Plus, GripVertical, Lock, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductCombobox } from './ProductCombobox';
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
import { useProducts } from '@/hooks/inventory';
import { getSeasonalDiscountPct } from '@/lib/sales/seasonalPricing';

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
  gstType: GSTType;
  defaultGstRate?: number;
  orderDiscountType: OrderDiscountType;
  orderDiscountValue: number;
  onOrderDiscountChange: (type: OrderDiscountType, value: number) => void;
  pointsAvailable?: number;
  pointsRedeemed?: number;
  onPointsRedeemedChange?: (points: number) => void;
  canApplyOrderDiscount: boolean;
  allowedLineDiscountTypes?: LinePerLineDiscountType[];
  disabled?: boolean;
  onTotalsChange?: (totals: OrderSummaryValue) => void;
  newLine: (id: string) => L;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const COMMON_GST_RATES = [0, 5, 12, 18, 28];
const LINE_DISCOUNT_OPTIONS: { value: Exclude<LinePerLineDiscountType, null | 'flat_order'>; label: string }[] = [
  { value: 'item', label: 'Item %' },
  { value: 'loyalty', label: 'Loyalty' },
  { value: 'seasonal', label: 'Seasonal' },
];

function recomputeLine<L extends AnyLine>(line: L, gstType: GSTType): L {
  const units = line.units ?? line.quantity ?? 0;
  const unitPrice = line.unitPrice || 0;
  const netAmount = units * unitPrice;
  const gstRate = line.gstRate ?? 0;
  const tax = calculateLineTax(netAmount, gstRate, gstType);

  let discountAmount = 0;
  if (line.perLineDiscountType === 'item') {
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
  const { data: productList = [] } = useProducts();
  const products = useMemo<ProductLite[]>(() => productList as unknown as ProductLite[], [productList]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const barcodeMap = useMemo(() => {
    const m = new Map<string, ProductLite>();
    products.forEach((p) => { if (p.barcode) m.set(p.barcode, p); });
    return m;
  }, [products]);

  const totals = useMemo(
    () => calculateOrderTotals(lines, gstType, orderDiscountType, orderDiscountValue),
    [lines, gstType, orderDiscountType, orderDiscountValue],
  );

  const grandAfterPoints = Math.max(0, totals.grandTotal - (pointsRedeemed || 0));

  const prevTotalsRef = useRef<string>('');
  useEffect(() => {
    if (!onTotalsChange) return;
    const payload = { ...totals, grandTotal: grandAfterPoints };
    const key = JSON.stringify(payload);
    if (key === prevTotalsRef.current) return;
    prevTotalsRef.current = key;
    onTotalsChange(payload);
  }, [totals, grandAfterPoints, onTotalsChange]);

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

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

  const allowedTypes = allowedLineDiscountTypes ?? LINE_DISCOUNT_OPTIONS.map((t) => t.value);
  const canDiscount = allowedTypes.length > 0;

  // Most-common GST rate for summary labels
  const summaryGstRate = useMemo(() => {
    const counts = new Map<number, number>();
    lines.forEach((l) => {
      const r = l.gstRate ?? 0;
      counts.set(r, (counts.get(r) || 0) + 1);
    });
    let top = 0; let topCount = 0;
    counts.forEach((c, r) => { if (c > topCount) { topCount = c; top = r; } });
    return top;
  }, [lines]);

  const renderRow = (line: L, idx: number) => {
    const isActive = hoveredRowId === line.id || focusedRowId === line.id;
    const hasBarcode = !!(line.barcode && line.barcode.length > 0);
    const hasCustomization = !!(line.customization && line.customization.length > 0);
    const showBarcode = isActive || hasBarcode;
    const showCustomization = isActive || hasCustomization;
    const isReadOnlyDiscount = line.perLineDiscountType === 'loyalty' || line.perLineDiscountType === 'seasonal';
    const seasonal = line.perLineDiscountType === 'seasonal' ? applySeasonalForLine(line) : null;
    const showDiscountSelector = isActive || !!line.perLineDiscountType;
    const netAmount = line.netAmount || 0;
    const gstRate = line.gstRate ?? 0;
    const gstAmount = (line.cgstAmount || 0) + (line.sgstAmount || 0) + (line.igstAmount || 0);
    const discAmount = line.discountAmount || 0;
    const finalAmount = line.finalAmount || line.total || 0;

    return (
      <tr
        key={line.id}
        className={cn(
          'border-b border-border align-top transition-colors',
          isActive && 'bg-muted/30',
        )}
        onMouseEnter={() => setHoveredRowId(line.id)}
        onMouseLeave={() => setHoveredRowId((id) => (id === line.id ? null : id))}
        onFocusCapture={() => setFocusedRowId(line.id)}
        onBlurCapture={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!next || !(e.currentTarget as HTMLElement).contains(next)) {
            setFocusedRowId((id) => (id === line.id ? null : id));
          }
        }}
      >
        {/* Drag handle */}
        <td className="py-2 pl-2 pr-1 w-6 align-top">
          {isActive ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-grab mt-2"
              onClick={() => moveLine(idx, idx + 1)}
              title="Move down"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="h-4 w-4 mt-2" />
          )}
        </td>

        {/* Product cell */}
        <td className="py-2 pr-2 align-top">
          <div className="space-y-1">
            <ProductCombobox
              products={products}
              value={line.productId}
              selectedName={line.productName}
              onSelect={(id) => onProductSelect(line, id)}
              disabled={disabled}
            />

            <div className="flex items-center gap-2 px-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-[10px] bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground font-medium"
                    disabled={disabled}
                  >
                    GST {gstRate}%
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-xs">GST Rate</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={gstRate}
                        onChange={(e) => updateLine(line.id, { gstRate: Number(e.target.value) } as Partial<L>)}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="h-8"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Common</div>
                      <div className="flex gap-1">
                        {COMMON_GST_RATES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => updateLine(line.id, { gstRate: r } as Partial<L>)}
                            className={cn(
                              'h-7 px-2 text-xs rounded border border-border hover:bg-muted',
                              gstRate === r && 'bg-primary text-primary-foreground border-primary',
                            )}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {showBarcode && (
              <Input
                value={line.barcode || ''}
                onChange={(e) => onBarcodeChange(line, e.target.value)}
                placeholder="Barcode"
                className="h-6 text-xs font-mono border-transparent hover:border-input focus:border-input bg-transparent px-2"
                disabled={disabled}
              />
            )}
            {showCustomization && (
              <Textarea
                value={line.customization || ''}
                onChange={(e) => updateLine(line.id, { customization: e.target.value } as Partial<L>)}
                placeholder="Add customization..."
                rows={1}
                className="text-xs min-h-[24px] py-1 italic text-muted-foreground border-transparent hover:border-input focus:border-input bg-transparent px-2"
                disabled={disabled}
              />
            )}
          </div>
        </td>

        {/* Qty */}
        <td className="py-2 px-1 w-20 align-top">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={line.units ?? 0}
            onChange={(e) => updateLine(line.id, { units: Number(e.target.value), quantity: Number(e.target.value) } as Partial<L>)}
            className="h-8 text-center border-transparent hover:border-input focus:border-input bg-transparent"
            disabled={disabled}
          />
        </td>

        {/* Unit price */}
        <td className="py-2 px-1 w-[110px] align-top">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={line.unitPrice ?? 0}
            onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) } as Partial<L>)}
            className="h-8 text-right border-transparent hover:border-input focus:border-input bg-transparent"
            disabled={disabled}
          />
        </td>

        {/* Discount */}
        <td className="py-2 px-1 w-20 align-top">
          {!canDiscount ? (
            <div className="h-8 flex items-center justify-center text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="space-y-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.discountValue ?? 0}
                      readOnly={isReadOnlyDiscount}
                      onChange={(e) => updateLine(line.id, { discountValue: Number(e.target.value) } as Partial<L>)}
                      className="h-8 text-center border-transparent hover:border-input focus:border-input bg-transparent"
                      disabled={disabled}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Item discount %</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {showDiscountSelector && (
                <div className="flex gap-0.5 rounded border border-border overflow-hidden">
                  {LINE_DISCOUNT_OPTIONS.filter((o) => allowedTypes.includes(o.value)).map((o) => {
                    const active = (line.perLineDiscountType ?? 'item') === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          let discountValue = line.discountValue ?? 0;
                          if (o.value === 'seasonal') discountValue = applySeasonalForLine(line).discountValue;
                          updateLine(line.id, {
                            perLineDiscountType: o.value as LinePerLineDiscountType,
                            discountValue,
                          } as Partial<L>);
                        }}
                        className={cn(
                          'flex-1 text-[10px] py-0.5 transition-colors',
                          active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                        )}
                        disabled={disabled}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {seasonal?.name && (
                <div className="text-[10px] text-muted-foreground truncate px-1">{seasonal.name}</div>
              )}
            </div>
          )}
        </td>

        {/* Amount */}
        <td className="py-2 px-2 w-[100px] align-top text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 flex items-center justify-end font-medium text-sm cursor-help">
                  {formatINR(finalAmount)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between gap-4"><span>Net:</span><span>{formatINR(netAmount)}</span></div>
                  <div className="flex justify-between gap-4"><span>GST ({gstRate}%):</span><span>{formatINR(gstAmount)}</span></div>
                  <div className="flex justify-between gap-4"><span>Discount:</span><span>- {formatINR(discAmount)}</span></div>
                  <div className="flex justify-between gap-4 pt-0.5 border-t border-border font-semibold"><span>Total:</span><span>{formatINR(finalAmount)}</span></div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* Delete */}
        <td className="py-2 pl-1 pr-2 w-8 align-top">
          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeLine(line.id)}
              disabled={disabled}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Order Lines
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile card layout */}
        <div className="md:hidden px-3 pt-2 space-y-2">
          {lines.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              No lines yet. Tap "Add a product" below.
            </p>
          )}
          {lines.map((line) => {
            const finalAmount = line.finalAmount || line.total || 0;
            return (
              <div key={`m-${line.id}`} className="border rounded-md p-3 space-y-2 bg-card">
                <ProductCombobox
                  products={products}
                  value={line.productId}
                  selectedName={line.productName}
                  onSelect={(id) => onProductSelect(line, id)}
                  disabled={disabled}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                    <Input
                      type="number" min={0} step="0.01"
                      value={line.units ?? 0}
                      onChange={(e) => updateLine(line.id, { units: Number(e.target.value), quantity: Number(e.target.value) } as Partial<L>)}
                      className="h-9"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Unit Price</Label>
                    <Input
                      type="number" min={0} step="0.01"
                      value={line.unitPrice ?? 0}
                      onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) } as Partial<L>)}
                      className="h-9"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Discount %</Label>
                    <Input
                      type="number" min={0} step="0.01"
                      value={line.discountValue ?? 0}
                      onChange={(e) => updateLine(line.id, { discountValue: Number(e.target.value) } as Partial<L>)}
                      className="h-9"
                      disabled={disabled || !canDiscount}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">GST %</Label>
                    <Input
                      type="number" min={0} max={50}
                      value={line.gstRate ?? 0}
                      onChange={(e) => updateLine(line.id, { gstRate: Number(e.target.value) } as Partial<L>)}
                      className="h-9"
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Line total</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{formatINR(finalAmount)}</span>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLine(line.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="w-full overflow-x-auto hidden md:block">
          <table className="w-full min-w-[640px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: 24 }} />
              <col />
              <col style={{ width: 80 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 32 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className="pl-2 pr-1 py-2"></th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 pt-2 px-2">Product</th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 pt-2 px-1">Qty</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 pt-2 px-1">Unit Price</th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 pt-2 px-1">Disc.%</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 pt-2 px-2">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-6 text-sm">
                    No lines yet. Click "Add a product" below.
                  </td>
                </tr>
              )}
              {lines.map((line, idx) => renderRow(line, idx))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3">
            <button
              type="button"
              onClick={addLine}
              disabled={disabled}
              className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add a product
            </button>
          </div>

          {/* Summary */}
          <div className="px-4 pb-4">
            <div className="max-w-sm ml-auto space-y-1 text-sm">
              <SummaryRow label="Total Untaxed Amount" value={formatINR(totals.totalUntaxed)} />
              <div className="border-t border-border" />
              {gstType === 'cgst_sgst' ? (
                <>
                  <SummaryRow label={`CGST (${(summaryGstRate / 2) || 0}%)`} value={formatINR(totals.totalCGST)} muted />
                  <SummaryRow label={`SGST (${(summaryGstRate / 2) || 0}%)`} value={formatINR(totals.totalSGST)} muted />
                </>
              ) : (
                <SummaryRow label={`IGST (${summaryGstRate}%)`} value={formatINR(totals.totalIGST)} muted />
              )}
              <SummaryRow label="Total GST" value={formatINR(totals.totalGST)} />

              {canApplyOrderDiscount && (
                <>
                  <div className="border-t border-border" />
                  <div className="flex items-center justify-between py-1.5 gap-2">
                    <Label className="text-sm text-muted-foreground">Order Discount</Label>
                    <div className="flex items-center gap-1">
                      <Select
                        value={orderDiscountType ?? 'none'}
                        onValueChange={(v) =>
                          onOrderDiscountChange(v === 'none' ? null : (v as OrderDiscountType), v === 'none' ? 0 : orderDiscountValue)
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="amount">₹</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        value={orderDiscountValue || 0}
                        onChange={(e) => onOrderDiscountChange(orderDiscountType, Number(e.target.value))}
                        className="h-7 w-20 text-right text-sm"
                        disabled={disabled || !orderDiscountType}
                      />
                    </div>
                  </div>
                  {totals.orderDiscountAmount > 0 && (
                    <SummaryRow label="Discount" value={`- ${formatINR(totals.orderDiscountAmount)}`} muted />
                  )}
                </>
              )}

              {pointsAvailable > 0 && onPointsRedeemedChange && (
                <>
                  <div className="border-t border-border" />
                  <div className="flex items-center justify-between py-1 text-xs text-muted-foreground">
                    <span>Points Available</span>
                    <span>{pointsAvailable.toLocaleString('en-IN')} pts ({formatINR(pointsAvailable)})</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1">
                    <Label className="text-sm text-muted-foreground">Redeem</Label>
                    <Input
                      type="number"
                      min={0}
                      max={Math.min(pointsAvailable, Math.floor(totals.grandTotal * 0.2))}
                      value={pointsRedeemed || 0}
                      onChange={(e) =>
                        onPointsRedeemedChange(
                          Math.min(Number(e.target.value), pointsAvailable, Math.floor(totals.grandTotal * 0.2)),
                        )
                      }
                      className="h-7 w-24 text-right text-sm"
                      disabled={disabled}
                    />
                  </div>
                  {pointsRedeemed > 0 && <SummaryRow label="Points Redeemed" value={`- ${formatINR(pointsRedeemed)}`} muted />}
                </>
              )}

              <div className="border-t-2 border-border" />
              <div className="flex items-center justify-between pt-2 pb-1 text-base font-bold text-primary">
                <span>Grand Total</span>
                <span>{formatINR(grandAfterPoints)}</span>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-1.5', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}