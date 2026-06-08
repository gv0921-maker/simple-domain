// TanStack Query hooks for the Inventory module.
// Pages should consume these hooks instead of calling the async services
// directly — they handle caching, loading state, and cross-query invalidation.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inv from '@/lib/services/inventory/api';
import { inventoryKeys } from './keys';
import type {
  Product, Warehouse, Location, Lot, SerialNumber,
  StockMove, InventoryTransfer, ReorderRule, InventoryAdjustment, StockMoveState,
} from '@/lib/data/inventory/types';

export { inventoryKeys };

// ---------- Products ----------
export const useProducts = () =>
  useQuery({ queryKey: inventoryKeys.products(), queryFn: inv.getProductsAsync });

export const useProduct = (id: string | undefined) =>
  useQuery({
    queryKey: id ? inventoryKeys.product(id) : ['noop'],
    queryFn: () => inv.getProductAsync(id!),
    enabled: !!id,
  });

export const useProductByBarcode = (barcode: string | undefined) =>
  useQuery({
    queryKey: barcode ? inventoryKeys.productByBarcode(barcode) : ['noop'],
    queryFn: () => inv.getProductByBarcodeAsync(barcode!),
    enabled: !!barcode,
  });

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Product) => inv.saveProductAsync(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.products() }),
  });
}
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteProductAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.products() }),
  });
}

// ---------- Warehouses ----------
export const useWarehouses = () =>
  useQuery({ queryKey: inventoryKeys.warehouses(), queryFn: inv.getWarehousesAsync });
export const useWarehouse = (id: string | undefined) =>
  useQuery({
    queryKey: id ? inventoryKeys.warehouse(id) : ['noop'],
    queryFn: () => inv.getWarehouseAsync(id!),
    enabled: !!id,
  });
export function useSaveWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (w: Warehouse) => inv.saveWarehouseAsync(w),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.warehouses() }),
  });
}
export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteWarehouseAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.warehouses() }),
  });
}

// ---------- Locations ----------
export const useLocations = () =>
  useQuery({ queryKey: inventoryKeys.locations(), queryFn: inv.getLocationsAsync });
export const useLocationsByWarehouse = (warehouseId: string | undefined) =>
  useQuery({
    queryKey: warehouseId ? inventoryKeys.locationsByWarehouse(warehouseId) : ['noop'],
    queryFn: () => inv.getLocationsByWarehouseAsync(warehouseId!),
    enabled: !!warehouseId,
  });
export function useSaveLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (l: Location) => inv.saveLocationAsync(l),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.locations() }),
  });
}
export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteLocationAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.locations() }),
  });
}

// ---------- Lots ----------
export const useLots = () =>
  useQuery({ queryKey: inventoryKeys.lots(), queryFn: inv.getLotsAsync });
export const useLotsByProduct = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? inventoryKeys.lotsByProduct(productId) : ['noop'],
    queryFn: () => inv.getLotsByProductAsync(productId!),
    enabled: !!productId,
  });
export function useSaveLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (l: Lot) => inv.saveLotAsync(l),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.lots() }),
  });
}
export function useDeleteLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteLotAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.lots() }),
  });
}

// ---------- Serial numbers ----------
export const useSerials = () =>
  useQuery({ queryKey: inventoryKeys.serials(), queryFn: inv.getSerialNumbersAsync });
export const useSerialsByProduct = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? inventoryKeys.serialsByProduct(productId) : ['noop'],
    queryFn: () => inv.getSerialsByProductAsync(productId!),
    enabled: !!productId,
  });
export const useAvailableSerials = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? inventoryKeys.availableSerials(productId) : ['noop'],
    queryFn: () => inv.getAvailableSerialsAsync(productId!),
    enabled: !!productId,
  });
export function useSaveSerial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: SerialNumber) => inv.saveSerialNumberAsync(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.serials() }),
  });
}
export function useUpdateSerialStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: SerialNumber['status']; locationId?: string }) =>
      inv.updateSerialStatusAsync(vars.id, vars.status, vars.locationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.serials() }),
  });
}

// ---------- Stock moves ----------
export const useStockMoves = () =>
  useQuery({ queryKey: inventoryKeys.stockMoves(), queryFn: inv.getStockMovesAsync });
export const useStockMove = (id: string | undefined) =>
  useQuery({
    queryKey: id ? inventoryKeys.stockMove(id) : ['noop'],
    queryFn: () => inv.getStockMoveAsync(id!),
    enabled: !!id,
  });
export const useStockMovesByState = (state: StockMoveState | undefined) =>
  useQuery({
    queryKey: state ? inventoryKeys.stockMovesByState(state) : ['noop'],
    queryFn: () => inv.getStockMovesByStateAsync(state!),
    enabled: !!state,
  });
export function useSaveStockMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: StockMove) => inv.saveStockMoveAsync(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.stockMoves() });
      qc.invalidateQueries({ queryKey: inventoryKeys.products() });
    },
  });
}
export function useDeleteStockMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteStockMoveAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.stockMoves() }),
  });
}
export function useValidateStockMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.validateStockMoveAsync(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.stockMoves() });
      qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      qc.invalidateQueries({ queryKey: inventoryKeys.valuation() });
    },
  });
}

// ---------- Transfers ----------
export const useTransfers = () =>
  useQuery({ queryKey: inventoryKeys.transfers(), queryFn: inv.getTransfersAsync });
export const useTransfer = (id: string | undefined) =>
  useQuery({
    queryKey: id ? inventoryKeys.transfer(id) : ['noop'],
    queryFn: () => inv.getTransferAsync(id!),
    enabled: !!id,
  });
export function useSaveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: InventoryTransfer) => inv.saveTransferAsync(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.transfers() }),
  });
}
export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteTransferAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.transfers() }),
  });
}

// ---------- Reorder rules ----------
export const useReorderRules = () =>
  useQuery({ queryKey: inventoryKeys.reorderRules(), queryFn: inv.getReorderRulesAsync });
export const useReorderRule = (id: string | undefined) =>
  useQuery({
    queryKey: id ? inventoryKeys.reorderRule(id) : ['noop'],
    queryFn: () => inv.getReorderRuleAsync(id!),
    enabled: !!id,
  });
export const useTriggeredReorderRules = () =>
  useQuery({ queryKey: inventoryKeys.reorderTriggered(), queryFn: inv.checkReorderRulesAsync });
export function useSaveReorderRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: ReorderRule) => inv.saveReorderRuleAsync(r),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.reorderRules() }),
  });
}
export function useDeleteReorderRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inv.deleteReorderRuleAsync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.reorderRules() }),
  });
}

// ---------- Inventory adjustments ----------
export const useAdjustments = () =>
  useQuery({ queryKey: inventoryKeys.adjustments(), queryFn: inv.getAdjustmentsAsync });
export const useAdjustment = (id: string | undefined) =>
  useQuery({
    queryKey: id ? inventoryKeys.adjustment(id) : ['noop'],
    queryFn: () => inv.getAdjustmentAsync(id!),
    enabled: !!id,
  });
export function useSaveAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: InventoryAdjustment) => inv.saveAdjustmentAsync(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.adjustments() }),
  });
}
export function useApproveAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; userId: string }) =>
      inv.approveAdjustmentAsync(vars.id, vars.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
      qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      qc.invalidateQueries({ queryKey: inventoryKeys.valuation() });
    },
  });
}

// ---------- Valuation / forecast ----------
export const useStockValuation = () =>
  useQuery({ queryKey: inventoryKeys.valuation(), queryFn: inv.getStockValuationAsync });

export const useForecastedStock = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? inventoryKeys.forecast(productId) : ['noop'],
    queryFn: () => inv.getForecastedStockAsync(productId!),
    enabled: !!productId,
  });