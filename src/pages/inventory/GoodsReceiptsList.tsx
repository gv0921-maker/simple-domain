import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useGoodsReceipts } from '@/hooks/inventory/goodsReceipts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  quantity_pending: 'bg-accent text-accent-foreground',
  labels_pending: 'bg-warning/15 text-warning',
  qc_pending: 'bg-primary/15 text-primary',
  completed: 'bg-success/15 text-success-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};

const DISC_STYLES: Record<string, string> = {
  matched: 'bg-success/15 text-success-foreground',
  quantity_mismatch: 'bg-warning/15 text-warning',
  product_mismatch: 'bg-destructive/15 text-destructive',
  both_mismatch: 'bg-destructive/15 text-destructive',
};

export default function GoodsReceiptsList() {
  const navigate = useNavigate();
  const { data: receipts = [], isLoading } = useGoodsReceipts();

  return (
    <AppLayout title="Goods Receipts" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Goods Receipts</h1>
          <Button onClick={() => navigate('/inventory/goods-receipts/new')}>
            <Plus className="h-4 w-4 mr-2" /> New Goods Receipt
          </Button>
        </div>

        <div className="rounded border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GR #</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Discrepancy</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : receipts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No goods receipts yet</TableCell></TableRow>
              ) : receipts.map(r => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/inventory/goods-receipts/${r.id}`)}>
                  <TableCell className="font-mono">{r.gr_number}</TableCell>
                  <TableCell>
                    <span className="text-sm">{r.source_type.replace('_', ' ')}</span>
                    {r.source_document_reference && (
                      <div className="text-xs text-muted-foreground">{r.source_document_reference}</div>
                    )}
                  </TableCell>
                  <TableCell><Badge className={STATUS_STYLES[r.status] ?? ''}>{r.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell><Badge className={DISC_STYLES[r.discrepancy_status] ?? ''}>{r.discrepancy_status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{r.labels_generated ? <Badge>Generated</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  <TableCell className="text-sm">{format(parseISO(r.created_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/inventory/goods-receipts/${r.id}`); }}>
                      <Eye className="h-4 w-4" />
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