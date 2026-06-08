// Centralised TanStack Query keys for the Inventory module.
export const inventoryKeys = {
  all: ['inventory'] as const,

  products: () => [...inventoryKeys.all, 'products'] as const,
  product: (id: string) => [...inventoryKeys.products(), id] as const,
  productByBarcode: (barcode: string) => [...inventoryKeys.products(), 'barcode', barcode] as const,

  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  warehouse: (id: string) => [...inventoryKeys.warehouses(), id] as const,

  locations: () => [...inventoryKeys.all, 'locations'] as const,
  locationsByWarehouse: (warehouseId: string) =>
    [...inventoryKeys.locations(), 'warehouse', warehouseId] as const,
  location: (id: string) => [...inventoryKeys.locations(), id] as const,

  lots: () => [...inventoryKeys.all, 'lots'] as const,
  lotsByProduct: (productId: string) => [...inventoryKeys.lots(), 'product', productId] as const,

  serials: () => [...inventoryKeys.all, 'serials'] as const,
  serialsByProduct: (productId: string) => [...inventoryKeys.serials(), 'product', productId] as const,
  availableSerials: (productId: string) =>
    [...inventoryKeys.serials(), 'available', productId] as const,

  stockMoves: () => [...inventoryKeys.all, 'stock-moves'] as const,
  stockMove: (id: string) => [...inventoryKeys.stockMoves(), id] as const,
  stockMovesByState: (state: string) => [...inventoryKeys.stockMoves(), 'state', state] as const,

  transfers: () => [...inventoryKeys.all, 'transfers'] as const,
  transfer: (id: string) => [...inventoryKeys.transfers(), id] as const,

  reorderRules: () => [...inventoryKeys.all, 'reorder-rules'] as const,
  reorderRule: (id: string) => [...inventoryKeys.reorderRules(), id] as const,
  reorderTriggered: () => [...inventoryKeys.reorderRules(), 'triggered'] as const,

  adjustments: () => [...inventoryKeys.all, 'adjustments'] as const,
  adjustment: (id: string) => [...inventoryKeys.adjustments(), id] as const,

  valuation: () => [...inventoryKeys.all, 'valuation'] as const,
  forecast: (productId: string) => [...inventoryKeys.all, 'forecast', productId] as const,
} as const;