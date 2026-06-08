import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as mfg from '@/lib/services/manufacturing/api';
import type {
  BillOfMaterials, WorkOrder, WorkCenter,
} from '@/lib/services/manufacturing/api';
import { manufacturingKeys } from './keys';

export { manufacturingKeys };

// ---------- BOMs ----------
export const useBOMs = () =>
  useQuery({ queryKey: manufacturingKeys.boms(), queryFn: mfg.fetchBOMs });

export const useBOM = (id: string | undefined) =>
  useQuery({
    queryKey: id ? manufacturingKeys.bom(id) : ['noop'],
    queryFn: () => mfg.fetchBOMById(id!),
    enabled: !!id,
  });

export function useSaveBOM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: BillOfMaterials) => mfg.saveBOM(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: manufacturingKeys.boms() }),
  });
}

export function useDeleteBOM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mfg.deleteBOM(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: manufacturingKeys.boms() }),
  });
}

// ---------- Work Orders ----------
export const useWorkOrders = () =>
  useQuery({ queryKey: manufacturingKeys.workOrders(), queryFn: mfg.fetchWorkOrders });

export const useWorkOrder = (id: string | undefined) =>
  useQuery({
    queryKey: id ? manufacturingKeys.workOrder(id) : ['noop'],
    queryFn: () => mfg.fetchWorkOrderById(id!),
    enabled: !!id,
  });

export function useSaveWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (w: WorkOrder) => mfg.saveWorkOrder(w),
    onSuccess: () => qc.invalidateQueries({ queryKey: manufacturingKeys.workOrders() }),
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mfg.deleteWorkOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: manufacturingKeys.workOrders() }),
  });
}

// ---------- Work Centers ----------
export const useWorkCenters = () =>
  useQuery({ queryKey: manufacturingKeys.workCenters(), queryFn: mfg.fetchWorkCenters });

export function useSaveWorkCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wc: WorkCenter) => mfg.saveWorkCenter(wc),
    onSuccess: () => qc.invalidateQueries({ queryKey: manufacturingKeys.workCenters() }),
  });
}

export function useDeleteWorkCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mfg.deleteWorkCenter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: manufacturingKeys.workCenters() }),
  });
}