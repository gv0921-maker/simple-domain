import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Printer, CheckCircle2, X, Send, Truck, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  useWorkOrderV2, useApproveWorkOrder, useRejectWorkOrder,
  usePlaceWorkOrder, useCancelWorkOrderV2, useSubmitForApproval,
  useAssignableUsers, useAssignFactoryIncharge,
} from '@/hooks/manufacturing/workOrders';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { LogNotesPanel } from '@/components/shared/LogNotesPanel';
import type { WorkOrderStage } from '@/lib/services/manufacturing/workOrders';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STAGE_LABELS: Record<WorkOrderStage, string> = {
  draft: 'Draft', pending_approval: 'Pending Approval', approved: 'Approved',
  placed: 'Placed at Factory', work_start: 'Work Started', polishing: 'Polishing',
  completed: 'Completed at Factory', received_at_store: 'Received at Store',
  cancelled: 'Cancelled', rejected: 'Rejected',
};

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useIsSuperAdmin();
  const { data: wo, isLoading } = useWorkOrderV2(id);
  const { data: users = [] } = useAssignableUsers();

  const approveMut = useApproveWorkOrder();
  const rejectMut = useRejectWorkOrder();
  const placeMut = usePlaceWorkOrder();
  const cancelMut = useCancelWorkOrderV2();
  const submitMut = useSubmitForApproval();
  const assignMut = useAssignFactoryIncharge();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [placeOpen, setPlaceOpen] = useState(false);

  if (isLoading) return <AppLayout title="Manufacturing" subtitle="Work Order" moduleNav={MANUFACTURING_NAV}><div className="p-8">Loading…</div></AppLayout>;
  if (!wo) return <AppLayout title="Manufacturing" subtitle="Work Order" moduleNav={MANUFACTURING_NAV}><div className="p-8">Not found</div></AppLayout>;

  const assignee = users.find(u => u.id === wo.assigned_factory_incharge_id);
  const stage = wo.current_stage;
  const factoryStarted = ['placed','work_start','polishing','completed','received_at_store'].includes(stage);

  const handleSubmit = async () => { try { await submitMut.mutateAsync(wo.id); toast.success('Submitted'); } catch (e: any) { toast.error(e.message); } };
  const handleApprove = async () => { try { await approveMut.mutateAsync(wo.id); toast.success('Approved'); } catch (e: any) { toast.error(e.message); } };
  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    try { await rejectMut.mutateAsync({ id: wo.id, reason: rejectReason }); toast.success('Rejected'); setRejectOpen(false); } catch (e: any) { toast.error(e.message); }
  };
  const handlePlace = async () => { try { await placeMut.mutateAsync(wo.id); toast.success('Placed at factory'); setPlaceOpen(false); } catch (e: any) { toast.error(e.message); } };
  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    try { await cancelMut.mutateAsync({ id: wo.id, reason: cancelReason }); toast.success('Cancelled'); setCancelOpen(false); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppLayout title="Manufacturing" subtitle={`Work Order ${wo.wo_number}`} moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/manufacturing/work-orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{wo.wo_number}</h1>
                <Badge variant="outline">{STAGE_LABELS[stage]}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {wo.product?.name} · {wo.quantity} units · ETA {wo.eta_date ?? '—'}
                {wo.linked_sales_order?.reference && (
                  <> · SO <button className="underline" onClick={() => navigate(`/sales/orders/${wo.linked_sales_order_id}/edit`)}>{wo.linked_sales_order.reference}</button></>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/print/work_order/${wo.id}`, '_blank')}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            {stage === 'draft' && (
              <Button size="sm" onClick={() => navigate(`/manufacturing/work-orders/${wo.id}/edit`)}>Edit</Button>
            )}
            {(isAdmin && stage !== 'cancelled' && stage !== 'received_at_store') && (
              <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>Cancel WO</Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 flex items-center justify-between text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Assigned Factory Incharge</div>
              <div className="font-medium">{assignee?.name ?? 'Unassigned'}</div>
            </div>
            {isAdmin && (
              <Select
                value={wo.assigned_factory_incharge_id ?? '__none'}
                onValueChange={(v) => assignMut.mutateAsync({ id: wo.id, userId: v === '__none' ? null : v })}
              >
                <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="specs">
          <TabsList>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="approval">Approval & Placement</TabsTrigger>
            {factoryStarted && <TabsTrigger value="factory">Factory Progress</TabsTrigger>}
            {(stage === 'completed' || stage === 'received_at_store') && <TabsTrigger value="receipt">Goods Receipt</TabsTrigger>}
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="specs" className="space-y-3">
            <Card><CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <Spec label="Size" value={wo.size_spec} />
              <Spec label="Colour / Polish" value={wo.colour_polish_spec} />
              <Spec label="Fabric" value={wo.fabric_spec} />
              <Spec label="Customization Notes" value={wo.customization_notes} />
            </CardContent></Card>
            {wo.reference_images.length > 0 && (
              <Card><CardHeader><CardTitle className="text-base">Reference Images</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-4 gap-3">
                  {wo.reference_images.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-full h-32 object-cover border rounded" />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approval">
            <Card><CardContent className="p-4 space-y-4">
              {stage === 'draft' && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Submit this draft for super-admin approval.</p>
                  <Button onClick={handleSubmit} disabled={submitMut.isPending}><Send className="h-4 w-4 mr-2" /> Submit for Approval</Button>
                </div>
              )}
              {stage === 'pending_approval' && (
                isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Button onClick={handleApprove} disabled={approveMut.isPending}><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</Button>
                    <Button variant="destructive" onClick={() => setRejectOpen(true)}><X className="h-4 w-4 mr-2" /> Reject</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pending super-admin approval.</p>
                )
              )}
              {stage === 'approved' && (
                <div className="flex items-center justify-between">
                  <p className="text-sm">Approved {wo.approved_at && `on ${new Date(wo.approved_at).toLocaleString('en-IN')}`}. Ready to be placed at the factory.</p>
                  {isAdmin && (<Button onClick={() => setPlaceOpen(true)}><Truck className="h-4 w-4 mr-2" /> Place at Factory</Button>)}
                </div>
              )}
              {(factoryStarted || stage === 'cancelled' || stage === 'rejected') && (
                <div className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">Approved at:</span> {wo.approved_at ? new Date(wo.approved_at).toLocaleString('en-IN') : '—'}</div>
                  <div><span className="text-muted-foreground">Placed at:</span> {wo.placed_at ? new Date(wo.placed_at).toLocaleString('en-IN') : '—'}</div>
                  {wo.rejection_reason && <div className="text-red-700">Rejected: {wo.rejection_reason}</div>}
                  {wo.cancellation_reason && <div className="text-red-700">Cancelled: {wo.cancellation_reason}</div>}
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {factoryStarted && (
            <TabsContent value="factory">
              <Card><CardContent className="p-4 space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">Factory progress is updated by the Factory Incharge from the Shop Floor module.</p>
                <Timeline label="Placed at Factory" value={wo.placed_at} />
                <Timeline label="BOM Entered" value={wo.bom_entered_at} />
                <Timeline label="Materials Consumed" value={wo.materials_consumed_at} />
                <Timeline label="Factory Completion" value={wo.factory_completion_at} />
                <Timeline label="Received at Store" value={wo.received_at_store_at} />
              </CardContent></Card>
            </TabsContent>
          )}

          {(stage === 'completed' || stage === 'received_at_store') && (
            <TabsContent value="receipt">
              <Card><CardContent className="p-4 space-y-3">
                {stage === 'completed' ? (
                  <>
                    <div className="p-3 rounded border bg-emerald-50 text-emerald-800 text-sm">
                      Factory has completed the work order. Initiate goods receipt to bring items into store inventory.
                    </div>
                    <Button onClick={() => navigate(`/inventory/goods-receipts/new?source_type=work_order&source_document_id=${wo.id}`)}>
                      <Package className="h-4 w-4 mr-2" /> Initiate Goods Receipt
                    </Button>
                  </>
                ) : (
                  <div className="text-sm">
                    Received at store on {wo.received_at_store_at ? new Date(wo.received_at_store_at).toLocaleString('en-IN') : '—'}.
                    {wo.linked_goods_receipt_id && (
                      <Button variant="link" className="ml-2 p-0" onClick={() => navigate(`/inventory/goods-receipts/${wo.linked_goods_receipt_id}`)}>
                        View Goods Receipt
                      </Button>
                    )}
                  </div>
                )}
              </CardContent></Card>
            </TabsContent>
          )}

          <TabsContent value="activity">
            <LogNotesPanel recordType="work_order" recordId={wo.id} defaultOpen />
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Work Order</DialogTitle></DialogHeader>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Close</Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectMut.isPending}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Cancel Work Order</DialogTitle></DialogHeader>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={4} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>Close</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelMut.isPending}>Cancel WO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Place confirm */}
        <Dialog open={placeOpen} onOpenChange={setPlaceOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Place Work Order at Factory?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will notify the assigned factory incharge. The office's role ends here — the factory will track progress from the Shop Floor module.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlaceOpen(false)}>Close</Button>
              <Button onClick={handlePlace} disabled={placeMut.isPending}>Place at Factory</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-medium whitespace-pre-wrap">{value || '—'}</div>
    </div>
  );
}

function Timeline({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-500' : 'bg-muted'}`} />
      <span className="text-muted-foreground w-48">{label}</span>
      <span className="font-medium">{value ? new Date(value).toLocaleString('en-IN') : '—'}</span>
    </div>
  );
}