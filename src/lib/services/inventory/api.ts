// Inventory async service layer — Supabase-backed.
// New code should consume these (or the hooks in @/hooks/inventory) instead of
// the legacy synchronous functions in @/lib/data/inventory/storage.
//
// Function names mirror the legacy ones (getProducts, saveProduct, …) but each
// returns a Promise. Pages should migrate to the hooks layer rather than calling
// these directly.

import { supabase } from '@/integrations/supabase/client';
import type {
  Product, Warehouse, Location, Lot, SerialNumber,
  StockMove, StockMoveLine, InventoryTransfer, LegacyStockMove,
  InventoryAdjustment, AdjustmentLine, ReorderRule, StockMoveState,
} from '@/lib/data/inventory/types';

// ----------------------------------------------------------------------------
// Row <-> domain mappers (snake_case DB <-> camelCase TS)
// ----------------------------------------------------------------------------

type Row<T> = Record<string, any> & T;

const toISO = (v: any) => (v == null ? undefined : new Date(v).toISOString());

function mapProduct(r: Row<any>): Product {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    type: r.type,
    category: r.category ?? '',
    unitOfMeasure: r.unit_of_measure,
    costMethod: r.cost_method,
    costPrice: Number(r.cost_price ?? 0),
    salePrice: Number(r.sale_price ?? 0),
    stockOnHand: Number(r.stock_on_hand ?? 0),
    reorderLevel: Number(r.reorder_level ?? 0),
    barcode: r.barcode ?? undefined,
    barcodes: r.barcodes ?? [],
    trackInventory: !!r.track_inventory,
    trackLots: !!r.track_lots,
    trackSerials: !!r.track_serials,
    variants: r.variants ?? [],
    defaultLocationId: r.default_location_id ?? undefined,
    weight: r.weight != null ? Number(r.weight) : undefined,
    volume: r.volume != null ? Number(r.volume) : undefined,
    imageUrl: r.image_url ?? undefined,
    warrantyEligible: !!r.warranty_eligible,
    factoryEligible: !!r.factory_eligible,
    createdAt: toISO(r.created_at)!,
    updatedAt: toISO(r.updated_at)!,
  };
}

function productToRow(p: Partial<Product>): any {
  const out: Record<string, any> = {};
  if (p.sku !== undefined) out.sku = p.sku;
  if (p.name !== undefined) out.name = p.name;
  if (p.type !== undefined) out.type = p.type;
  if (p.category !== undefined) out.category = p.category;
  if (p.unitOfMeasure !== undefined) out.unit_of_measure = p.unitOfMeasure;
  if (p.costMethod !== undefined) out.cost_method = p.costMethod;
  if (p.costPrice !== undefined) out.cost_price = p.costPrice;
  if (p.salePrice !== undefined) out.sale_price = p.salePrice;
  if (p.stockOnHand !== undefined) out.stock_on_hand = p.stockOnHand;
  if (p.reorderLevel !== undefined) out.reorder_level = p.reorderLevel;
  if (p.barcode !== undefined) out.barcode = p.barcode || null;
  if (p.barcodes !== undefined) out.barcodes = p.barcodes;
  if (p.trackInventory !== undefined) out.track_inventory = p.trackInventory;
  if (p.trackLots !== undefined) out.track_lots = p.trackLots;
  if (p.trackSerials !== undefined) out.track_serials = p.trackSerials;
  if (p.variants !== undefined) out.variants = p.variants;
  if (p.defaultLocationId !== undefined) out.default_location_id = p.defaultLocationId || null;
  if (p.weight !== undefined) out.weight = p.weight ?? null;
  if (p.volume !== undefined) out.volume = p.volume ?? null;
  if (p.imageUrl !== undefined) out.image_url = p.imageUrl || null;
  if (p.warrantyEligible !== undefined) out.warranty_eligible = !!p.warrantyEligible;
  if (p.factoryEligible !== undefined) out.factory_eligible = !!p.factoryEligible;
  return out;
}

function mapWarehouse(r: Row<any>): Warehouse {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    address: r.address ?? undefined,
    isActive: !!r.is_active,
    defaultReceiptLocationId: r.default_receipt_location_id ?? undefined,
    defaultDeliveryLocationId: r.default_delivery_location_id ?? undefined,
    defaultInternalLocationId: r.default_internal_location_id ?? undefined,
  };
}
function warehouseToRow(w: Partial<Warehouse>): any {
  const out: Record<string, any> = {};
  if (w.name !== undefined) out.name = w.name;
  if (w.code !== undefined) out.code = w.code;
  if (w.address !== undefined) out.address = w.address || null;
  if (w.isActive !== undefined) out.is_active = w.isActive;
  if (w.defaultReceiptLocationId !== undefined) out.default_receipt_location_id = w.defaultReceiptLocationId || null;
  if (w.defaultDeliveryLocationId !== undefined) out.default_delivery_location_id = w.defaultDeliveryLocationId || null;
  if (w.defaultInternalLocationId !== undefined) out.default_internal_location_id = w.defaultInternalLocationId || null;
  return out;
}

function mapLocation(r: Row<any>): Location {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    warehouseId: r.warehouse_id,
    parentId: r.parent_location_id ?? undefined,
    type: r.type,
    isActive: !!r.is_active,
    barcode: r.barcode ?? undefined,
    aisle: r.aisle ?? undefined,
    shelf: r.shelf ?? undefined,
    bin: r.bin ?? undefined,
  };
}
function locationToRow(l: Partial<Location>): any {
  const out: Record<string, any> = {};
  if (l.name !== undefined) out.name = l.name;
  if (l.code !== undefined) out.code = l.code;
  if (l.warehouseId !== undefined) out.warehouse_id = l.warehouseId;
  if (l.parentId !== undefined) out.parent_location_id = l.parentId || null;
  if (l.type !== undefined) out.type = l.type;
  if (l.isActive !== undefined) out.is_active = l.isActive;
  if (l.barcode !== undefined) out.barcode = l.barcode || null;
  if (l.aisle !== undefined) out.aisle = l.aisle || null;
  if (l.shelf !== undefined) out.shelf = l.shelf || null;
  if (l.bin !== undefined) out.bin = l.bin || null;
  return out;
}

function mapLot(r: Row<any>): Lot {
  return {
    id: r.id,
    name: r.name,
    productId: r.product_id,
    quantity: Number(r.quantity ?? 0),
    manufacturingDate: r.manufacturing_date ?? undefined,
    expirationDate: r.expiration_date ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: toISO(r.created_at)!,
    updatedAt: toISO(r.updated_at)!,
  };
}
function lotToRow(l: Partial<Lot>): any {
  const out: Record<string, any> = {};
  if (l.name !== undefined) out.name = l.name;
  if (l.productId !== undefined) out.product_id = l.productId;
  if (l.quantity !== undefined) out.quantity = l.quantity;
  if (l.manufacturingDate !== undefined) out.manufacturing_date = l.manufacturingDate || null;
  if (l.expirationDate !== undefined) out.expiration_date = l.expirationDate || null;
  if (l.notes !== undefined) out.notes = l.notes || null;
  return out;
}

function mapSerial(r: Row<any>): SerialNumber {
  return {
    id: r.id,
    name: r.name,
    productId: r.product_id,
    lotId: r.lot_id ?? undefined,
    locationId: r.location_id ?? undefined,
    status: r.status,
    createdAt: toISO(r.created_at)!,
  };
}
function serialToRow(s: Partial<SerialNumber>): any {
  const out: Record<string, any> = {};
  if (s.name !== undefined) out.name = s.name;
  if (s.productId !== undefined) out.product_id = s.productId;
  if (s.lotId !== undefined) out.lot_id = s.lotId || null;
  if (s.locationId !== undefined) out.location_id = s.locationId || null;
  if (s.status !== undefined) out.status = s.status;
  return out;
}

function mapStockMoveLine(r: Row<any>): StockMoveLine {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productSku: r.product_sku,
    demandQty: Number(r.demand_qty ?? 0),
    reservedQty: Number(r.reserved_qty ?? 0),
    doneQty: Number(r.done_qty ?? 0),
    unitOfMeasure: r.unit_of_measure,
    lotId: r.lot_id ?? undefined,
    lotName: r.lot_name ?? undefined,
    serialNumbers: r.serial_numbers ?? [],
    sourceLocationId: r.source_location_id ?? '',
    destinationLocationId: r.destination_location_id ?? '',
  };
}
function stockMoveLineToRow(stockMoveId: string, l: StockMoveLine): any {
  return {
    stock_move_id: stockMoveId,
    product_id: l.productId,
    product_name: l.productName,
    product_sku: l.productSku,
    demand_qty: l.demandQty,
    reserved_qty: l.reservedQty,
    done_qty: l.doneQty,
    unit_of_measure: l.unitOfMeasure,
    lot_id: l.lotId || null,
    lot_name: l.lotName || null,
    serial_numbers: l.serialNumbers ?? [],
    source_location_id: l.sourceLocationId || null,
    destination_location_id: l.destinationLocationId || null,
  };
}

function mapStockMove(r: Row<any>, lines: StockMoveLine[] = []): StockMove {
  return {
    id: r.id,
    reference: r.reference,
    operationType: r.operation_type,
    sourceLocationId: r.source_location_id ?? '',
    sourceLocationName: r.source_location_name ?? '',
    destinationLocationId: r.destination_location_id ?? '',
    destinationLocationName: r.destination_location_name ?? '',
    partnerId: r.partner_id ?? undefined,
    partnerName: r.partner_name ?? undefined,
    scheduledDate: toISO(r.scheduled_date)!,
    effectiveDate: toISO(r.effective_date),
    state: r.state,
    lines,
    sourceDocument: r.source_document ?? undefined,
    backOrderId: r.back_order_id ?? undefined,
    notes: r.notes ?? undefined,
    createdBy: r.created_by ?? '',
    createdAt: toISO(r.created_at)!,
    updatedAt: toISO(r.updated_at)!,
  };
}
function stockMoveToRow(m: Partial<StockMove>): any {
  const out: Record<string, any> = {};
  if (m.reference !== undefined) out.reference = m.reference;
  if (m.operationType !== undefined) out.operation_type = m.operationType;
  if (m.sourceLocationId !== undefined) out.source_location_id = m.sourceLocationId || null;
  if (m.sourceLocationName !== undefined) out.source_location_name = m.sourceLocationName || null;
  if (m.destinationLocationId !== undefined) out.destination_location_id = m.destinationLocationId || null;
  if (m.destinationLocationName !== undefined) out.destination_location_name = m.destinationLocationName || null;
  if (m.partnerId !== undefined) out.partner_id = m.partnerId || null;
  if (m.partnerName !== undefined) out.partner_name = m.partnerName || null;
  if (m.scheduledDate !== undefined) out.scheduled_date = m.scheduledDate;
  if (m.effectiveDate !== undefined) out.effective_date = m.effectiveDate || null;
  if (m.state !== undefined) out.state = m.state;
  if (m.sourceDocument !== undefined) out.source_document = m.sourceDocument || null;
  if (m.backOrderId !== undefined) out.back_order_id = m.backOrderId || null;
  if (m.notes !== undefined) out.notes = m.notes || null;
  if (m.createdBy !== undefined) out.created_by = m.createdBy || null;
  return out;
}

function mapTransferLine(r: Row<any>): LegacyStockMove {
  return {
    productId: r.product_id,
    productName: r.product_name,
    demand: Number(r.demand_qty ?? 0),
    quantity: Number(r.done_qty ?? 0),
    unit: r.unit,
    available: !!r.available,
  };
}
function transferLineToRow(transferId: string, l: LegacyStockMove): any {
  return {
    transfer_id: transferId,
    product_id: l.productId,
    product_name: l.productName,
    demand_qty: l.demand,
    done_qty: l.quantity,
    unit: l.unit,
    available: l.available,
  };
}

function mapTransfer(r: Row<any>, moves: LegacyStockMove[] = []): InventoryTransfer {
  return {
    id: r.id,
    reference: r.reference,
    contact: r.contact ?? '',
    contactPhone: r.contact_phone ?? undefined,
    operationType: r.operation_type ?? '',
    sourceLocation: r.source_location ?? '',
    destinationLocation: r.destination_location ?? '',
    scheduledDate: toISO(r.scheduled_date)!,
    estimateDate: toISO(r.estimate_date),
    status: r.state,
    productAvailability: r.product_availability,
    sourceDocument: r.source_document ?? undefined,
    backOrderOf: r.back_order_of ?? undefined,
    moves,
    notes: r.notes ?? [],
    activities: r.activities ?? [],
    createdBy: r.created_by ?? '',
    createdAt: toISO(r.created_at)!,
    updatedAt: toISO(r.updated_at)!,
  };
}
function transferToRow(t: Partial<InventoryTransfer> & { fromWarehouseId?: string; toWarehouseId?: string }): any {
  const out: Record<string, any> = {};
  if (t.reference !== undefined) out.reference = t.reference;
  if (t.contact !== undefined) out.contact = t.contact;
  if (t.contactPhone !== undefined) out.contact_phone = t.contactPhone || null;
  if (t.operationType !== undefined) out.operation_type = t.operationType;
  if (t.sourceLocation !== undefined) out.source_location = t.sourceLocation;
  if (t.destinationLocation !== undefined) out.destination_location = t.destinationLocation;
  if (t.scheduledDate !== undefined) out.scheduled_date = t.scheduledDate;
  if (t.estimateDate !== undefined) out.estimate_date = t.estimateDate || null;
  if (t.status !== undefined) out.state = t.status;
  if (t.productAvailability !== undefined) out.product_availability = t.productAvailability;
  if (t.sourceDocument !== undefined) out.source_document = t.sourceDocument || null;
  if (t.backOrderOf !== undefined) out.back_order_of = t.backOrderOf || null;
  if (t.notes !== undefined) out.notes = t.notes;
  if (t.activities !== undefined) out.activities = t.activities;
  if (t.createdBy !== undefined) out.created_by = t.createdBy || null;
  if (t.fromWarehouseId !== undefined) out.from_warehouse_id = t.fromWarehouseId || null;
  if (t.toWarehouseId !== undefined) out.to_warehouse_id = t.toWarehouseId || null;
  return out;
}

function mapReorderRule(r: Row<any>): ReorderRule {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    warehouseId: r.warehouse_id,
    warehouseName: r.warehouse_name,
    locationId: r.location_id ?? undefined,
    minQty: Number(r.min_qty ?? 0),
    maxQty: Number(r.max_qty ?? 0),
    reorderQty: Number(r.reorder_qty ?? 0),
    leadTimeDays: Number(r.lead_time_days ?? 0),
    isActive: !!r.is_active,
    lastTriggered: toISO(r.last_triggered),
    createdAt: toISO(r.created_at)!,
    updatedAt: toISO(r.updated_at)!,
  };
}
function reorderRuleToRow(r: Partial<ReorderRule>): any {
  const out: Record<string, any> = {};
  if (r.productId !== undefined) out.product_id = r.productId;
  if (r.productName !== undefined) out.product_name = r.productName;
  if (r.warehouseId !== undefined) out.warehouse_id = r.warehouseId;
  if (r.warehouseName !== undefined) out.warehouse_name = r.warehouseName;
  if (r.locationId !== undefined) out.location_id = r.locationId || null;
  if (r.minQty !== undefined) out.min_qty = r.minQty;
  if (r.maxQty !== undefined) out.max_qty = r.maxQty;
  if (r.reorderQty !== undefined) out.reorder_qty = r.reorderQty;
  if (r.leadTimeDays !== undefined) out.lead_time_days = r.leadTimeDays;
  if (r.isActive !== undefined) out.is_active = r.isActive;
  if (r.lastTriggered !== undefined) out.last_triggered = r.lastTriggered || null;
  return out;
}

function mapAdjustmentLine(r: Row<any>): AdjustmentLine {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productSku: r.product_sku,
    theoreticalQty: Number(r.theoretical_qty ?? 0),
    countedQty: Number(r.counted_qty ?? 0),
    difference: Number(r.difference ?? 0),
    lotId: r.lot_id ?? undefined,
    serialNumbers: r.serial_numbers ?? [],
    unitCost: Number(r.unit_cost ?? 0),
    valueDifference: Number(r.value_difference ?? 0),
  };
}
function adjustmentLineToRow(adjustmentId: string, l: AdjustmentLine): any {
  return {
    adjustment_id: adjustmentId,
    product_id: l.productId,
    product_name: l.productName,
    product_sku: l.productSku,
    theoretical_qty: l.theoreticalQty,
    counted_qty: l.countedQty,
    difference: l.difference,
    lot_id: l.lotId || null,
    serial_numbers: l.serialNumbers ?? [],
    unit_cost: l.unitCost,
    value_difference: l.valueDifference,
  };
}

function mapAdjustment(r: Row<any>, lines: AdjustmentLine[] = []): InventoryAdjustment {
  return {
    id: r.id,
    reference: r.reference,
    locationId: r.location_id ?? '',
    locationName: r.location_name ?? '',
    reason: r.reason,
    status: r.status,
    lines,
    notes: r.notes ?? undefined,
    createdBy: r.created_by ?? '',
    approvedBy: r.approved_by ?? undefined,
    approvedAt: toISO(r.approved_at),
    createdAt: toISO(r.created_at)!,
    updatedAt: toISO(r.updated_at)!,
  };
}
function adjustmentToRow(a: Partial<InventoryAdjustment>): any {
  const out: Record<string, any> = {};
  if (a.reference !== undefined) out.reference = a.reference;
  if (a.locationId !== undefined) out.location_id = a.locationId || null;
  if (a.locationName !== undefined) out.location_name = a.locationName || null;
  if (a.reason !== undefined) out.reason = a.reason;
  if (a.status !== undefined) out.status = a.status;
  if (a.notes !== undefined) out.notes = a.notes || null;
  if (a.createdBy !== undefined) out.created_by = a.createdBy || null;
  return out;
}

// ----------------------------------------------------------------------------
// PRODUCTS
// ----------------------------------------------------------------------------
export async function getProductsAsync(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}
export async function getProductAsync(id: string): Promise<Product | undefined> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : undefined;
}
export async function getProductByBarcodeAsync(barcode: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`barcode.eq.${barcode},barcodes.cs.{${barcode}}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : undefined;
}
export async function saveProductAsync(product: Product): Promise<Product> {
  const row = productToRow(product);
  if (product.id && !product.id.startsWith('new-')) {
    const { data, error } = await supabase.from('products').update(row).eq('id', product.id).select().single();
    if (error) throw error;
    return mapProduct(data);
  }
  const { data, error } = await supabase.from('products').insert(row).select().single();
  if (error) throw error;
  return mapProduct(data);
}
export async function deleteProductAsync(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// WAREHOUSES
// ----------------------------------------------------------------------------
export async function getWarehousesAsync(): Promise<Warehouse[]> {
  const { data, error } = await supabase.from('warehouses').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapWarehouse);
}
export async function getWarehouseAsync(id: string): Promise<Warehouse | undefined> {
  const { data, error } = await supabase.from('warehouses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapWarehouse(data) : undefined;
}
export async function saveWarehouseAsync(w: Warehouse): Promise<Warehouse> {
  const row = warehouseToRow(w);
  if (w.id && !w.id.startsWith('new-')) {
    const { data, error } = await supabase.from('warehouses').update(row).eq('id', w.id).select().single();
    if (error) throw error;
    return mapWarehouse(data);
  }
  const { data, error } = await supabase.from('warehouses').insert(row).select().single();
  if (error) throw error;
  return mapWarehouse(data);
}
export async function deleteWarehouseAsync(id: string): Promise<void> {
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// LOCATIONS
// ----------------------------------------------------------------------------
export async function getLocationsAsync(): Promise<Location[]> {
  const { data, error } = await supabase.from('warehouse_locations').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapLocation);
}
export async function getLocationAsync(id: string): Promise<Location | undefined> {
  const { data, error } = await supabase.from('warehouse_locations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapLocation(data) : undefined;
}
export async function getLocationsByWarehouseAsync(warehouseId: string): Promise<Location[]> {
  const { data, error } = await supabase.from('warehouse_locations').select('*').eq('warehouse_id', warehouseId).order('name');
  if (error) throw error;
  return (data ?? []).map(mapLocation);
}
export async function saveLocationAsync(l: Location): Promise<Location> {
  const row = locationToRow(l);
  if (l.id && !l.id.startsWith('new-')) {
    const { data, error } = await supabase.from('warehouse_locations').update(row).eq('id', l.id).select().single();
    if (error) throw error;
    return mapLocation(data);
  }
  const { data, error } = await supabase.from('warehouse_locations').insert(row).select().single();
  if (error) throw error;
  return mapLocation(data);
}
export async function deleteLocationAsync(id: string): Promise<void> {
  const { error } = await supabase.from('warehouse_locations').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// LOTS
// ----------------------------------------------------------------------------
export async function getLotsAsync(): Promise<Lot[]> {
  const { data, error } = await supabase.from('lots').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapLot);
}
export async function getLotsByProductAsync(productId: string): Promise<Lot[]> {
  const { data, error } = await supabase.from('lots').select('*').eq('product_id', productId).order('name');
  if (error) throw error;
  return (data ?? []).map(mapLot);
}
export async function saveLotAsync(l: Lot): Promise<Lot> {
  const row = lotToRow(l);
  if (l.id && !l.id.startsWith('new-')) {
    const { data, error } = await supabase.from('lots').update(row).eq('id', l.id).select().single();
    if (error) throw error;
    return mapLot(data);
  }
  const { data, error } = await supabase.from('lots').insert(row).select().single();
  if (error) throw error;
  return mapLot(data);
}
export async function deleteLotAsync(id: string): Promise<void> {
  const { error } = await supabase.from('lots').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// SERIAL NUMBERS
// ----------------------------------------------------------------------------
export async function getSerialNumbersAsync(): Promise<SerialNumber[]> {
  const { data, error } = await supabase.from('serial_numbers').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapSerial);
}
export async function getSerialsByProductAsync(productId: string): Promise<SerialNumber[]> {
  const { data, error } = await supabase.from('serial_numbers').select('*').eq('product_id', productId).order('name');
  if (error) throw error;
  return (data ?? []).map(mapSerial);
}
export async function getAvailableSerialsAsync(productId: string): Promise<SerialNumber[]> {
  const { data, error } = await supabase.from('serial_numbers')
    .select('*').eq('product_id', productId).eq('status', 'available').order('name');
  if (error) throw error;
  return (data ?? []).map(mapSerial);
}
export async function saveSerialNumberAsync(s: SerialNumber): Promise<SerialNumber> {
  const row = serialToRow(s);
  if (s.id && !s.id.startsWith('new-')) {
    const { data, error } = await supabase.from('serial_numbers').update(row).eq('id', s.id).select().single();
    if (error) throw error;
    return mapSerial(data);
  }
  const { data, error } = await supabase.from('serial_numbers').insert(row).select().single();
  if (error) throw error;
  return mapSerial(data);
}
export async function updateSerialStatusAsync(
  serialId: string,
  status: SerialNumber['status'],
  locationId?: string,
): Promise<void> {
  const row: any = { status };
  if (locationId !== undefined) row.location_id = locationId || null;
  const { error } = await supabase.from('serial_numbers').update(row).eq('id', serialId);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// STOCK MOVES (header + lines)
// ----------------------------------------------------------------------------
export async function getStockMovesAsync(): Promise<StockMove[]> {
  const { data, error } = await supabase
    .from('stock_moves')
    .select('*, stock_move_lines(*)')
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => mapStockMove(r, (r.stock_move_lines ?? []).map(mapStockMoveLine)));
}
export async function getStockMoveAsync(id: string): Promise<StockMove | undefined> {
  const { data, error } = await supabase
    .from('stock_moves')
    .select('*, stock_move_lines(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapStockMove(data, ((data as any).stock_move_lines ?? []).map(mapStockMoveLine));
}
export async function getStockMovesByStateAsync(state: StockMoveState): Promise<StockMove[]> {
  const { data, error } = await supabase
    .from('stock_moves')
    .select('*, stock_move_lines(*)')
    .eq('state', state);
  if (error) throw error;
  return (data ?? []).map((r: any) => mapStockMove(r, (r.stock_move_lines ?? []).map(mapStockMoveLine)));
}
export async function saveStockMoveAsync(move: StockMove): Promise<StockMove> {
  const headerRow = stockMoveToRow(move);
  let id = move.id;
  if (id && !id.startsWith('new-')) {
    const { error } = await supabase.from('stock_moves').update(headerRow).eq('id', id);
    if (error) throw error;
    // Replace lines: simple strategy — delete and reinsert
    const del = await supabase.from('stock_move_lines').delete().eq('stock_move_id', id);
    if (del.error) throw del.error;
  } else {
    const { data, error } = await supabase.from('stock_moves').insert(headerRow).select('id').single();
    if (error) throw error;
    id = data.id;
  }
  if (move.lines.length) {
    const { error: linesErr } = await supabase
      .from('stock_move_lines')
      .insert(move.lines.map((l) => stockMoveLineToRow(id!, l)));
    if (linesErr) throw linesErr;
  }
  return (await getStockMoveAsync(id!))!;
}
export async function deleteStockMoveAsync(id: string): Promise<void> {
  const { error } = await supabase.from('stock_moves').delete().eq('id', id);
  if (error) throw error;
}
export async function validateStockMoveAsync(moveId: string): Promise<void> {
  const { error } = await supabase.rpc('inv_validate_stock_move' as any, { _move_id: moveId });
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// TRANSFERS (legacy shape)
// ----------------------------------------------------------------------------
export async function getTransfersAsync(): Promise<InventoryTransfer[]> {
  const { data, error } = await supabase
    .from('transfers')
    .select('*, transfer_lines(*)')
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => mapTransfer(r, (r.transfer_lines ?? []).map(mapTransferLine)));
}
export async function getTransferAsync(id: string): Promise<InventoryTransfer | undefined> {
  const { data, error } = await supabase
    .from('transfers')
    .select('*, transfer_lines(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapTransfer(data, ((data as any).transfer_lines ?? []).map(mapTransferLine));
}
export async function saveTransferAsync(t: InventoryTransfer): Promise<InventoryTransfer> {
  const headerRow = transferToRow(t);
  // Auto-assign FY-based internal_transfer reference on first save when missing or legacy TRF/...
  const isNewSave = !t.id || t.id.startsWith('new-');
  if (isNewSave && (!t.reference || /^TRF\//.test(t.reference))) {
    const { generateDocumentNumber } = await import('@/lib/services/numbering/api');
    headerRow.reference = await generateDocumentNumber('internal_transfer');
  }
  let id = t.id;
  if (id && !id.startsWith('new-')) {
    const { error } = await supabase.from('transfers').update(headerRow).eq('id', id);
    if (error) throw error;
    const del = await supabase.from('transfer_lines').delete().eq('transfer_id', id);
    if (del.error) throw del.error;
  } else {
    const { data, error } = await supabase.from('transfers').insert(headerRow).select('id').single();
    if (error) throw error;
    id = data.id;
  }
  if (t.moves?.length) {
    const { error: linesErr } = await supabase
      .from('transfer_lines')
      .insert(t.moves.map((l) => transferLineToRow(id!, l)));
    if (linesErr) throw linesErr;
  }
  return (await getTransferAsync(id!))!;
}
export async function deleteTransferAsync(id: string): Promise<void> {
  const { error } = await supabase.from('transfers').delete().eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// REORDER RULES
// ----------------------------------------------------------------------------
export async function getReorderRulesAsync(): Promise<ReorderRule[]> {
  const { data, error } = await supabase.from('reorder_rules').select('*').order('product_name');
  if (error) throw error;
  return (data ?? []).map(mapReorderRule);
}
export async function getReorderRuleAsync(id: string): Promise<ReorderRule | undefined> {
  const { data, error } = await supabase.from('reorder_rules').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapReorderRule(data) : undefined;
}
export async function saveReorderRuleAsync(r: ReorderRule): Promise<ReorderRule> {
  const row = reorderRuleToRow(r);
  if (r.id && !r.id.startsWith('new-')) {
    const { data, error } = await supabase.from('reorder_rules').update(row).eq('id', r.id).select().single();
    if (error) throw error;
    return mapReorderRule(data);
  }
  const { data, error } = await supabase.from('reorder_rules').insert(row).select().single();
  if (error) throw error;
  return mapReorderRule(data);
}
export async function deleteReorderRuleAsync(id: string): Promise<void> {
  const { error } = await supabase.from('reorder_rules').delete().eq('id', id);
  if (error) throw error;
}
export async function checkReorderRulesAsync(): Promise<ReorderRule[]> {
  // Fetch active rules + product stock levels; filter client-side.
  const [rulesRes, productsRes] = await Promise.all([
    supabase.from('reorder_rules').select('*').eq('is_active', true),
    supabase.from('products').select('id, stock_on_hand'),
  ]);
  if (rulesRes.error) throw rulesRes.error;
  if (productsRes.error) throw productsRes.error;
  const stockById = new Map<string, number>(
    (productsRes.data ?? []).map((p: any) => [p.id, Number(p.stock_on_hand ?? 0)]),
  );
  return (rulesRes.data ?? [])
    .filter((r: any) => (stockById.get(r.product_id) ?? 0) <= Number(r.min_qty ?? 0))
    .map(mapReorderRule);
}

// ----------------------------------------------------------------------------
// ADJUSTMENTS
// ----------------------------------------------------------------------------
export async function getAdjustmentsAsync(): Promise<InventoryAdjustment[]> {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .select('*, adjustment_lines(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => mapAdjustment(r, (r.adjustment_lines ?? []).map(mapAdjustmentLine)));
}
export async function getAdjustmentAsync(id: string): Promise<InventoryAdjustment | undefined> {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .select('*, adjustment_lines(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapAdjustment(data, ((data as any).adjustment_lines ?? []).map(mapAdjustmentLine));
}
export async function saveAdjustmentAsync(a: InventoryAdjustment): Promise<InventoryAdjustment> {
  const headerRow = adjustmentToRow(a);
  // Auto-assign FY-based stock_count reference on first save
  if ((!a.reference || a.reference === '') && (!a.id || a.id.startsWith('new-'))) {
    const { generateDocumentNumber } = await import('@/lib/services/numbering/api');
    headerRow.reference = await generateDocumentNumber('stock_count');
  }
  let id = a.id;
  if (id && !id.startsWith('new-')) {
    const { error } = await supabase.from('inventory_adjustments').update(headerRow).eq('id', id);
    if (error) throw error;
    const del = await supabase.from('adjustment_lines').delete().eq('adjustment_id', id);
    if (del.error) throw del.error;
  } else {
    const { data, error } = await supabase.from('inventory_adjustments').insert(headerRow).select('id').single();
    if (error) throw error;
    id = data.id;
  }
  if (a.lines.length) {
    const { error: linesErr } = await supabase
      .from('adjustment_lines')
      .insert(a.lines.map((l) => adjustmentLineToRow(id!, l)));
    if (linesErr) throw linesErr;
  }
  return (await getAdjustmentAsync(id!))!;
}
export async function approveAdjustmentAsync(adjustmentId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('inv_approve_adjustment' as any, {
    _adjustment_id: adjustmentId,
    _approved_by: userId,
  });
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// VALUATION / FORECAST helpers (computed)
// ----------------------------------------------------------------------------
export async function getStockValuationAsync(): Promise<{
  totalValue: number;
  byCategory: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('products')
    .select('category, stock_on_hand, cost_price, type, track_inventory');
  if (error) throw error;
  let totalValue = 0;
  const byCategory: Record<string, number> = {};
  (data ?? []).forEach((p: any) => {
    if (p.type !== 'stockable' || !p.track_inventory) return;
    const value = Number(p.stock_on_hand ?? 0) * Number(p.cost_price ?? 0);
    totalValue += value;
    const cat = p.category ?? '';
    byCategory[cat] = (byCategory[cat] ?? 0) + value;
  });
  return { totalValue, byCategory };
}

export async function getForecastedStockAsync(productId: string): Promise<{
  incoming: number;
  outgoing: number;
  forecasted: number;
}> {
  const [productRes, linesRes] = await Promise.all([
    supabase.from('products').select('stock_on_hand').eq('id', productId).maybeSingle(),
    supabase
      .from('stock_move_lines')
      .select('demand_qty, done_qty, stock_moves!inner(operation_type, state)')
      .eq('product_id', productId),
  ]);
  if (productRes.error) throw productRes.error;
  if (linesRes.error) throw linesRes.error;
  const onHand = Number(productRes.data?.stock_on_hand ?? 0);
  let incoming = 0;
  let outgoing = 0;
  (linesRes.data ?? []).forEach((l: any) => {
    const move = l.stock_moves;
    if (!move || move.state === 'done' || move.state === 'cancelled') return;
    const remaining = Number(l.demand_qty ?? 0) - Number(l.done_qty ?? 0);
    if (move.operation_type === 'receipt') incoming += remaining;
    else if (move.operation_type === 'delivery') outgoing += remaining;
  });
  return { incoming, outgoing, forecasted: onHand + incoming - outgoing };
}