// Manufacturing async service layer — Supabase-backed.
// Consume these via the TanStack Query hooks in `@/hooks/manufacturing`.

import { supabase } from '@/integrations/supabase/client';

// ---------- Domain types (stable for UI consumers) ----------
export interface BOMLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
}

export interface BillOfMaterials {
  id: string;
  name: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  lines: BOMLine[];
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  name: string;
  productId: string;
  productName: string;
  bomId: string;
  quantity: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  workCenterId: string;
  workCenterName: string;
  progress: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface WorkCenter {
  id: string;
  name: string;
  code: string;
  capacity: number;
  costPerHour: number;
  isActive: boolean;
  currentLoad: number;
}

export interface ECO {
  id: string;
  name: string;
  productId: string;
  productName: string;
  type: 'bom_change' | 'routing_change' | 'product_update';
  status: 'draft' | 'in_review' | 'approved' | 'applied' | 'rejected';
  requestedBy: string;
  requestedDate: string;
  description: string;
}

type AnyRow = Record<string, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

// ---------- Mappers ----------
const mapBomLine = (r: AnyRow): BOMLine => ({
  id: r.id,
  productId: r.component_product_id,
  productName: r.products?.name ?? '',
  quantity: Number(r.quantity ?? 0),
  uom: r.unit_of_measure ?? '',
});

const mapBom = (r: AnyRow): BillOfMaterials => ({
  id: r.id,
  name: r.reference ?? '',
  productId: r.product_id,
  productName: r.products?.name ?? '',
  quantity: Number(r.quantity ?? 0),
  uom: '',
  lines: (r.bom_lines ?? []).map(mapBomLine),
  status: r.is_active ? 'active' : 'archived',
  createdAt: r.created_at,
});

const mapStateToStatus = (s: string): WorkOrder['status'] => {
  switch (s) {
    case 'draft': return 'draft';
    case 'confirmed': return 'confirmed';
    case 'in_progress': return 'in_progress';
    case 'done': return 'done';
    case 'cancelled': return 'cancelled';
    default: return 'draft';
  }
};

const mapWorkOrder = (r: AnyRow): WorkOrder => {
  const planned = Number(r.planned_qty ?? 0);
  const produced = Number(r.produced_qty ?? 0);
  return {
    id: r.id,
    name: r.reference ?? '',
    productId: r.product_id,
    productName: r.products?.name ?? '',
    bomId: r.bom_id ?? '',
    quantity: planned,
    status: mapStateToStatus(r.state),
    scheduledStart: r.scheduled_start ?? '',
    scheduledEnd: r.scheduled_end ?? '',
    actualStart: r.actual_start ?? undefined,
    actualEnd: r.actual_end ?? undefined,
    workCenterId: r.work_center_id ?? '',
    workCenterName: r.work_centers?.name ?? '',
    progress: planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0,
    priority: 'normal',
  };
};

const mapWorkCenter = (r: AnyRow): WorkCenter => ({
  id: r.id,
  name: r.name,
  code: r.code,
  capacity: Number(r.capacity ?? 0),
  costPerHour: Number(r.cost_per_hour ?? 0),
  isActive: !!r.is_active,
  currentLoad: 0,
});

const BOM_SELECT =
  '*, products:product_id(name), bom_lines(*, products:component_product_id(name))';
const WO_SELECT =
  '*, products:product_id(name), work_centers:work_center_id(name)';

// ---------- BOMs ----------
export async function fetchBOMs(): Promise<BillOfMaterials[]> {
  const { data, error } = await supabase
    .from('bom').select(BOM_SELECT).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBom);
}

export async function fetchBOMById(id: string): Promise<BillOfMaterials | undefined> {
  const { data, error } = await supabase
    .from('bom').select(BOM_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapBom(data) : undefined;
}

export async function saveBOM(bom: BillOfMaterials): Promise<BillOfMaterials> {
  if (!isUuid(bom.productId)) {
    throw new Error('BOM requires a real product (UUID). Please pick a product from the catalog.');
  }
  const payload = {
    product_id: bom.productId,
    reference: bom.name,
    quantity: bom.quantity,
    is_active: bom.status !== 'archived',
  };

  let bomId = bom.id;
  if (isUuid(bom.id)) {
    const { error } = await supabase.from('bom').update(payload as never).eq('id', bom.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('bom').insert(payload).select('id').single();
    if (error) throw error;
    bomId = data.id;
  }

  // Replace lines
  const { error: derr } = await supabase.from('bom_lines').delete().eq('bom_id', bomId);
  if (derr) throw derr;

  const validLines = (bom.lines ?? []).filter(l => isUuid(l.productId));
  if (validLines.length) {
    const rows = validLines.map(l => ({
      bom_id: bomId,
      component_product_id: l.productId,
      quantity: l.quantity,
      unit_of_measure: l.uom || null,
    }));
    const { error: ierr } = await supabase.from('bom_lines').insert(rows);
    if (ierr) throw ierr;
  }

  return (await fetchBOMById(bomId))!;
}

export async function deleteBOM(id: string): Promise<void> {
  const { error } = await supabase.from('bom').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Work Orders ----------
export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders').select(WO_SELECT).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWorkOrder);
}

export async function fetchWorkOrderById(id: string): Promise<WorkOrder | undefined> {
  const { data, error } = await supabase
    .from('work_orders').select(WO_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapWorkOrder(data) : undefined;
}

export async function saveWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
  if (!isUuid(wo.productId)) {
    throw new Error('Work order requires a real product (UUID).');
  }
  const reference = wo.name || `WO/${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`;
  const producedFromProgress =
    wo.progress != null && wo.quantity > 0
      ? Math.round((wo.progress / 100) * wo.quantity)
      : undefined;

  const payload: AnyRow = {
    reference,
    product_id: wo.productId,
    bom_id: isUuid(wo.bomId) ? wo.bomId : null,
    planned_qty: wo.quantity,
    state: wo.status ?? 'draft',
    scheduled_start: wo.scheduledStart || null,
    scheduled_end: wo.scheduledEnd || null,
    actual_start: wo.actualStart || null,
    actual_end: wo.actualEnd || null,
    work_center_id: isUuid(wo.workCenterId) ? wo.workCenterId : null,
  };
  if (producedFromProgress !== undefined) payload.produced_qty = producedFromProgress;

  let woId = wo.id;
  if (isUuid(wo.id)) {
    const { error } = await supabase.from('work_orders').update(payload as never).eq('id', wo.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('work_orders').insert(payload as never).select('id').single();
    if (error) throw error;
    woId = data.id;
  }
  return (await fetchWorkOrderById(woId))!;
}

export async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase.from('work_orders').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Work Centers ----------
export async function fetchWorkCenters(): Promise<WorkCenter[]> {
  const { data, error } = await supabase
    .from('work_centers').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapWorkCenter);
}

export async function saveWorkCenter(wc: WorkCenter): Promise<WorkCenter> {
  const payload = {
    name: wc.name,
    code: wc.code,
    capacity: wc.capacity,
    cost_per_hour: wc.costPerHour,
    is_active: wc.isActive,
  };

  if (isUuid(wc.id)) {
    const { data, error } = await supabase
      .from('work_centers').update(payload as never).eq('id', wc.id).select().single();
    if (error) throw error;
    return mapWorkCenter(data);
  }
  const { data, error } = await supabase
    .from('work_centers').insert(payload).select().single();
  if (error) throw error;
  return mapWorkCenter(data);
}

export async function deleteWorkCenter(id: string): Promise<void> {
  const { error } = await supabase.from('work_centers').delete().eq('id', id);
  if (error) throw error;
}

// ---------- ECOs (no backing table — in-memory stubs for PLM) ----------
let ecos: ECO[] = [];

export async function getECOs(): Promise<ECO[]> {
  return [...ecos];
}
export async function createECO(data: Omit<ECO, 'id' | 'name'>): Promise<ECO> {
  const newId = `ECO-${String(ecos.length + 1).padStart(3, '0')}`;
  const newECO: ECO = {
    ...data,
    id: newId,
    name: `ECO/${new Date().getFullYear()}/${String(ecos.length + 1).padStart(3, '0')} - ${data.description.slice(0, 30)}`,
  };
  ecos = [...ecos, newECO];
  return newECO;
}
export async function updateECO(id: string, data: Partial<ECO>): Promise<ECO | undefined> {
  ecos = ecos.map(e => (e.id === id ? { ...e, ...data } : e));
  return ecos.find(e => e.id === id);
}