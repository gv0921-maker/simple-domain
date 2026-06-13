import { supabase } from '@/integrations/supabase/client';
import { addToScanQueue } from '@/lib/services/barcode/api';

export type MovementType =
  | 'rearrangement' | 'display_sold' | 'damage_quarantine'
  | 'return_to_vendor' | 'cycle_count_reconciliation' | 'location_change';

export type MovementStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export type LocationType =
  | 'warehouse' | 'store_display' | 'under_correction'
  | 'packaging' | 'vendor' | 'scrap';

export interface InternalMovement {
  id: string;
  movement_number: string;
  movement_type: MovementType;
  from_location_type: LocationType | null;
  from_location_id: string | null;
  to_location_type: LocationType | null;
  to_location_id: string | null;
  status: MovementStatus;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalMovementItem {
  id: string;
  internal_movement_id: string;
  goods_receipt_serial_id: string;
  product_id: string;
  serial_number: string;
  scanned_at_source: boolean;
  scanned_at_destination: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: { name: string | null } | null;
}

export interface CreateMovementItemInput {
  goods_receipt_serial_id: string;
  product_id: string;
  serial_number: string;
}

export interface MovementFilters {
  movementType?: MovementType | 'all';
  status?: MovementStatus | 'all';
  from?: string;
  to?: string;
  createdBy?: string;
}

export async function createInternalMovement(args: {
  movementType: MovementType;
  fromLocationType?: LocationType | null;
  fromLocationId?: string | null;
  toLocationType?: LocationType | null;
  toLocationId?: string | null;
  items: CreateMovementItemInput[];
  reason?: string;
  notes?: string;
}): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id ?? null;

  const { data: mv, error } = await (supabase as any)
    .from('internal_movements')
    .insert({
      movement_type: args.movementType,
      from_location_type: args.fromLocationType ?? null,
      from_location_id: args.fromLocationId ?? null,
      to_location_type: args.toLocationType ?? null,
      to_location_id: args.toLocationId ?? null,
      reason: args.reason ?? null,
      notes: args.notes ?? null,
      status: 'draft',
      created_by: uid,
    })
    .select('id, movement_number')
    .single();
  if (error) throw error;
  const id = (mv as any).id as string;
  const number = (mv as any).movement_number as string;

  if (args.items.length > 0) {
    const rows = args.items.map((it) => ({
      internal_movement_id: id,
      goods_receipt_serial_id: it.goods_receipt_serial_id,
      product_id: it.product_id,
      serial_number: it.serial_number,
    }));
    const { error: ie } = await (supabase as any).from('internal_movement_items').insert(rows);
    if (ie) throw ie;
  }

  try {
    await addToScanQueue(
      'internal_movement' as any,
      id,
      number,
      args.items.length * 2, // source + destination scans
      'normal',
    );
  } catch {
    // best-effort
  }
  return id;
}

export async function getInternalMovements(filters: MovementFilters = {}): Promise<InternalMovement[]> {
  let q = (supabase as any).from('internal_movements').select('*');
  if (filters.movementType && filters.movementType !== 'all') q = q.eq('movement_type', filters.movementType);
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.from) q = q.gte('created_at', filters.from);
  if (filters.to) q = q.lte('created_at', filters.to);
  if (filters.createdBy) q = q.eq('created_by', filters.createdBy);
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as InternalMovement[];
}

export async function getInternalMovementById(id: string): Promise<{
  movement: InternalMovement;
  items: InternalMovementItem[];
} | null> {
  const { data: m, error } = await (supabase as any)
    .from('internal_movements').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!m) return null;
  const { data: items, error: ie } = await (supabase as any)
    .from('internal_movement_items')
    .select('*, product:products(name)')
    .eq('internal_movement_id', id)
    .order('created_at', { ascending: true });
  if (ie) throw ie;
  return { movement: m as InternalMovement, items: (items ?? []) as InternalMovementItem[] };
}

export async function cancelMovement(movementId: string, reason: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('internal_movements')
    .update({ status: 'cancelled', notes: reason })
    .eq('id', movementId);
  if (error) throw error;
}

export async function startMovement(movementId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('internal_movements')
    .update({ status: 'in_progress' })
    .eq('id', movementId);
  if (error) throw error;
}

export async function completeMovement(movementId: string): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .rpc('complete_internal_movement', { p_movement_id: movementId });
  if (error) throw error;
  return Boolean(data);
}

export async function recordDisplaySold(args: {
  serialId: string;
  productId: string;
  serialNumber: string;
  salesOrderId?: string;
  notes?: string;
}): Promise<string> {
  return createInternalMovement({
    movementType: 'display_sold',
    fromLocationType: 'store_display',
    toLocationType: 'warehouse',
    items: [{
      goods_receipt_serial_id: args.serialId,
      product_id: args.productId,
      serial_number: args.serialNumber,
    }],
    notes: args.salesOrderId ? `For SO ${args.salesOrderId}. ${args.notes ?? ''}` : args.notes,
  });
}

export async function getMovementQueueId(movementId: string): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from('scan_queue').select('id')
    .eq('document_type', 'internal_movement')
    .eq('document_id', movementId)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();
  if (error) throw error;
  return (data as any)?.id ?? null;
}

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  rearrangement: 'Rearrangement',
  display_sold: 'Display Sold to Customer',
  damage_quarantine: 'Damage Quarantine',
  return_to_vendor: 'Return to Vendor',
  cycle_count_reconciliation: 'Cycle Count Reconciliation',
  location_change: 'Location Change',
};