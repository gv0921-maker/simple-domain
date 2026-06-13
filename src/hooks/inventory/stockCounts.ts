import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/inventory/stockCounts';

export const stockCountKeys = {
  all: ['stock-counts'] as const,
  list: (f: api.StockCountFilters) => ['stock-counts', 'list', f] as const,
  byId: (id: string) => ['stock-counts', 'detail', id] as const,
  required: ['stock-counts', 'required-this-month'] as const,
  queueId: (id: string) => ['stock-counts', 'queue', id] as const,
};

export function useStockCounts(filters: api.StockCountFilters = {}) {
  return useQuery({ queryKey: stockCountKeys.list(filters), queryFn: () => api.getStockCounts(filters) });
}
export function useStockCount(id: string | undefined) {
  return useQuery({
    queryKey: stockCountKeys.byId(id ?? ''),
    queryFn: () => api.getStockCountById(id!),
    enabled: !!id,
  });
}
export function useIsCountRequiredThisMonth() {
  return useQuery({ queryKey: stockCountKeys.required, queryFn: api.isCountRequiredThisMonth });
}
export function useCountQueueId(id: string | undefined) {
  return useQuery({
    queryKey: stockCountKeys.queueId(id ?? ''),
    queryFn: () => api.getCountQueueId(id!),
    enabled: !!id,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['stock-counts'] });
}

export function useCreateStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { month: number; year: number; warehouseId?: string | null }) =>
      api.createStockCount(args.month, args.year, args.warehouseId),
    onSuccess: () => invalidate(qc),
  });
}
export function useStartCount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.startCount, onSuccess: () => invalidate(qc) });
}
export function useCompleteCount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.completeCount, onSuccess: () => invalidate(qc) });
}
export function useReconcileCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { countId: string; reconciliations: { item_id: string; action: api.ReconcileAction }[] }) =>
      api.reconcileCount(args.countId, args.reconciliations),
    onSuccess: () => invalidate(qc),
  });
}
export function useRequestCountSkip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { year: number; month: number; reason: string }) =>
      api.requestCountSkip(args.year, args.month, args.reason),
    onSuccess: () => invalidate(qc),
  });
}
export function useMarkItemsMissing() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.markItemsMissing, onSuccess: () => invalidate(qc) });
}