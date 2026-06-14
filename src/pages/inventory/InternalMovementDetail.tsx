import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityChatter } from '@/components/shared/ActivityChatter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, ScanLine, Play, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useInternalMovement, useStartMovement, useCompleteMovement, useCancelMovement, useMovementQueueId } from '@/hooks/inventory/internalMovements';
import { MOVEMENT_TYPE_LABEL } from '@/lib/services/inventory/internalMovements';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

export default function InternalMovementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useInternalMovement(id);
  const { data: queueId } = useMovementQueueId(id);
  const startMut = useStartMovement();
  const completeMut = useCompleteMovement();
  const cancelMut = useCancelMovement();

  if (isLoading) return <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!data) return <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}><div className="p-6">Not found</div></AppLayout>;

  const { movement, items } = data;

  const handleComplete = async () => {
    try {
      await completeMut.mutateAsync(movement.id);
      toast({ title: 'Movement completed' });
    } catch (e: any) {
      toast({ title: 'Could not complete', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/internal-movements')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />Back
          </Button>
          <div className="flex items-center gap-2">
            {queueId && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/barcode/scan/${queueId}`)} className="gap-2">
                <ScanLine className="h-4 w-4" />Open in Barcode Module
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.open(`/print/internal_movement/${movement.id}`, '_blank')} className="gap-2">
              <Printer className="h-4 w-4" />Print
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{movement.movement_number}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">{MOVEMENT_TYPE_LABEL[movement.movement_type]}</div>
              </div>
              <Badge variant="outline" className="capitalize">{movement.status.replace('_',' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground">From</div><div className="capitalize">{movement.from_location_type ?? '—'}</div></div>
            <div><div className="text-muted-foreground">To</div><div className="capitalize">{movement.to_location_type ?? '—'}</div></div>
            {movement.reason && <div className="col-span-2"><div className="text-muted-foreground">Reason</div><div>{movement.reason}</div></div>}
            {movement.notes && <div className="col-span-2"><div className="text-muted-foreground">Notes</div><div>{movement.notes}</div></div>}
            <div><div className="text-muted-foreground">Created</div><div>{format(parseISO(movement.created_at), 'dd MMM yyyy, HH:mm')}</div></div>
            {movement.completed_at && <div><div className="text-muted-foreground">Completed</div><div>{format(parseISO(movement.completed_at), 'dd MMM yyyy, HH:mm')}</div></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Items ({items.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source Scan</TableHead>
                  <TableHead>Destination Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No items</TableCell></TableRow>
                ) : items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs">{it.serial_number}</TableCell>
                    <TableCell>{it.product?.name ?? it.product_id}</TableCell>
                    <TableCell>{it.scanned_at_source ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{it.scanned_at_destination ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          {movement.status === 'draft' && (
            <>
              <Button onClick={() => startMut.mutate(movement.id)} className="gap-2">
                <Play className="h-4 w-4" />Start Movement
              </Button>
              <Button variant="outline" onClick={() => cancelMut.mutate({ movementId: movement.id, reason: 'Cancelled by user' })} className="gap-2">
                <XCircle className="h-4 w-4" />Cancel
              </Button>
            </>
          )}
          {movement.status === 'in_progress' && (
            <Button onClick={handleComplete} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />Complete Movement
            </Button>
          )}
        </div>

        <ActivityChatter recordType="internal_movement" recordId={movement.id} />
      </div>
    </AppLayout>
  );
}