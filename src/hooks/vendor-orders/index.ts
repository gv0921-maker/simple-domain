import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/vendor-orders';

export const voKeys = {
  all: ['vendor-orders'] as const,
  list: (f: api.VOFilters) => ['vendor-orders', 'list', f] as const,
  byId: (id: string) => ['vendor-orders', 'detail', id] as const,
  forSO: (soId: string) => ['vendor-orders', 'for-so', soId] as const,
  grs: (voId: string) => ['vendor-orders', 'grs', voId] as const,
};

export function useVendorOrders(filters: api.VOFilters = {}) {
  return useQuery({ queryKey: voKeys.list(filters), queryFn: () => api.getVendorOrders(filters) });
}

export function useVendorOrder(id: string | undefined) {
  return useQuery({
    queryKey: voKeys.byId(id ?? ''),
    queryFn: () => api.getVendorOrderById(id!),
    enabled: !!id,
  });
}

export function useVendorOrdersForSO(salesOrderId: string | undefined) {
  return useQuery({
    queryKey: voKeys.forSO(salesOrderId ?? ''),
    queryFn: () => api.getVendorOrdersForSO(salesOrderId!),
    enabled: !!salesOrderId,
  });
}

export function useGRsForVO(voId: string | undefined) {
  return useQuery({
    queryKey: voKeys.grs(voId ?? ''),
    queryFn: () => api.getGRsForVO(voId!),
    enabled: !!voId,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: voKeys.all });
}

export function useCreateVendorOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createVendorOrderDraft,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateVODraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { voId: string; input: Parameters<typeof api.updateDraft>[1] }) => api.updateDraft(args.voId, args.input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useReplaceVOLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { voId: string; lines: api.CreateVOLineInput[] }) => api.replaceDraftLines(args.voId, args.lines),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useSubmitVOForApproval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.submitForApproval, onSuccess: () => invalidateAll(qc) });
}

export function useApproveVO() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.approveVendorOrder, onSuccess: () => invalidateAll(qc) });
}

export function usePlaceVO() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.placeVendorOrder, onSuccess: () => invalidateAll(qc) });
}

export function useCancelVO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { voId: string; reason: string }) => api.cancelVendorOrder(args.voId, args.reason),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRecordVOReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { voId: string; lineReceipts: api.LineReceipt[] }) => api.recordReceipt(args.voId, args.lineReceipts),
    onSuccess: () => invalidateAll(qc),
  });
}