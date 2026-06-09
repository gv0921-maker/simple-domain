import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useDeliveryNotes } from '@/hooks/inventory/deliveryNotes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Printer, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusVariant: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  confirmed: 'bg-primary/15 text-primary',
  delivered: 'bg-success text-success-foreground',
};

export default function DeliveryNotesList() {
  const navigate = useNavigate();
  const { data: notes = [], isLoading } = useDeliveryNotes();

  return (
    <AppLayout title="Delivery Notes" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Delivery Notes</h1>
        </div>

        <div className="rounded border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && notes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No delivery notes yet
                  </TableCell>
                </TableRow>
              )}
              {notes.map((n) => (
                <TableRow key={n.id} className="cursor-pointer" onClick={() => navigate(`/inventory/delivery-notes/${n.id}`)}>
                  <TableCell className="font-medium">{n.reference}</TableCell>
                  <TableCell>{n.customerDeliveryName || '—'}</TableCell>
                  <TableCell>
                    {n.deliveryDate
                      ? format(parseISO(n.deliveryDate), 'MMM d, yyyy')
                      : format(parseISO(n.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusVariant[n.status] ?? ''}>{n.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory/delivery-notes/${n.id}`)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/inventory/delivery-notes/${n.id}/print`, '_blank')}>
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}