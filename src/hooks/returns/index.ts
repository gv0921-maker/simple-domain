import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/returns';

export const returnKeys = {
  all: ['returns'] as const,
  list: (f: api.ReturnFilters) => ['returns', 'list', f] as const,
  byId: (id: string) => ['returns', 'detail', id] as const,
  forInvoice: (invId: string) => ['returns', 'for-invoice', invId] as const,
  forSO: (soId: string) => ['returns', 'for-so', soId] as const,
  invoiceReturnable: (invId: string) => ['returns', 'invoice-returnable', invId] as const,
  eligibility: (sid: string) => ['returns', 'eligibility', sid] as const,
};

export function useReturnRequests(filters: api.ReturnFilters = {}) {
  return useQuery({ queryKey: returnKeys.list(filters), queryFn: () => api.getReturnRequests(filters) });
}
export function useReturnRequest(id: string | undefined) {
  return useQuery({
    queryKey: returnKeys.byId(id ?? ''),
    queryFn: () => api.getReturnRequestById(id!),
    enabled: !!id,
  });
}
export function useReturnsForInvoice(invoiceId: string | null | undefined) {
  return useQuery({
    queryKey: returnKeys.forInvoice(invoiceId ?? ''),
    queryFn: () => api.getReturnsForInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
}
export function useReturnsForSO(soId: string | null | undefined) {
  return useQuery({
    queryKey: returnKeys.forSO(soId ?? ''),
    queryFn: () => api.getReturnsForSO(soId!),
    enabled: !!soId,
  });
}
export function useReturnableItemsForInvoice(invoiceId: string | null | undefined) {
  return useQuery({
    queryKey: returnKeys.invoiceReturnable(invoiceId ?? ''),
    queryFn: () => api.getReturnableItemsForInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
}

function inv(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: returnKeys.all });
}

export function useCreateReturnRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { invoiceId: string; items: { serial_id: string; qty?: number }[]; reason: string; issueDescription: string | null }) =>
      api.createReturnRequest(args.invoiceId, args.items, args.reason, args.issueDescription),
    onSuccess: () => inv(qc),
  });
}
export function useSubmitReturnForApproval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.submitForApproval, onSuccess: () => inv(qc) });
}
export function useApproveReturn() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.approveReturnRequest, onSuccess: () => inv(qc) });
}
export function useRejectReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { rtId: string; reason: string }) => api.rejectReturnRequest(args.rtId, args.reason),
    onSuccess: () => inv(qc),
  });
}
export function useCancelReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { rtId: string; reason: string }) => api.cancelReturnRequest(args.rtId, args.reason),
    onSuccess: () => inv(qc),
  });
}
export function useRecordReturnQC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { itemId: string; conditionGrade: api.ConditionGrade; notes: string | null; images: string[] }) =>
      api.recordReturnQC(args.itemId, args.conditionGrade, args.notes, args.images),
    onSuccess: () => inv(qc),
  });
}
export function useUploadReturnPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { rtId: string; file: File; type: 'customer' | 'qc' }) =>
      api.uploadReturnPhoto(args.rtId, args.file, args.type),
    onSuccess: () => inv(qc),
  });
}