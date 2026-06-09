import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useDeliveryNote, useMarkDeliveryNoteDelivered } from '@/hooks/inventory/deliveryNotes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const statusVariant: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  confirmed: 'bg-primary/15 text-primary',
  delivered: 'bg-success text-success-foreground',
};

export default function DeliveryNoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: note, isLoading } = useDeliveryNote(id);
  const markDelivered = useMarkDeliveryNoteDelivered();

  if (isLoading || !note) {
    return (
      <AppLayout title="Delivery Notes" moduleNav={INVENTORY_NAV}>
        <div className="p-6">{isLoading ? 'Loading…' : 'Delivery note not found.'}</div>
      </AppLayout>
    );
  }

  const handleMarkDelivered = () => {
    markDelivered.mutate(note.id, {
      onSuccess: () => toast.success('Delivery complete. Stock updated.'),
      onError: (e: any) => toast.error(e?.message ?? 'Failed to mark as delivered'),
    });
  };

  return (
    <AppLayout title="Delivery Notes" subtitle={note.reference} moduleNav={INVENTORY_NAV}>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/delivery-notes')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{note.reference}</h1>
                <Badge className={statusVariant[note.status] ?? ''}>{note.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Created {format(parseISO(note.createdAt), 'MMM d, yyyy HH:mm')}
                {note.deliveryDate && ` · Delivered ${format(parseISO(note.deliveryDate), 'MMM d, yyyy HH:mm')}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`/inventory/delivery-notes/${note.id}/print`, '_blank')}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            {note.status !== 'delivered' && (
              <Button onClick={handleMarkDelivered} disabled={markDelivered.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {markDelivered.isPending ? 'Marking…' : 'Mark as Delivered'}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-xl">GLF — Delivery Note</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Reference</div>
              <div>{note.reference}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Delivery Date</div>
              <div>{note.deliveryDate ? format(parseISO(note.deliveryDate), 'MMM d, yyyy') : '—'}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Created By</div>
              <div className="font-mono text-xs">{note.createdBy ?? '—'}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">QC By</div>
              <div className="font-mono text-xs">{note.qcBy ?? '—'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="font-medium">{note.customerDeliveryName || '—'}</div>
            <div className="text-muted-foreground whitespace-pre-line">
              {note.customerDeliveryAddress || '—'}
            </div>
            {note.customerDeliveryPhone && (
              <div className="text-muted-foreground">Phone: {note.customerDeliveryPhone}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Products</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Serial Numbers</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {note.productsJson.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No products
                    </TableCell>
                  </TableRow>
                )}
                {note.productsJson.map((p, idx) => (
                  <TableRow key={`${p.product_id}-${idx}`}>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.serial_numbers.length ? p.serial_numbers.join(', ') : '—'}
                    </TableCell>
                    <TableCell>{p.warehouse_location || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}