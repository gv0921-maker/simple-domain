// Stock Reservations service — Supabase-backed API for linking sales orders
// to specific inventory units (serial numbers / lots / quantity).
import { supabase } from '@/integrations/supabase/client';

export type StockReservationStatus = 'reserved' | 'released' | 'delivered';

export interface StockReservation {
  id: string;
  salesOrderId: string;
  orderLineId?: string | null;
  productId: string;
  serialNumberId?: string | null;
  lotId?: string | null;
  quantity: number;
  status: StockReservationStatus;
  reservedBy?: string | null;
  reservedAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(r: any): StockReservation {
  return {
    id: r.id,
    salesOrderId: r.sales_order_id,
    orderLineId: r.order_line_id,
    productId: r.product_id,
    serialNumberId: r.serial_number_id,
    lotId: r.lot_id,
    quantity: Number(r.quantity ?? 0),
    status: r.status,
    reservedBy: r.reserved_by,
    reservedAt: r.reserved_at,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listReservationsAsync(): Promise<StockReservation[]> {
  const { data, error } = await (supabase as any)
    .from('stock_reservations').select('*').order('reserved_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function listReservationsBySalesOrderAsync(
  salesOrderId: string,
): Promise<StockReservation[]> {
  const { data, error } = await (supabase as any)
    .from('stock_reservations').select('*')
    .eq('sales_order_id', salesOrderId)
    .order('reserved_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function listReservationsByProductAsync(
  productId: string,
): Promise<StockReservation[]> {
  const { data, error } = await (supabase as any)
    .from('stock_reservations').select('*')
    .eq('product_id', productId)
    .eq('status', 'reserved')
    .order('reserved_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export interface CreateReservationInput {
  salesOrderId: string;
  orderLineId?: string | null;
  productId: string;
  serialNumberId?: string | null;
  lotId?: string | null;
  quantity: number;
  notes?: string;
}

export async function createReservationsAsync(
  inputs: CreateReservationInput[],
): Promise<StockReservation[]> {
  if (inputs.length === 0) return [];
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id ?? null;

  const rows = inputs.map((i) => ({
    sales_order_id: i.salesOrderId,
    order_line_id: i.orderLineId ?? null,
    product_id: i.productId,
    serial_number_id: i.serialNumberId ?? null,
    lot_id: i.lotId ?? null,
    quantity: i.quantity,
    status: 'reserved' as const,
    reserved_by: userId,
    notes: i.notes ?? null,
  }));

  const { data, error } = await (supabase as any)
    .from('stock_reservations').insert(rows).select();
  if (error) throw error;

  // Flip selected serial numbers to "reserved" status.
  const serialIds = inputs.map((i) => i.serialNumberId).filter(Boolean) as string[];
  if (serialIds.length > 0) {
    const { error: serErr } = await supabase
      .from('serial_numbers')
      .update({ status: 'reserved' })
      .in('id', serialIds);
    if (serErr) throw serErr;
  }

  return (data ?? []).map(mapRow);
}

export async function releaseReservationAsync(id: string): Promise<void> {
  // Fetch first to know the serial id (so we can flip it back to available).
  const { data: row, error: fetchErr } = await (supabase as any)
    .from('stock_reservations').select('*').eq('id', id).single();
  if (fetchErr) throw fetchErr;

  const { error } = await (supabase as any)
    .from('stock_reservations')
    .update({ status: 'released' })
    .eq('id', id);
  if (error) throw error;

  if (row?.serial_number_id) {
    await supabase.from('serial_numbers')
      .update({ status: 'available' })
      .eq('id', row.serial_number_id);
  }
}

export async function deleteReservationAsync(id: string): Promise<void> {
  const { data: row } = await (supabase as any)
    .from('stock_reservations').select('*').eq('id', id).single();

  const { error } = await (supabase as any)
    .from('stock_reservations').delete().eq('id', id);
  if (error) throw error;

  if (row?.serial_number_id && row.status === 'reserved') {
    await supabase.from('serial_numbers')
      .update({ status: 'available' })
      .eq('id', row.serial_number_id);
  }
}