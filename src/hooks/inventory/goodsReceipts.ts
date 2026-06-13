import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gr from '@/lib/services/inventory/goodsReceipt';

export const goodsReceiptKeys = {
  all: ['goodsReceipts'] as const,
  list: () => [...goodsReceiptKeys.all, 'list'] as const,
  detail: (id: string) => [...goodsReceiptKeys.all, 'detail', id] as const,
};

export const useGoodsReceipts = () =>
  useQuery({ queryKey: goodsReceiptKeys.list(), queryFn: gr.listGoodsReceipts });

export const useGoodsReceipt = (id: string | undefined) =>
  useQuery({
    queryKey: id ? goodsReceiptKeys.detail(id) : ['noop'],
    queryFn: () => gr.getGoodsReceiptWithSerials(id!),
    enabled: !!id,
  });

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: gr.CreateGoodsReceiptInput) => gr.createGoodsReceipt(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.all }),
  });
}

export function useUpdateReceivedQuantities(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineUpdates: Array<{ id: string; received_quantity: number }>) =>
      gr.updateReceivedQuantities(grId, lineUpdates),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}

export function useApproveDiscrepancy(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => gr.approveDiscrepancy(grId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}

export function useAdvanceToLabels(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gr.advanceToLabelsStep(grId),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}

export function useGenerateSerialsForLine(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) => gr.generateSerialsForLine(lineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}

export function useMarkLabelsGenerated(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gr.markLabelsGenerated(grId),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}

export function useRecordItemQC(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { serialId: string; passed: boolean; notes?: string; images?: string[] }) =>
      gr.recordItemQC(input.serialId, input.passed, input.notes, input.images),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}

export function useCompleteGRLineQC(grId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { lineId: string; passedSerialIds: string[]; failedSerialIds: string[]; failedNotes?: string }) =>
      gr.completeGRLineQC(input.lineId, input.passedSerialIds, input.failedSerialIds, input.failedNotes),
    onSuccess: () => qc.invalidateQueries({ queryKey: goodsReceiptKeys.detail(grId) }),
  });
}