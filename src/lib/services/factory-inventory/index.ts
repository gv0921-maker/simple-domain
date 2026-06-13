import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface FactoryInventoryItem {
  id: string;
  name: string;
  category: string | null;
  unit_of_measurement: string;
  description: string | null;
  image_url: string | null;
  current_stock: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FactoryStockMovement {
  id: string;
  factory_inventory_item_id: string;
  movement_type: 'inbound' | 'consumed' | 'adjustment' | 'damaged';
  quantity: number;
  related_work_order_id: string | null;
  notes: string | null;
  recorded_by: string | null;
  recorded_at: string;
  item?: { id: string; name: string; unit_of_measurement: string } | null;
}

export interface ItemInput {
  name: string;
  category?: string | null;
  unit_of_measurement: string;
  description?: string | null;
  image_url?: string | null;
  min_stock_level?: number;
  is_active?: boolean;
}

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getFactoryInventoryItems(includeInactive = false): Promise<FactoryInventoryItem[]> {
  let q = sb.from('factory_inventory_items').select('*').order('name', { ascending: true });
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FactoryInventoryItem[];
}

export async function createInventoryItem(input: ItemInput): Promise<FactoryInventoryItem> {
  const { data, error } = await sb.from('factory_inventory_items').insert(input).select().single();
  if (error) throw error;
  return data as FactoryInventoryItem;
}

export async function updateInventoryItem(id: string, input: Partial<ItemInput>): Promise<void> {
  const { error } = await sb.from('factory_inventory_items').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  // Soft delete
  const { error } = await sb.from('factory_inventory_items').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function getFactoryStockMovements(filters?: { itemId?: string; type?: string; limit?: number }): Promise<FactoryStockMovement[]> {
  let q = sb.from('factory_stock_movements')
    .select('*, item:factory_inventory_items(id,name,unit_of_measurement)')
    .order('recorded_at', { ascending: false });
  if (filters?.itemId) q = q.eq('factory_inventory_item_id', filters.itemId);
  if (filters?.type) q = q.eq('movement_type', filters.type);
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FactoryStockMovement[];
}

async function recordMovementAndAdjustStock(
  itemId: string,
  type: FactoryStockMovement['movement_type'],
  quantity: number,
  notes?: string | null,
): Promise<void> {
  const me = await uid();
  const { error } = await sb.from('factory_stock_movements').insert({
    factory_inventory_item_id: itemId,
    movement_type: type,
    quantity,
    notes: notes ?? null,
    recorded_by: me,
  });
  if (error) throw error;
  // adjust running stock
  const { data: cur } = await sb.from('factory_inventory_items').select('current_stock').eq('id', itemId).maybeSingle();
  const next = Number(cur?.current_stock ?? 0) + Number(quantity);
  const { error: upErr } = await sb.from('factory_inventory_items').update({ current_stock: next }).eq('id', itemId);
  if (upErr) throw upErr;
}

export async function recordInbound(itemId: string, quantity: number, notes?: string | null): Promise<void> {
  if (quantity <= 0) throw new Error('Inbound quantity must be positive');
  await recordMovementAndAdjustStock(itemId, 'inbound', Math.abs(quantity), notes);
}

export async function recordAdjustment(itemId: string, quantity: number, notes?: string | null): Promise<void> {
  if (quantity === 0) throw new Error('Adjustment quantity cannot be zero');
  await recordMovementAndAdjustStock(itemId, 'adjustment', quantity, notes);
}

export async function recordDamaged(itemId: string, quantity: number, notes?: string | null): Promise<void> {
  if (quantity <= 0) throw new Error('Damaged quantity must be positive');
  await recordMovementAndAdjustStock(itemId, 'damaged', -Math.abs(quantity), notes);
}

export async function getLowStockItems(): Promise<FactoryInventoryItem[]> {
  const all = await getFactoryInventoryItems(false);
  return all.filter((i) => Number(i.current_stock) < Number(i.min_stock_level));
}