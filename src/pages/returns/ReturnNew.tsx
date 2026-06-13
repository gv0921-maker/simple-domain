import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RETURNS_NAV } from '@/lib/navigation/returns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, AlertTriangle } from 'lucide-react';
import { useReturnableItemsForInvoice, useCreateReturnRequest, useUploadReturnPhoto, useSubmitReturnForApproval } from '@/hooks/returns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const REASONS = [
  'Defective Product',
  'Wrong Product Delivered',
  'Customer Dissatisfied',
  'Damaged on Delivery',
  'Other',
];

function useInvoicesSearch(term: string) {
  return useQuery({
    queryKey: ['returns-invoice-search', term],
    queryFn: async () => {
      if (term.trim().length < 1) return [] as Array<{ id: string; reference: string; customer_name: string | null }>;
      const { data } = await (supabase as any)
        .from('invoices')
        .select('id, reference, sales_order:sales_orders!invoices_sales_order_id_fkey(billing_customer_name)')
        .ilike('reference', `%${term}%`)
        .limit(20);
      return ((data ?? []) as any[]).map((d) => ({
        id: d.id,
        reference: d.reference,
        customer_name: d.sales_order?.billing_customer_name ?? null,
      }));
    },
  });
}

export default function ReturnNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [invoiceId, setInvoiceId] = useState<string | null>(params.get('invoice') ?? null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const { data: invoiceResults = [] } = useInvoicesSearch(invoiceSearch);
  const { data: items = [], isLoading: itemsLoading } = useReturnableItemsForInvoice(invoiceId);
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const create = useCreateReturnRequest();
  const submit = useSubmitReturnForApproval();
  const upload = useUploadReturnPhoto();

  const eligibleSelected = useMemo(
    () => items.filter((i) => selectedSerials.has(i.serial_id) && !i.is_customized && !i.already_returned),
    [items, selectedSerials],
  );

  const toggle = (sid: string) => {
    setSelectedSerials((s) => {
      const ns = new Set(s);
      if (ns.has(sid)) ns.delete(sid); else ns.add(sid);
      return ns;
    });
  };

  const onSubmit = async (submitForApproval: boolean) => {
    if (!invoiceId) return;
    if (eligibleSelected.length === 0) {
      toast.error('Select at least one eligible item');
      return;
    }
    if (!reason) {
      toast.error('Select a reason');
      return;
    }
    try {
      const rtId = await create.mutateAsync({
        invoiceId,
        items: eligibleSelected.map((i) => ({ serial_id: i.serial_id, qty: 1 })),
        reason,
        issueDescription: description.trim() || null,
      });
      for (const f of photoFiles) {
        await upload.mutateAsync({ rtId, file: f, type: 'customer' });
      }
      if (submitForApproval) {
        await submit.mutateAsync(rtId);
      }
      toast.success(submitForApproval ? 'Return submitted for approval' : 'Draft saved');
      navigate(`/returns/${rtId}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create return');
    }
  };

  return (
    <AppLayout title="Returns" subtitle="New Return" moduleNav={RETURNS_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/returns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">New Return Request</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 text-sm">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 1 — Source Invoice</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Search invoice by number</Label>
              <Input
                placeholder="INV-…"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
              {invoiceResults.length > 0 && (
                <div className="border rounded-md max-h-64 overflow-auto">
                  {invoiceResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setInvoiceId(r.id); setInvoiceSearch(r.reference); }}
                      className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-muted ${invoiceId === r.id ? 'bg-muted' : ''}`}
                    >
                      <div className="font-medium">{r.reference}</div>
                      <div className="text-xs text-muted-foreground">{r.customer_name ?? '—'}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button disabled={!invoiceId} onClick={() => setStep(2)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 2 — Select Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {itemsLoading && <div className="text-muted-foreground">Loading invoice items…</div>}
              {!itemsLoading && items.length === 0 && (
                <div className="text-muted-foreground text-sm">
                  No deliverable items found for this invoice.
                </div>
              )}
              {items.map((i) => {
                const disabled = i.is_customized || i.already_returned;
                return (
                  <div
                    key={i.serial_id}
                    className={`flex items-start gap-3 border rounded-md p-3 ${disabled ? 'opacity-60 bg-muted/40' : ''}`}
                  >
                    <Checkbox
                      checked={selectedSerials.has(i.serial_id)}
                      disabled={disabled}
                      onCheckedChange={() => toggle(i.serial_id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{i.product_name}</div>
                      <div className="text-xs text-muted-foreground">Serial: {i.serial_number} · ₹{i.unit_price.toLocaleString('en-IN')}</div>
                      {i.is_customized && i.customization_details && (
                        <div className="mt-2 text-xs text-destructive flex items-start gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>
                            This item has customization (
                            {Object.entries(i.customization_details)
                              .filter(([, v]) => v && String(v).trim() !== '')
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                            ) and cannot be returned. Customized products are non-returnable per GLF policy.
                          </span>
                        </div>
                      )}
                      {i.already_returned && !i.is_customized && (
                        <Badge variant="outline" className="mt-1 text-xs">Already returned or unavailable</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={eligibleSelected.length === 0} onClick={() => setStep(3)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 3 — Reason & Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label>Customer Photos (max 10)</Label>
                <label className="mt-1 flex items-center gap-2 border border-dashed rounded-md p-3 cursor-pointer hover:bg-muted/40">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Click to upload images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fl = Array.from(e.target.files ?? []).slice(0, 10);
                      setPhotoFiles(fl);
                    }}
                  />
                </label>
                {photoFiles.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">{photoFiles.length} file(s) selected</div>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button disabled={!reason} onClick={() => setStep(4)}>Review</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 4 — Review & Submit</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Reason:</span> {reason}</div>
              {description && <div><span className="text-muted-foreground">Description:</span> {description}</div>}
              <div>
                <div className="text-muted-foreground mb-1">{eligibleSelected.length} item(s):</div>
                <ul className="list-disc pl-5">
                  {eligibleSelected.map((i) => (
                    <li key={i.serial_id}>{i.product_name} — {i.serial_number}</li>
                  ))}
                </ul>
              </div>
              {photoFiles.length > 0 && (
                <div><span className="text-muted-foreground">Photos:</span> {photoFiles.length}</div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={create.isPending} onClick={() => onSubmit(false)}>
                    Save as Draft
                  </Button>
                  <Button disabled={create.isPending} onClick={() => onSubmit(true)}>
                    {create.isPending ? 'Submitting…' : 'Submit for Approval'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}