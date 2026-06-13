import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Truck, Printer, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  useInvoiceDeliverySummary,
  useDeliveryNotesForInvoice,
  useCreatePartialDeliveryNote,
  useAvailableSerialsForSO,
} from '@/hooks/sales/deliveryNotes';
import type { DeliveryLineInput } from '@/lib/services/sales/deliveryNotes';
import { format, parseISO } from 'date-fns';

interface Props {
  invoiceId: string;
  salesOrderId: string | null | undefined;
  invoiceStatus: string;
}

interface DraftLine {
  invoice_line_id: string;
  product_id: string | null;
  product: string;
  qty_remaining: number;
  qty_to_deliver: number;
  selected_serials: string[];
}

function SerialPicker({
  salesOrderId, productId, value, onChange, max,
}: {
  salesOrderId: string; productId: string | null;
  value: string[]; onChange: (next: string[]) => void; max: number;
}) {
  const { data: serials = [], isLoading } = useAvailableSerialsForSO(salesOrderId, productId ?? undefined);
  if (!productId) return <div className="text-xs text-muted-foreground">No product</div>;
  if (isLoading) return <div className="text-xs text-muted-foreground">Loading serials…</div>;
  if (serials.length === 0) {
    return <div className="text-xs text-muted-foreground">No reserved serials available</div>;
  }
  const toggle = (sn: string) => {
    if (value.includes(sn)) onChange(value.filter((v) => v !== sn));
    else if (value.length < max) onChange([...value, sn]);
    else toast.error(`You can only select ${max} serial${max === 1 ? '' : 's'}`);
  };
  return (
    <div className="flex flex-wrap gap-1.5 max-w-xs">
      {serials.map((sn) => {
        const sel = value.includes(sn);
        return (
          <button
            key={sn}
            type="button"
            onClick={() => toggle(sn)}
            className={`text-xs px-2 py-0.5 rounded border font-mono ${
              sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'
            }`}
          >
            {sn}
          </button>
        );
      })}
    </div>
  );
}

export function InvoiceDeliverySection({ invoiceId, salesOrderId, invoiceStatus }: Props) {
  const navigate = useNavigate();
  const { data: summary } = useInvoiceDeliverySummary(invoiceId);
  const { data: dns = [] } = useDeliveryNotesForInvoice(invoiceId);
  const createDN = useCreatePartialDeliveryNote(invoiceId);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftLine[]>([]);

  const remainingLines = useMemo(
    () => (summary?.line_summary ?? []).filter((l) => l.qty_remaining > 0),
    [summary],
  );

  const openDialog = () => {
    setDraft(
      remainingLines.map((l) => ({
        invoice_line_id: l.line_id,
        product_id: l.product_id,
        product: l.product,
        qty_remaining: l.qty_remaining,
        qty_to_deliver: 0,
        selected_serials: [],
      })),
    );
    setOpen(true);
  };

  const setLine = (idx: number, patch: Partial<DraftLine>) => {
    setDraft((cur) => cur.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const deliverAll = () => {
    setDraft((cur) => cur.map((l) => ({ ...l, qty_to_deliver: l.qty_remaining })));
  };

  const totalToDeliver = draft.reduce((s, l) => s + (l.qty_to_deliver || 0), 0);

  const handleGenerate = async () => {
    const lineItems: DeliveryLineInput[] = draft
      .filter((l) => (l.qty_to_deliver || 0) > 0)
      .map((l) => ({
        invoice_line_id: l.invoice_line_id,
        quantity_to_deliver: l.qty_to_deliver,
        serial_numbers: l.selected_serials,
      }));
    if (lineItems.length === 0) {
      toast.error('Enter quantity to deliver for at least one line');
      return;
    }
    for (const li of lineItems) {
      if (li.serial_numbers.length > 0 && li.serial_numbers.length !== li.quantity_to_deliver) {
        toast.error('Select exactly the serial count matching qty for each line');
        return;
      }
    }
    try {
      const dnId = await createDN.mutateAsync(lineItems);
      toast.success('Delivery note created');
      setOpen(false);
      window.open(`/print/delivery_note/${dnId}`, '_blank');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create delivery note');
    }
  };

  if (!summary) return null;
  const pct = summary.total_invoiced_qty > 0
    ? Math.round((summary.total_delivered_qty / summary.total_invoiced_qty) * 100)
    : 0;
  const canCreate = summary.balance_to_deliver > 0 && invoiceStatus !== 'cancelled';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" /> Delivery
          </CardTitle>
          {canCreate && (
            <Button size="sm" onClick={openDialog}>Create Delivery Note</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3 text-sm">
          <Stat label="Invoiced" value={`${summary.total_invoiced_qty} items`} />
          <Stat label="Delivered" value={`${summary.total_delivered_qty} (${pct}%)`} />
          <Stat label="Balance" value={`${summary.balance_to_deliver}`} />
          <Stat label="DN Count" value={`${summary.dn_count}`} />
        </div>
        <Progress value={pct} />

        {dns.length > 0 && (
          <div className="rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DN #</TableHead>
                  <TableHead>Seq</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dns.map((dn: any) => (
                  <TableRow key={dn.id} className="cursor-pointer" onClick={() => navigate(`/inventory/delivery-notes/${dn.id}`)}>
                    <TableCell className="font-medium">{dn.reference}</TableCell>
                    <TableCell>
                      {dn.dn_sequence_in_invoice}
                      {dn.is_partial && <Badge className="ml-2" variant="secondary">Partial</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{dn.status}</Badge></TableCell>
                    <TableCell>{dn.customer_signature_received ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{dn.delivered_at ? format(parseISO(dn.delivered_at), 'MMM d, yyyy') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost"
                        onClick={(e) => { e.stopPropagation(); window.open(`/print/delivery_note/${dn.id}`, '_blank'); }}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/inventory/delivery-notes/${dn.id}`); }}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Delivery Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={draft.length > 0 && draft.every((l) => l.qty_to_deliver === l.qty_remaining)}
                  onCheckedChange={(v) => v ? deliverAll() : setDraft((c) => c.map((l) => ({ ...l, qty_to_deliver: 0, selected_serials: [] })))}
                />
                Deliver all remaining items
              </Label>
              <div className="text-sm text-muted-foreground">Total: {totalToDeliver} item(s)</div>
            </div>
            <div className="rounded border max-h-[55vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="w-28">Qty</TableHead>
                    <TableHead>Serials</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draft.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No items remaining to deliver</TableCell></TableRow>
                  )}
                  {draft.map((l, i) => (
                    <TableRow key={l.invoice_line_id}>
                      <TableCell className="font-medium">{l.product}</TableCell>
                      <TableCell className="text-right">{l.qty_remaining}</TableCell>
                      <TableCell>
                        <Input
                          type="number" min={0} max={l.qty_remaining}
                          value={l.qty_to_deliver}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(l.qty_remaining, Number(e.target.value) || 0));
                            setLine(i, { qty_to_deliver: v, selected_serials: l.selected_serials.slice(0, v) });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {salesOrderId && l.qty_to_deliver > 0 ? (
                          <SerialPicker
                            salesOrderId={salesOrderId}
                            productId={l.product_id}
                            value={l.selected_serials}
                            onChange={(next) => setLine(i, { selected_serials: next })}
                            max={l.qty_to_deliver}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={createDN.isPending || totalToDeliver === 0}>
              {createDN.isPending ? 'Generating…' : 'Generate Delivery Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-2 bg-muted/30">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}