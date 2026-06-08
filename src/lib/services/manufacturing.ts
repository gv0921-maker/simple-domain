// Manufacturing service layer — Supabase-backed.
// Function names and parameter shapes mirror the legacy in-memory API,
// but every read/write is async and returns a Promise.
import { supabase } from '@/integrations/supabase/client';

// ---------- Types (kept stable for existing consumers) ----------
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

// ---------- Row mappers ----------
type AnyRow = Record<string, any>;

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

// ---------- Work Orders ----------
export async function getWorkOrders(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*, products:product_id(name), work_centers:work_center_id(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWorkOrder);
}

export async function getWorkOrder(id: string): Promise<WorkOrder | undefined> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*, products:product_id(name), work_centers:work_center_id(name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWorkOrder(data) : undefined;
}

export async function createWorkOrder(
  data: Omit<WorkOrder, 'id' | 'name' | 'progress'>,
): Promise<WorkOrder> {
  const reference = `WO/${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`;
  const payload = {
    reference,
    product_id: data.productId,
    bom_id: data.bomId || null,
    planned_qty: data.quantity,
    state: data.status ?? 'draft',
    scheduled_start: data.scheduledStart || null,
    scheduled_end: data.scheduledEnd || null,
    actual_start: data.actualStart || null,
    actual_end: data.actualEnd || null,
    work_center_id: data.workCenterId || null,
  };
  const { data: row, error } = await supabase
    .from('work_orders')
    .insert(payload)
    .select('*, products:product_id(name), work_centers:work_center_id(name)')
    .single();
  if (error) throw error;
  return mapWorkOrder(row);
}

export async function updateWorkOrder(
  id: string,
  data: Partial<WorkOrder>,
): Promise<WorkOrder | undefined> {
  const payload: AnyRow = {};
  if (data.name !== undefined) payload.reference = data.name;
  if (data.productId !== undefined) payload.product_id = data.productId;
  if (data.bomId !== undefined) payload.bom_id = data.bomId || null;
  if (data.quantity !== undefined) payload.planned_qty = data.quantity;
  if (data.status !== undefined) payload.state = data.status;
  if (data.scheduledStart !== undefined) payload.scheduled_start = data.scheduledStart || null;
  if (data.scheduledEnd !== undefined) payload.scheduled_end = data.scheduledEnd || null;
  if (data.actualStart !== undefined) payload.actual_start = data.actualStart || null;
  if (data.actualEnd !== undefined) payload.actual_end = data.actualEnd || null;
  if (data.workCenterId !== undefined) payload.work_center_id = data.workCenterId || null;
  if (data.progress !== undefined) {
    // map back into produced_qty using current planned if we can
  }
  const { data: row, error } = await supabase
    .from('work_orders')
    .update(payload as never)
    .eq('id', id)
    .select('*, products:product_id(name), work_centers:work_center_id(name)')
    .maybeSingle();
  if (error) throw error;
  return row ? mapWorkOrder(row) : undefined;
}

export async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase.from('work_orders').delete().eq('id', id);
  if (error) throw error;
}

// ---------- BOMs ----------
export async function getBOMs(): Promise<BillOfMaterials[]> {
  const { data, error } = await supabase
    .from('bom')
    .select('*, products:product_id(name), bom_lines(*, products:component_product_id(name))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBom);
}

export async function getBOM(id: string): Promise<BillOfMaterials | undefined> {
  const { data, error } = await supabase
    .from('bom')
    .select('*, products:product_id(name), bom_lines(*, products:component_product_id(name))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBom(data) : undefined;
}

export async function createBOM(
  data: Omit<BillOfMaterials, 'id' | 'createdAt'>,
): Promise<BillOfMaterials> {
  const { data: bomRow, error } = await supabase
    .from('bom')
    .insert({
      product_id: data.productId,
      reference: data.name,
      quantity: data.quantity,
      is_active: data.status !== 'archived',
    })
    .select()
    .single();
  if (error) throw error;

  if (data.lines?.length) {
    const lines = data.lines.map(l => ({
      bom_id: bomRow.id,
      component_product_id: l.productId,
      quantity: l.quantity,
      unit_of_measure: l.uom,
    }));
    const { error: lerr } = await supabase.from('bom_lines').insert(lines);
    if (lerr) throw lerr;
  }

  return (await getBOM(bomRow.id))!;
}

export async function updateBOM(
  id: string,
  data: Partial<BillOfMaterials>,
): Promise<BillOfMaterials | undefined> {
  const payload: AnyRow = {};
  if (data.name !== undefined) payload.reference = data.name;
  if (data.productId !== undefined) payload.product_id = data.productId;
  if (data.quantity !== undefined) payload.quantity = data.quantity;
  if (data.status !== undefined) payload.is_active = data.status !== 'archived';

  if (Object.keys(payload).length) {
    const { error } = await supabase.from('bom').update(payload as never).eq('id', id);
    if (error) throw error;
  }

  if (data.lines !== undefined) {
    const { error: derr } = await supabase.from('bom_lines').delete().eq('bom_id', id);
    if (derr) throw derr;
    if (data.lines.length) {
      const lines = data.lines.map(l => ({
        bom_id: id,
        component_product_id: l.productId,
        quantity: l.quantity,
        unit_of_measure: l.uom,
      }));
      const { error: ierr } = await supabase.from('bom_lines').insert(lines);
      if (ierr) throw ierr;
    }
  }

  return getBOM(id);
}

export async function deleteBOM(id: string): Promise<void> {
  const { error } = await supabase.from('bom').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Work Centers ----------
export async function getWorkCenters(): Promise<WorkCenter[]> {
  const { data, error } = await supabase
    .from('work_centers')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(mapWorkCenter);
}

export async function createWorkCenter(
  data: Omit<WorkCenter, 'id' | 'currentLoad'>,
): Promise<WorkCenter> {
  const { data: row, error } = await supabase
    .from('work_centers')
    .insert({
      name: data.name,
      code: data.code,
      capacity: data.capacity,
      cost_per_hour: data.costPerHour,
      is_active: data.isActive,
    })
    .select()
    .single();
  if (error) throw error;
  return mapWorkCenter(row);
}

export async function updateWorkCenter(
  id: string,
  data: Partial<WorkCenter>,
): Promise<WorkCenter | undefined> {
  const payload: AnyRow = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.capacity !== undefined) payload.capacity = data.capacity;
  if (data.costPerHour !== undefined) payload.cost_per_hour = data.costPerHour;
  if (data.isActive !== undefined) payload.is_active = data.isActive;

  const { data: row, error } = await supabase
    .from('work_centers')
    .update(payload as never)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return row ? mapWorkCenter(row) : undefined;
}

export async function deleteWorkCenter(id: string): Promise<void> {
  const { error } = await supabase.from('work_centers').delete().eq('id', id);
  if (error) throw error;
}

// ---------- ECOs (no backing table yet — keep in-memory stubs) ----------
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