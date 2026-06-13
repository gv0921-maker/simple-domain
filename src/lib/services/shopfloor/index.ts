import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface ShopFloorWO {
  id: string;
  wo_number: string;
  product_id: string;
  quantity: number;
  size_spec: string | null;
  colour_polish_spec: string | null;
  fabric_spec: string | null;
  customization_notes: string | null;
  reference_images: string[];
  progress_photos: string[];
  current_stage: string;
  eta_date: string | null;
  assigned_factory_incharge_id: string | null;
  bom_entered_at: string | null;
  materials_consumed_at: string | null;
  factory_completion_at: string | null;
  product?: { id: string; name: string; sku: string | null; image_url?: string | null } | null;
  linked_sales_order?: { id: string; reference: string | null } | null;
}

export interface BomEntry {
  id: string;
  work_order_id: string;
  factory_inventory_item_id: string;
  quantity_required: number;
  quantity_consumed: number;
  notes: string | null;
  item?: { id: string; name: string; unit_of_measurement: string; current_stock: number } | null;
}

const SELECT = `*, product:products(id,name,sku,image_url), linked_sales_order:sales_orders!work_orders_linked_sales_order_id_fkey(id,reference)`;
const FACTORY_STAGES = ['placed', 'work_start', 'polishing'];

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function normalize(r: any): ShopFloorWO {
  return {
    ...r,
    reference_images: r.reference_images ?? [],
    progress_photos: r.progress_photos ?? [],
  } as ShopFloorWO;
}

export async function getMyWorkOrders(): Promise<ShopFloorWO[]> {
  const me = await uid();
  if (!me) return [];
  const { data, error } = await sb.from('work_orders').select(SELECT)
    .eq('assigned_factory_incharge_id', me)
    .in('current_stage', FACTORY_STAGES)
    .order('eta_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function getAllFactoryWorkOrders(): Promise<ShopFloorWO[]> {
  const { data, error } = await sb.from('work_orders').select(SELECT)
    .in('current_stage', FACTORY_STAGES)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function getFactoryWO(id: string): Promise<ShopFloorWO | null> {
  const { data, error } = await sb.from('work_orders').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
}

export async function getBomEntries(woId: string): Promise<BomEntry[]> {
  const { data, error } = await sb.from('work_order_bom_entries')
    .select('*, item:factory_inventory_items(id,name,unit_of_measurement,current_stock)')
    .eq('work_order_id', woId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BomEntry[];
}

export async function startWork(woId: string): Promise<void> {
  const { error } = await sb.rpc('start_work', { p_wo_id: woId });
  if (error) throw error;
}

export async function enterBOM(
  woId: string,
  entries: { factory_inventory_item_id: string; quantity_required: number; notes?: string | null }[],
): Promise<void> {
  const { error } = await sb.rpc('enter_bom', { p_wo_id: woId, p_entries: entries });
  if (error) throw error;
}

export async function updateBOMEntry(entryId: string, quantityRequired: number, notes: string | null): Promise<void> {
  const { error } = await sb.from('work_order_bom_entries')
    .update({ quantity_required: quantityRequired, notes })
    .eq('id', entryId);
  if (error) throw error;
}

export async function startPolishing(woId: string): Promise<void> {
  const { error } = await sb.rpc('start_polishing', { p_wo_id: woId });
  if (error) throw error;
}

export async function completeFactoryWork(woId: string): Promise<void> {
  const { error } = await sb.rpc('complete_factory_work', { p_wo_id: woId });
  if (error) throw error;
}

export async function uploadProgressPhoto(woId: string, file: File): Promise<string> {
  const me = await uid();
  const path = `${woId}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('factory-progress').upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from('factory-progress').getPublicUrl(path);
  const url = pub.publicUrl;

  const { data: cur } = await sb.from('work_orders').select('progress_photos').eq('id', woId).maybeSingle();
  const existing: string[] = (cur?.progress_photos ?? []) as string[];
  const next = [...existing, url];
  const { error } = await sb.from('work_orders').update({ progress_photos: next, updated_at: new Date().toISOString() }).eq('id', woId);
  if (error) throw error;
  void me;
  return url;
}

export async function getFactoryProgressForSO(salesOrderId: string): Promise<ShopFloorWO[]> {
  const { data, error } = await sb.from('work_orders').select(SELECT)
    .eq('linked_sales_order_id', salesOrderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}