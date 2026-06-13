import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/shopfloor';

const KEY = ['shopfloor'] as const;

export function useMyFactoryWOs() {
  return useQuery({ queryKey: [...KEY, 'mine'], queryFn: svc.getMyWorkOrders });
}
export function useAllFactoryWOs() {
  return useQuery({ queryKey: [...KEY, 'all'], queryFn: svc.getAllFactoryWorkOrders });
}
export function useFactoryWO(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, 'detail', id], queryFn: () => svc.getFactoryWO(id!), enabled: !!id });
}
export function useBomEntries(woId: string | undefined) {
  return useQuery({ queryKey: [...KEY, 'bom', woId], queryFn: () => svc.getBomEntries(woId!), enabled: !!woId });
}
export function useFactoryProgressForSO(soId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'so-progress', soId],
    queryFn: () => svc.getFactoryProgressForSO(soId!),
    enabled: !!soId,
  });
}

function inv(qc: ReturnType<typeof useQueryClient>) { qc.invalidateQueries({ queryKey: KEY }); }

export function useStartWork() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.startWork(id), onSuccess: () => inv(qc) });
}
export function useEnterBOM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { woId: string; entries: { factory_inventory_item_id: string; quantity_required: number; notes?: string | null }[] }) =>
      svc.enterBOM(args.woId, args.entries),
    onSuccess: () => inv(qc),
  });
}
export function useStartPolishing() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.startPolishing(id), onSuccess: () => inv(qc) });
}
export function useCompleteFactoryWork() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => svc.completeFactoryWork(id), onSuccess: () => inv(qc) });
}
export function useUploadProgressPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { woId: string; file: File }) => svc.uploadProgressPhoto(args.woId, args.file),
    onSuccess: () => inv(qc),
  });
}