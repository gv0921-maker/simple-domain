import { supabase } from '@/integrations/supabase/client';
import { logFieldChange, logStatusChange } from '@/lib/services/activityLog';

const sb = supabase as any;

export type WorkOrderStage =
  | 'draft' | 'pending_approval' | 'approved' | 'placed'
  | 'work_start' | 'polishing' | 'completed' | 'received_at_store'
  | 'cancelled' | 'rejected';

export interface WorkOrderRow {
  id: string;
  wo_number: string;
  product_id: string;
  quantity: number;
  size_spec: string | null;
  colour_polish_spec: string | null;
  fabric_spec: string | null;
  customization_notes: string | null;
  reference_images: string[];
  linked_sales_order_id: string | null;
  linked_sales_order_line_id: string | null;
  assigned_factory_incharge_id: string | null;
  eta_date: string | null;
  approval_required: boolean;
  approved_by: string | null;
  approved_at: string | null;
  placed_at: string | null;
  current_stage: WorkOrderStage;
  cancellation_reason: string | null;
  rejection_reason: string | null;
  bom_entered_at: string | null;
  materials_consumed_at: string | null;
  factory_completion_at: string | null;
  received_at_store_at: string | null;
  linked_goods_receipt_id: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: { id: string; name: string; sku: string | null } | null;
  linked_sales_order?: { id: string; reference: string | null } | null;
}

export interface WorkOrderInput {
  product_id: string;
  quantity: number;
  size_spec?: string | null;
  colour_polish_spec?: string | null;
  fabric_spec?: string | null;
  customization_notes?: string | null;
  reference_images?: string[];
  linked_sales_order_id?: string | null;
  linked_sales_order_line_id?: string | null;
  assigned_factory_incharge_id?: string | null;
  eta_date?: string | null;
  notes?: string | null;
}

const SELECT = `*, product:products(id,name,sku), linked_sales_order:sales_orders!work_orders_linked_sales_order_id_fkey(id,reference)`;

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchWorkOrders(filters?: {
  stage?: WorkOrderStage | 'all';
  assignedTo?: string;
  linkedSO?: string;
  etaFrom?: string;
  etaTo?: string;
  mine?: boolean;
}): Promise<WorkOrderRow[]> {
  let q = sb.from('work_orders').select(SELECT).order('created_at', { ascending: false });
  if (filters?.stage && filters.stage !== 'all') q = q.eq('current_stage', filters.stage);
  if (filters?.assignedTo) q = q.eq('assigned_factory_incharge_id', filters.assignedTo);
  if (filters?.linkedSO) q = q.eq('linked_sales_order_id', filters.linkedSO);
  if (filters?.etaFrom) q = q.gte('eta_date', filters.etaFrom);
  if (filters?.etaTo) q = q.lte('eta_date', filters.etaTo);
  if (filters?.mine) {
    const me = await uid();
    if (me) q = q.eq('created_by', me);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, reference_images: r.reference_images ?? [] })) as WorkOrderRow[];
}

export async function fetchWorkOrderById(id: string): Promise<WorkOrderRow | null> {
  const { data, error } = await sb.from('work_orders').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, reference_images: data.reference_images ?? [] } as WorkOrderRow;
}

export async function createWorkOrder(input: WorkOrderInput): Promise<WorkOrderRow> {
  const me = await uid();
  const payload = {
    product_id: input.product_id,
    quantity: input.quantity,
    planned_qty: input.quantity,
    size_spec: input.size_spec ?? null,
    colour_polish_spec: input.colour_polish_spec ?? null,
    fabric_spec: input.fabric_spec ?? null,
    customization_notes: input.customization_notes ?? null,
    reference_images: input.reference_images ?? [],
    linked_sales_order_id: input.linked_sales_order_id ?? null,
    linked_sales_order_line_id: input.linked_sales_order_line_id ?? null,
    assigned_factory_incharge_id: input.assigned_factory_incharge_id ?? null,
    eta_date: input.eta_date ?? null,
    notes: input.notes ?? null,
    current_stage: 'draft',
    state: 'draft',
    created_by: me,
  };
  const { data, error } = await sb.from('work_orders').insert(payload).select(SELECT).single();
  if (error) throw error;
  try { await logStatusChange('work_order', data.id, null, 'draft'); } catch { /* ignore */ }
  return { ...data, reference_images: data.reference_images ?? [] } as WorkOrderRow;
}

export async function updateWorkOrderDraft(id: string, input: Partial<WorkOrderInput>): Promise<WorkOrderRow> {
  const current = await fetchWorkOrderById(id);
  if (!current) throw new Error('Work order not found');
  if (current.current_stage !== 'draft') throw new Error('Only drafts can be edited');
  const payload: any = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) payload[k] = v;
    if (k === 'quantity' && v !== undefined) payload.planned_qty = v;
  }
  const { data, error } = await sb.from('work_orders').update(payload).eq('id', id).select(SELECT).single();
  if (error) throw error;
  // best-effort field change logs
  for (const k of Object.keys(payload)) {
    try { await logFieldChange('work_order', id, k, (current as any)[k], payload[k]); } catch { /* ignore */ }
  }
  return { ...data, reference_images: data.reference_images ?? [] } as WorkOrderRow;
}

export async function submitForApproval(id: string): Promise<void> {
  const { error } = await sb.from('work_orders')
    .update({ current_stage: 'pending_approval' })
    .eq('id', id).eq('current_stage', 'draft');
  if (error) throw error;
  try { await logStatusChange('work_order', id, 'draft', 'pending_approval'); } catch { /* ignore */ }
}

export async function approveWorkOrder(id: string): Promise<void> {
  const { error } = await sb.rpc('approve_work_order', { p_wo_id: id });
  if (error) throw error;
  try { await logStatusChange('work_order', id, 'pending_approval', 'approved'); } catch { /* ignore */ }
}

export async function rejectWorkOrder(id: string, reason: string): Promise<void> {
  const { error } = await sb.rpc('reject_work_order', { p_wo_id: id, p_reason: reason });
  if (error) throw error;
  try { await logStatusChange('work_order', id, 'pending_approval', 'rejected'); } catch { /* ignore */ }
}

export async function placeWorkOrder(id: string): Promise<void> {
  const { error } = await sb.rpc('place_work_order', { p_wo_id: id });
  if (error) throw error;
  try { await logStatusChange('work_order', id, 'approved', 'placed'); } catch { /* ignore */ }
}

export async function cancelWorkOrder(id: string, reason: string): Promise<void> {
  const { error } = await sb.rpc('cancel_work_order', { p_wo_id: id, p_reason: reason });
  if (error) throw error;
  try { await logStatusChange('work_order', id, null, 'cancelled'); } catch { /* ignore */ }
}

export async function assignFactoryIncharge(id: string, userId: string | null): Promise<void> {
  const { error } = await sb.from('work_orders').update({ assigned_factory_incharge_id: userId }).eq('id', id);
  if (error) throw error;
  try { await logFieldChange('work_order', id, 'assigned_factory_incharge_id', null, userId); } catch { /* ignore */ }
}

export async function uploadReferenceImage(woId: string, file: File): Promise<string> {
  const path = `${woId}/${Date.now()}-${file.name}`;
  const up = await supabase.storage.from('manufacturing-references').upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  const { data: pub } = supabase.storage.from('manufacturing-references').getPublicUrl(path);
  return pub.publicUrl;
}

export async function fetchAssignableUsers(): Promise<Array<{ id: string; name: string; role: string }>> {
  // factory_incharge or admin or super_admin
  const { data, error } = await sb.from('user_roles')
    .select('user_id, role')
    .in('role', ['factory_incharge', 'admin', 'super_admin']);
  if (error) throw error;
  const ids = Array.from(new Set(((data ?? []) as any[]).map(r => r.user_id)));
  if (ids.length === 0) return [];
  const { data: emps } = await sb.from('employees').select('user_id, full_name').in('user_id', ids);
  const nameMap = new Map<string, string>(((emps ?? []) as any[]).map(e => [e.user_id, e.full_name]));
  return ids.map(id => ({
    id,
    name: nameMap.get(id) ?? id.slice(0, 8),
    role: (((data ?? []) as any[]).find((r) => r.user_id === id)?.role) ?? '',
  }));
}

export async function fetchWorkOrderForSOLine(soLineId: string): Promise<WorkOrderRow | null> {
  const { data, error } = await sb.from('work_orders')
    .select(SELECT)
    .eq('linked_sales_order_line_id', soLineId)
    .neq('current_stage', 'cancelled')
    .neq('current_stage', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, reference_images: data.reference_images ?? [] } as WorkOrderRow;
}