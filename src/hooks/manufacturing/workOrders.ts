import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/manufacturing/workOrders';

const KEY = ['mfg-work-orders'] as const;

export function useWorkOrdersV2(filters?: Parameters<typeof svc.fetchWorkOrders>[0]) {
  return useQuery({
    queryKey: [...KEY, 'list', filters ?? {}],
    queryFn: () => svc.fetchWorkOrders(filters),
  });
}

export function useWorkOrderV2(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => svc.fetchWorkOrderById(id!),
    enabled: !!id,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateWorkOrderV2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: svc.WorkOrderInput) => svc.createWorkOrder(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateWorkOrderDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Partial<svc.WorkOrderInput> }) =>
      svc.updateWorkOrderDraft(args.id, args.input),
    onSuccess: () => invalidate(qc),
  });
}

export function useSubmitForApproval() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.submitForApproval(id), onSuccess: () => invalidate(qc) });
}
export function useApproveWorkOrder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.approveWorkOrder(id), onSuccess: () => invalidate(qc) });
}
export function useRejectWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; reason: string }) => svc.rejectWorkOrder(args.id, args.reason),
    onSuccess: () => invalidate(qc),
  });
}
export function usePlaceWorkOrder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.placeWorkOrder(id), onSuccess: () => invalidate(qc) });
}
export function useCancelWorkOrderV2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; reason: string }) => svc.cancelWorkOrder(args.id, args.reason),
    onSuccess: () => invalidate(qc),
  });
}
export function useAssignFactoryIncharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; userId: string | null }) => svc.assignFactoryIncharge(args.id, args.userId),
    onSuccess: () => invalidate(qc),
  });
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: ['mfg-assignable-users'],
    queryFn: () => svc.fetchAssignableUsers(),
  });
}

export function useWorkOrderForSOLine(soLineId: string | undefined) {
  return useQuery({
    queryKey: ['mfg-wo-for-so-line', soLineId],
    queryFn: () => svc.fetchWorkOrderForSOLine(soLineId!),
    enabled: !!soLineId,
  });
}