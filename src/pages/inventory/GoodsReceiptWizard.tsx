import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { INVENTORY_NAV } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, ArrowLeft, ArrowRight, Plus, Printer, ShieldCheck, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { useProducts, useWarehouses } from '@/hooks/inventory';
import {
  useGoodsReceipt, useCreateGoodsReceipt, useUpdateReceivedQuantities,
  useApproveDiscrepancy, useGenerateSerialsForLine, useMarkLabelsGenerated,
  useCompleteGRLineQC,
} from '@/hooks/inventory/goodsReceipts';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useCorrectionOrderForGR } from '@/hooks/inventory/correctionOrders';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { recordLabelPrints, generateLabel } from '@/lib/services/barcode/api';
import type { GoodsReceiptSerial, GRSourceType } from '@/lib/services/inventory/goodsReceipt';

type DraftLine = {
  product_id: string;
  product_name: string;
  product_sku: string;
  expected_quantity: number;
};

export default function GoodsReceiptWizard() {
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: detail } = useGoodsReceipt(id);
  const { isAdmin } = useIsSuperAdmin();

  const createGR = useCreateGoodsReceipt();
  const updateQty = useUpdateReceivedQuantities(id ?? '');
  const approveDisc = useApproveDiscrepancy(id ?? '');
  const genSerials = useGenerateSerialsForLine(id ?? '');
  const markLabels = useMarkLabelsGenerated(id ?? '');
  const completeQC = useCompleteGRLineQC(id ?? '');

  // STEP 1: source selection state
  const [sourceType, setSourceType] = useState<GRSourceType>('manual');
  const [sourceRef, setSourceRef] = useState('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);

  // Workorders for source dropdown
  const [workOrders, setWorkOrders] = useState<Array<{ id: string; reference: string }>>([]);
  useEffect(() => {
    if (sourceType !== 'work_order' || isEdit) return;
    supabase.from('work_orders' as any).select('id, reference, state').eq('state', 'in_progress').then(({ data }) => {
      setWorkOrders((data ?? []) as any);
    });
  }, [sourceType, isEdit]);

  const addLine = () => setDraftLines([...draftLines, { product_id: '', product_name: '', product_sku: '', expected_quantity: 1 }]);
  const updateDraftLine = (i: number, patch: Partial<DraftLine>) => {
    const next = [...draftLines];
    next[i] = { ...next[i], ...patch };
    setDraftLines(next);
  };
  const removeDraftLine = (i: number) => setDraftLines(draftLines.filter((_, idx) => idx !== i));

  const handleCreate = async () => {
    if (draftLines.length === 0 || draftLines.some(l => !l.product_id || l.expected_quantity <= 0)) {
      toast.error('Add at least one line with a product and quantity > 0');
      return;
    }
    try {
      const gr = await createGR.mutateAsync({
        source_type: sourceType,
        source_document_id: null,
        source_document_reference: sourceRef || null,
        warehouse_id: warehouseId || null,
        lines: draftLines.map(l => ({
          product_id: l.product_id,
          product_name: l.product_name,
          product_sku: l.product_sku,
          expected_quantity: l.expected_quantity,
          received_quantity: l.expected_quantity,
        })),
      });
      toast.success(`Created ${gr.gr_number}`);
      navigate(`/inventory/goods-receipts/${gr.id}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create');
    }
  };

  // EDIT MODE — wizard step driven by GR status
  if (isEdit && !detail?.gr) {
    return <AppLayout title="Goods Receipt" moduleNav={INVENTORY_NAV}><div className="p-6">Loading…</div></AppLayout>;
  }

  if (!isEdit) {
    return (
      <AppLayout title="New Goods Receipt" moduleNav={INVENTORY_NAV}>
        <div className="p-6 max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">New Goods Receipt — Step 1: Source</h1>
            <Button variant="ghost" onClick={() => navigate('/inventory/goods-receipts')}><X className="h-4 w-4 mr-1" /> Cancel</Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Receive Against</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={sourceType} onValueChange={(v) => setSourceType(v as GRSourceType)} className="flex gap-6">
                <div className="flex items-center gap-2"><RadioGroupItem value="vendor_order" id="vo" /><Label htmlFor="vo">Vendor Order</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="work_order" id="wo" /><Label htmlFor="wo">Work Order</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="manual" id="man" /><Label htmlFor="man">Manual</Label></div>
              </RadioGroup>

              {sourceType === 'vendor_order' && (
                <div>
                  <Label>Vendor Order Reference</Label>
                  <Input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="" />
                </div>
              )}
              {sourceType === 'work_order' && (
                <div>
                  <Label>Work Order</Label>
                  <Select value={sourceRef} onValueChange={setSourceRef}>
                    <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                    <SelectContent>
                      {workOrders.map(w => <SelectItem key={w.id} value={w.reference ?? w.id}>{w.reference ?? w.id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Receiving Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expected Items</CardTitle>
              <Button size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-1" /> Add Line</Button>
            </CardHeader>
            <CardContent>
              {draftLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add the items expected on this receipt.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="w-32">Expected Qty</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {draftLines.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Select value={l.product_id} onValueChange={(v) => {
                            const p = products.find(p => p.id === v);
                            updateDraftLine(i, { product_id: v, product_name: p?.name ?? '', product_sku: p?.sku ?? '' });
                          }}>
                            <SelectTrigger><SelectValue placeholder="" /></SelectTrigger>
                            <SelectContent>
                              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={l.expected_quantity}
                            onChange={(e) => updateDraftLine(i, { expected_quantity: parseInt(e.target.value, 10) || 0 })} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeDraftLine(i)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={createGR.isPending}>
              Create Receipt <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // EDIT MODE
  const gr = detail!.gr!;
  const lines = detail!.lines;
  const serials = detail!.serials;

  // Step driven by status
  const stepIndex =
    gr.status === 'completed' || gr.status === 'cancelled' ? 4 :
    gr.status === 'qc_pending' ? 3 :
    gr.status === 'labels_pending' ? 2 : 1;

  return (
    <AppLayout title={`Goods Receipt ${gr.gr_number}`} moduleNav={INVENTORY_NAV}>
      <div className="p-6 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/goods-receipts')}><ArrowLeft className="h-4 w-4" /></Button>
              <h1 className="text-2xl font-semibold">{gr.gr_number}</h1>
              <Badge>{gr.status.replace('_', ' ')}</Badge>
              {gr.discrepancy_status !== 'matched' && <Badge variant="destructive">{gr.discrepancy_status.replace('_', ' ')}</Badge>}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Source: {gr.source_type.replace('_', ' ')}{gr.source_document_reference ? ` — ${gr.source_document_reference}` : ''}
            </div>
          </div>
        </div>

        <StepBar current={stepIndex} />

        {stepIndex === 1 && (
          <Step2QuantityVerification
            grId={gr.id}
            discrepancyStatus={gr.discrepancy_status}
            discrepancyApprovedAt={gr.discrepancy_approved_at}
            lines={lines}
            isAdmin={isAdmin}
            onSave={async (updates) => { await updateQty.mutateAsync(updates); }}
            onApprove={async (reason) => { await approveDisc.mutateAsync(reason); toast.success('Discrepancy approved'); }}
            onNext={async () => {
              const needsApproval = gr.discrepancy_status !== 'matched' && !gr.discrepancy_approved_at;
              if (needsApproval) { toast.error('Discrepancy must be approved first'); return; }
              if (gr.status === 'quantity_pending') {
                await supabase.from('goods_receipts' as any).update({ status: 'labels_pending' }).eq('id', gr.id);
              }
              toast.success('Moved to Labels step');
              window.location.reload();
            }}
          />
        )}

        {stepIndex === 2 && (
          <Step3Labels
            grId={gr.id}
            lines={lines}
            serials={serials}
            onGenerate={async (lineId) => { await genSerials.mutateAsync(lineId); toast.success('Serials generated'); }}
            onPrint={async () => {
              for (const s of serials) {
                // ensure each label is recorded
              }
              const labels = serials.map(s => {
                const ln = lines.find(l => l.id === s.goods_receipt_line_id);
                return {
                  productId: s.product_id,
                  productSku: ln?.product_sku_cached ?? '',
                  productName: ln?.product_name_cached ?? '',
                  serialNumber: s.serial_number,
                  barcodeValue: s.barcode_value,
                  format: 'standard' as const,
                };
              });
              try {
                await recordLabelPrints(labels, gr.id);
              } catch { /* ignore duplicate */ }
              window.open(`/barcode/labels?gr=${gr.id}`, '_blank');
            }}
            onConfirm={async () => { await markLabels.mutateAsync(); toast.success('Labels confirmed — proceed to QC'); }}
          />
        )}

        {stepIndex === 3 && (
          <Step4QC
            grId={gr.id}
            lines={lines}
            serials={serials}
            onComplete={async (lineId, passed, failed, notes) => {
              await completeQC.mutateAsync({ lineId, passedSerialIds: passed, failedSerialIds: failed, failedNotes: notes });
              toast.success('QC completed for line');
            }}
          />
        )}

        {stepIndex === 4 && (
          <Card>
            <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {id && <CorrectionOrderBanner grId={id} />}
              <p className="text-sm text-muted-foreground">This goods receipt is complete.</p>
              <div className="text-sm">
                Accepted: <strong>{lines.reduce((s, l) => s + l.accepted_quantity, 0)}</strong>{' '}
                · Under Correction: <strong>{lines.reduce((s, l) => s + l.under_correction_quantity, 0)}</strong>{' '}
                · Rejected: <strong>{lines.reduce((s, l) => s + l.rejected_quantity, 0)}</strong>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function StepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = ['Source', 'Quantity', 'Labels', 'QC'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, idx) => {
        const n = (idx + 1) as 1 | 2 | 3 | 4;
        const active = n === current;
        const done = n < current;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${active ? 'bg-primary text-primary-foreground' : done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>{n}</div>
            <span className={`text-sm ${active ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {idx < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function CorrectionOrderBanner({ grId }: { grId: string }) {
  const { data: co } = useCorrectionOrderForGR(grId);
  if (!co) return null;
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Correction Order {co.co_number} created</AlertTitle>
      <AlertDescription>
        QC failures from this receipt were sent to a correction order.{' '}
        <Link to={`/inventory/correction-orders/${co.id}`} className="underline text-primary">
          Open correction order
        </Link>
      </AlertDescription>
    </Alert>
  );
}

function Step2QuantityVerification({
  grId, lines, discrepancyStatus, discrepancyApprovedAt, isAdmin, onSave, onApprove, onNext,
}: {
  grId: string;
  lines: Array<{ id: string; product_name_cached: string | null; product_sku_cached: string | null; expected_quantity: number; received_quantity: number; }>;
  discrepancyStatus: string;
  discrepancyApprovedAt: string | null;
  isAdmin: boolean;
  onSave: (updates: Array<{ id: string; received_quantity: number }>) => Promise<void>;
  onApprove: (reason: string) => Promise<void>;
  onNext: () => Promise<void>;
}) {
  const [local, setLocal] = useState(() => lines.map(l => ({ id: l.id, qty: l.received_quantity })));
  useEffect(() => { setLocal(lines.map(l => ({ id: l.id, qty: l.received_quantity }))); }, [lines]);
  const [reason, setReason] = useState('');

  const hasMismatch = lines.some((l, i) => (local[i]?.qty ?? l.received_quantity) !== l.expected_quantity);
  const needsApproval = (discrepancyStatus !== 'matched' || hasMismatch) && !discrepancyApprovedAt;

  return (
    <Card>
      <CardHeader><CardTitle>Step 2: Quantity Verification</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Expected</TableHead><TableHead>Received</TableHead></TableRow></TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={l.id}>
                <TableCell>{l.product_name_cached} <span className="text-muted-foreground text-xs">({l.product_sku_cached})</span></TableCell>
                <TableCell>{l.expected_quantity}</TableCell>
                <TableCell>
                  <Input type="number" min={0} className="w-28" value={local[i]?.qty ?? 0}
                    onChange={(e) => {
                      const next = [...local];
                      next[i] = { id: l.id, qty: parseInt(e.target.value, 10) || 0 };
                      setLocal(next);
                    }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button variant="outline" onClick={() => onSave(local.map(x => ({ id: x.id, received_quantity: x.qty })))}>Save Quantities</Button>

        {needsApproval && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Discrepancy detected</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Super Admin approval is required to proceed.</p>
              {isAdmin ? (
                <div className="flex gap-2 items-center">
                  <Input placeholder="" value={reason} onChange={(e) => setReason(e.target.value)} className="bg-background" />
                  <Button onClick={() => onApprove(reason)} disabled={!reason}><ShieldCheck className="h-4 w-4 mr-1" /> Approve</Button>
                </div>
              ) : (
                <p className="text-sm">Awaiting Super Admin approval.</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={onNext} disabled={needsApproval}>Next: Generate Labels <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Step3Labels({
  grId, lines, serials, onGenerate, onPrint, onConfirm,
}: {
  grId: string;
  lines: any[];
  serials: GoodsReceiptSerial[];
  onGenerate: (lineId: string) => Promise<void>;
  onPrint: () => Promise<void>;
  onConfirm: () => Promise<void>;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const totalNeeded = lines.reduce((s, l) => s + (l.received_quantity || 0), 0);
  const totalGenerated = serials.length;

  return (
    <Card>
      <CardHeader><CardTitle>Step 3: Generate & Print Labels</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">Total labels needed: <strong>{totalNeeded}</strong>. Generated: <strong>{totalGenerated}</strong>.</div>
        <Table>
          <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Generated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {lines.map(l => {
              const lineSerials = serials.filter(s => s.goods_receipt_line_id === l.id);
              return (
                <TableRow key={l.id}>
                  <TableCell>{l.product_name_cached} <span className="text-muted-foreground text-xs">({l.product_sku_cached})</span></TableCell>
                  <TableCell>{l.received_quantity}</TableCell>
                  <TableCell>{lineSerials.length}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onGenerate(l.id)} disabled={lineSerials.length >= l.received_quantity}>
                      Generate Labels
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {serials.length > 0 && (
          <div className="rounded border bg-muted/30 p-3 max-h-72 overflow-auto">
            <div className="text-sm font-medium mb-2">Generated Serials</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serials.map(s => (
                <div key={s.id} className="text-xs font-mono p-2 rounded bg-background border">
                  <div>{s.serial_number}</div>
                  <div className="text-muted-foreground">{s.barcode_value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onPrint} disabled={serials.length === 0}><Printer className="h-4 w-4 mr-1" /> Print All Labels</Button>
          <div className="flex items-center gap-2">
            <Checkbox id="cnf" checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
            <Label htmlFor="cnf">Labels generated and pasted on units</Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onConfirm} disabled={!confirmed || serials.length === 0 || serials.length < totalNeeded}>
            Next: QC <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Step4QC({
  grId, lines, serials, onComplete,
}: {
  grId: string;
  lines: any[];
  serials: GoodsReceiptSerial[];
  onComplete: (lineId: string, passed: string[], failed: string[], notes: string) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      {lines.map(l => (
        <LineQCSection key={l.id} line={l} serials={serials.filter(s => s.goods_receipt_line_id === l.id)} onComplete={onComplete} />
      ))}
    </div>
  );
}

function LineQCSection({
  line, serials, onComplete,
}: {
  line: any;
  serials: GoodsReceiptSerial[];
  onComplete: (lineId: string, passed: string[], failed: string[], notes: string) => Promise<void>;
}) {
  // qc decisions: serial id -> 'pass' | 'fail' | undefined
  const [decisions, setDecisions] = useState<Record<string, 'pass' | 'fail'>>({});
  const [notes, setNotes] = useState('');

  const pending = serials.filter(s => s.qc_status === 'pending');
  const passedCount = serials.filter(s => s.qc_status === 'passed').length;
  const failedCount = serials.filter(s => s.qc_status === 'failed').length;
  const decidedPass = pending.filter(s => decisions[s.id] === 'pass').map(s => s.id);
  const decidedFail = pending.filter(s => decisions[s.id] === 'fail').map(s => s.id);
  const allDecided = pending.length > 0 && pending.every(s => decisions[s.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{line.product_name_cached} <span className="text-muted-foreground text-sm">({line.product_sku_cached})</span></CardTitle>
        <div className="text-sm text-muted-foreground">
          {passedCount} of {serials.length} passed · {failedCount} failed · {pending.length} pending
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">QC complete for this line.</p>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Serial</TableHead><TableHead>Barcode</TableHead><TableHead className="w-40">QC</TableHead></TableRow></TableHeader>
              <TableBody>
                {pending.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.serial_number}</TableCell>
                    <TableCell className="font-mono text-xs">{s.barcode_value}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={decisions[s.id] === 'pass'}
                          onCheckedChange={(v) => setDecisions({ ...decisions, [s.id]: v ? 'pass' : 'fail' })}
                        />
                        <span className="text-xs">{decisions[s.id] === 'pass' ? 'Pass' : decisions[s.id] === 'fail' ? 'Fail' : 'Set'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {decidedFail.length > 0 && (
              <div>
                <Label>Failure notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="" />
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => onComplete(line.id, decidedPass, decidedFail, notes)} disabled={!allDecided}>
                Complete QC for Line
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}