import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as wo from '@/lib/services/inventory/writeOffs';

export const writeOffKeys = {
  all: ['writeOffs'] as const,
  list: (filters?: wo.WriteOffFilters) => [...writeOffKeys.all, 'list', filters ?? {}] as const,
  detail: (id: string) => [...writeOffKeys.all, 'detail', id] as const,
  productBreakdown: (productId: string) => ['productStockBreakdown', productId] as const,
  eligibleSerials: (search: string, productId?: string) =>
    [...writeOffKeys.all, 'eligibleSerials', search, productId ?? null] as const,
};

export const useWriteOffs = (filters: wo.WriteOffFilters = {}) =>
  useQuery({ queryKey: writeOffKeys.list(filters), queryFn: () => wo.getWriteOffs(filters) });

export const useWriteOff = (id: string | undefined) =>
  useQuery({
    queryKey: id ? writeOffKeys.detail(id) : ['noop'],
    queryFn: () => wo.getWriteOffById(id!),
    enabled: !!id,
  });

export const useProductStockBreakdown = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? writeOffKeys.productBreakdown(productId) : ['noop'],
    queryFn: () => wo.getProductStockBreakdown(productId!),
    enabled: !!productId,
  });

export const useEligibleWriteOffSerials = (search: string, productId?: string) =>
  useQuery({
    queryKey: writeOffKeys.eligibleSerials(search, productId),
    queryFn: () => wo.findEligibleSerialsForWriteOff({ search, productId }),
  });

export function useCreateWriteOffDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof wo.createWriteOffDraft>[0]) => wo.createWriteOffDraft(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.all }),
  });
}

export function useUpdateWriteOffDraft(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof wo.updateWriteOffDraft>[1]) => wo.updateWriteOffDraft(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) }),
  });
}

export function useAddItemsToWriteOff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { serialIds: string[]; notes?: string }) =>
      wo.addItemsToWriteOff(id, vars.serialIds, vars.notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) }),
  });
}

export function useRemoveWriteOffItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => wo.removeItemFromWriteOff(id, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) }),
  });
}

export function useUploadEvidencePhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => wo.uploadEvidencePhoto(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) }),
  });
}

export function useRemoveEvidencePhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => wo.removeEvidencePhoto(id, url),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) }),
  });
}

export function useApproveWriteOff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => wo.approveWriteOff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: writeOffKeys.all });
      qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) });
    },
  });
}

export function useCancelWriteOff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => wo.cancelWriteOff(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: writeOffKeys.all });
      qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) });
    },
  });
}

export function useSubmitWriteOffForApproval(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => wo.submitForApproval(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: writeOffKeys.detail(id) }),
  });
}
