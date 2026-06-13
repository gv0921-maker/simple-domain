import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/factory-inventory';

const KEY = ['factory-inventory'] as const;

export function useFactoryInventoryItems(includeInactive = false) {
  return useQuery({
    queryKey: [...KEY, 'items', includeInactive],
    queryFn: () => svc.getFactoryInventoryItems(includeInactive),
  });
}
export function useLowStockItems() {
  return useQuery({ queryKey: [...KEY, 'low-stock'], queryFn: svc.getLowStockItems });
}
export function useFactoryStockMovements(filters?: Parameters<typeof svc.getFactoryStockMovements>[0]) {
  return useQuery({
    queryKey: [...KEY, 'movements', filters ?? {}],
    queryFn: () => svc.getFactoryStockMovements(filters),
  });
}

function inv(qc: ReturnType<typeof useQueryClient>) { qc.invalidateQueries({ queryKey: KEY }); }

export function useCreateFactoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: svc.ItemInput) => svc.createInventoryItem(input), onSuccess: () => inv(qc) });
}
export function useUpdateFactoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Partial<svc.ItemInput> }) => svc.updateInventoryItem(args.id, args.input),
    onSuccess: () => inv(qc),
  });
}
export function useDeleteFactoryItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.deleteInventoryItem(id), onSuccess: () => inv(qc) });
}
export function useRecordInbound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { itemId: string; quantity: number; notes?: string | null }) =>
      svc.recordInbound(args.itemId, args.quantity, args.notes),
    onSuccess: () => inv(qc),
  });
}
export function useRecordAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { itemId: string; quantity: number; notes?: string | null }) =>
      svc.recordAdjustment(args.itemId, args.quantity, args.notes),
    onSuccess: () => inv(qc),
  });
}