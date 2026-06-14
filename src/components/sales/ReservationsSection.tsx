import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, PackagePlus } from 'lucide-react';
import type { SalesOrderLine } from '@/lib/data/sales/types';
import { useReservationsBySalesOrder, useReleaseReservation } from '@/hooks/inventory/reservations';
import { ReserveStockDialog } from './ReserveStockDialog';
import { useToast } from '@/hooks/use-toast';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';

interface Props {
  salesOrderId: string;
  lines: SalesOrderLine[];
}

export function ReservationsSection({ salesOrderId, lines }: Props) {
  const { data: reservations = [] } = useReservationsBySalesOrder(salesOrderId);
  const releaseMut = useReleaseReservation();
  const { toast } = useToast();
  const { isAdminOrSuper, hasAnyRole } = useRoleCheck();
  const canRelease = isAdminOrSuper || hasAnyRole(['warehouse_operator', 'sales_manager']);

  const [dialog, setDialog] = useState<{
    open: boolean; line?: SalesOrderLine;
  }>({ open: false });

  const reservedByLine = useMemo(() => {
    const map = new Map<string, number>();
    reservations
      .filter((r) => r.status === 'reserved')
      .forEach((r) => {
        const key = r.orderLineId || '';
        map.set(key, (map.get(key) ?? 0) + r.quantity);
      });
    return map;
  }, [reservations]);

  return (
    <Card>
      <CardHeader className="pb-3 p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageCheck className="h-4 w-4" /> Stock Reservation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No order lines yet.</p>
        ) : (
          <div className="space-y-2">
            {lines.map((line) => {
              const reservedQty = reservedByLine.get(line.id) ?? 0;
              const ordered = line.quantity || line.units || 0;
              const pending = Math.max(ordered - reservedQty, 0);
              const fully = reservedQty >= ordered && ordered > 0;
              return (
                <div
                  key={line.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{line.productName || 'Unnamed product'}</div>
                    <div className="text-xs text-muted-foreground">
                      Ordered: {ordered} · Reserved: {reservedQty} · Pending: {pending}
                    </div>
                  </div>
                  {fully ? (
                    <Badge className="bg-success/20 text-success border-success">Fully Reserved</Badge>
                  ) : reservedQty > 0 ? (
                    <Badge variant="outline" className="text-warning border-warning">Partial</Badge>
                  ) : (
                    <Badge variant="outline">Not Reserved</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!line.productId || pending <= 0}
                    onClick={() => setDialog({ open: true, line })}
                  >
                    <PackagePlus className="h-3.5 w-3.5 mr-1" /> Reserve
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {reservations.filter((r) => r.status === 'reserved').length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">Active reservations</div>
            <div className="space-y-1">
              {reservations.filter((r) => r.status === 'reserved').map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span>
                    Qty {r.quantity}
                    {r.serialNumberId && <span className="text-muted-foreground"> · serial {r.serialNumberId.slice(0, 8)}</span>}
                  </span>
                  {canRelease && (
                    <Button
                      size="sm" variant="ghost"
                      onClick={async () => {
                        try {
                          await releaseMut.mutateAsync(r.id);
                          toast({ title: 'Reservation released' });
                        } catch (e: any) {
                          toast({ title: 'Release failed', description: e?.message, variant: 'destructive' });
                        }
                      }}
                    >
                      Release
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {dialog.line && (
        <ReserveStockDialog
          open={dialog.open}
          onOpenChange={(o) => setDialog({ open: o, line: o ? dialog.line : undefined })}
          salesOrderId={salesOrderId}
          orderLineId={dialog.line.id}
          productId={dialog.line.productId}
          productName={dialog.line.productName}
          orderedQty={dialog.line.quantity || dialog.line.units || 0}
        />
      )}
    </Card>
  );
}

/** Computes the order-level reservation status from order lines + reservations. */
export function useOrderReservationBadge(
  salesOrderId: string | undefined,
  lines: SalesOrderLine[],
): 'fully' | 'partial' | 'none' {
  const { data: reservations = [] } = useReservationsBySalesOrder(salesOrderId);
  return useMemo(() => {
    if (lines.length === 0) return 'none';
    const map = new Map<string, number>();
    reservations.filter((r) => r.status === 'reserved').forEach((r) => {
      const key = r.orderLineId || '';
      map.set(key, (map.get(key) ?? 0) + r.quantity);
    });
    let totalOrdered = 0;
    let totalReserved = 0;
    for (const l of lines) {
      const ordered = l.quantity || l.units || 0;
      totalOrdered += ordered;
      totalReserved += Math.min(map.get(l.id) ?? 0, ordered);
    }
    if (totalReserved === 0) return 'none';
    if (totalReserved >= totalOrdered) return 'fully';
    return 'partial';
  }, [lines, reservations]);
}