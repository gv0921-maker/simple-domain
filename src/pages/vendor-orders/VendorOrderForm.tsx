import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { VENDOR_ORDERS_NAV } from '@/lib/navigation/vendorOrders';
import { useVendors } from '@/hooks/vendors';
import { useProducts } from '@/hooks/inventory';
import { useCreateVendorOrder } from '@/hooks/vendor-orders';
import { validateSOLinkedEta, type CreateVOLineInput, type VOMode } from '@/lib/services/vendor-orders';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LineDraft extends CreateVOLineInput { _key: string; }

export default function VendorOrderForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const linkedSOId = params.get('sales_order') || null;
  const linkedSOLineId = params.get('sales_order_line') || null;

  const [vendorId, setVendorId] = useState('');
  const [mode, setMode] = useState<VOMode>(linkedSOId ? 'individual' : 'bulk');
  const [eta, setEta] = useState('');
  const [notes, setNotes] = useState('');
  const [etaWarning, setEtaWarning] = useState<string | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([
    { _key: crypto.randomUUID(), product_id: '', quantity_ordered: 1 },
  ]);

  const { data: vendors = [] } = useVendors(true);
  const { data: products = [] } = useProducts();
  const createMut = useCreateVendorOrder();

  // Pre-fill from linked SO line
  useEffect(() => {
    if (!linkedSOLineId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('order_lines')
        .select('product_id, quantity, customization_notes, size_spec, colour_polish_spec, fabric_spec')
        .eq('id', linkedSOLineId)
        .maybeSingle();
      if (data) {
        setLines([{
          _key: crypto.randomUUID(),
          product_id: data.product_id,
          quantity_ordered: Number(data.quantity) || 1,
          size_spec: data.size_spec ?? null,
          colour_polish_spec: data.colour_polish_spec ?? null,
          fabric_spec: data.fabric_spec ?? null,
          customization_notes: data.customization_notes ?? null,
        }]);
      }
    })();
  }, [linkedSOLineId]);

  // Validate ETA against linked SO
  useEffect(() => {
    if (!linkedSOId || !eta) { setEtaWarning(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await validateSOLinkedEta(linkedSOId, eta);
        if (cancelled) return;
        setEtaWarning(res.ok ? null : `ETA should be on or before ${res.recommended_eta ?? '—'} (SO ETA ${res.so_eta ?? '—'}).`);
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [linkedSOId, eta]);

  const valid = useMemo(() => {
    return !!vendorId && !!eta && lines.length > 0 && lines.every(l => l.product_id && l.quantity_ordered > 0);
  }, [vendorId, eta, lines]);

  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, ...patch } : l));
  const addLine = () => setLines(prev => [...prev, { _key: crypto.randomUUID(), product_id: '', quantity_ordered: 1 }]);
  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key));

  const onSubmit = async () => {
    if (!valid) { toast({ title: 'Fill all required fields', variant: 'destructive' }); return; }
    try {
      const id = await createMut.mutateAsync({
        vendor_id: vendorId,
        order_mode: mode,
        eta_date: eta,
        notes: notes || null,
        linked_sales_order_id: linkedSOId,
        linked_sales_order_line_id: linkedSOLineId,
        lines: lines.map(({ _key, ...rest }) => rest),
      });
      toast({ title: 'Draft created' });
      navigate(`/vendor-orders/${id}`);
    } catch (e: any) {
      toast({ title: 'Could not create', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Vendor Orders" moduleNav={VENDOR_ORDERS_NAV}>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendor-orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-xl font-semibold">New Vendor Order</div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order Mode *</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as VOMode)} disabled={!!linkedSOId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual (SO-linked)</SelectItem>
                    <SelectItem value="bulk">Bulk (stock replenishment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ETA *</Label>
                <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
                {etaWarning && <p className="text-xs text-amber-700 mt-1">{etaWarning}</p>}
              </div>
              {linkedSOId && (
                <div>
                  <Label>Linked Sales Order</Label>
                  <Input value={linkedSOId} readOnly />
                </div>
              )}
            </div>
            <div>
              <Label>Notes / Terms</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lines</CardTitle>
            <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-4 w-4 mr-1" /> Add Line</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-24 text-right">Qty</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Colour / Polish</TableHead>
                  <TableHead>Fabric</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(l => (
                  <TableRow key={l._key}>
                    <TableCell>
                      <Select value={l.product_id} onValueChange={(v) => updateLine(l._key, { product_id: v })}>
                        <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={1} value={l.quantity_ordered}
                        onChange={(e) => updateLine(l._key, { quantity_ordered: Number(e.target.value) || 1 })} />
                    </TableCell>
                    <TableCell><Input value={l.size_spec ?? ''} onChange={(e) => updateLine(l._key, { size_spec: e.target.value || null })} placeholder="" /></TableCell>
                    <TableCell><Input value={l.colour_polish_spec ?? ''} onChange={(e) => updateLine(l._key, { colour_polish_spec: e.target.value || null })} placeholder="" /></TableCell>
                    <TableCell><Input value={l.fabric_spec ?? ''} onChange={(e) => updateLine(l._key, { fabric_spec: e.target.value || null })} placeholder="" /></TableCell>
                    <TableCell><Input value={l.customization_notes ?? ''} onChange={(e) => updateLine(l._key, { customization_notes: e.target.value || null })} placeholder="" /></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeLine(l._key)} disabled={lines.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/vendor-orders')}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!valid || createMut.isPending}>
            {createMut.isPending ? 'Saving…' : 'Save Draft'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}