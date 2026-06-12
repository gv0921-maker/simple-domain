import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/barcode/api';

export const barcodeKeys = {
  all: ['barcode'] as const,
  queue: (filters: api.ScanQueueFilters) => ['barcode', 'queue', filters] as const,
  queueItem: (id: string) => ['barcode', 'queue', 'item', id] as const,
  records: (id: string) => ['barcode', 'records', id] as const,
  history: (f: api.ScanHistoryFilters) => ['barcode', 'history', f] as const,
  labelHistory: (productId?: string) => ['barcode', 'labels', productId ?? 'all'] as const,
};

export function useScanQueue(filters: api.ScanQueueFilters = {}) {
  return useQuery({
    queryKey: barcodeKeys.queue(filters),
    queryFn: () => api.fetchScanQueue(filters),
  });
}

export function useScanQueueItem(id: string | undefined) {
  return useQuery({
    queryKey: barcodeKeys.queueItem(id ?? ''),
    queryFn: () => api.getScanQueueItem(id!),
    enabled: !!id,
  });
}

export function useScanRecords(queueId: string | undefined) {
  return useQuery({
    queryKey: barcodeKeys.records(queueId ?? ''),
    queryFn: () => api.listScanRecords(queueId!),
    enabled: !!queueId,
  });
}

export function useAddToScanQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      documentType: api.ScanDocumentType;
      documentId: string;
      documentReference: string;
      expectedCount: number;
      priority?: api.ScanPriority;
    }) => api.addToScanQueue(
      args.documentType, args.documentId, args.documentReference,
      args.expectedCount, args.priority,
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barcode', 'queue'] }),
  });
}

export function useRecordScan(queueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<api.RecordScanInput, 'scanQueueId'>) =>
      api.recordScan({ ...input, scanQueueId: queueId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: barcodeKeys.records(queueId) });
      qc.invalidateQueries({ queryKey: barcodeKeys.queueItem(queueId) });
      qc.invalidateQueries({ queryKey: ['barcode', 'queue'] });
    },
  });
}

export function useCompleteScanQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { queueId: string; force?: boolean; reason?: string }) =>
      api.completeScanQueue(args.queueId, args.force, args.reason),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: barcodeKeys.queueItem(vars.queueId) });
      qc.invalidateQueries({ queryKey: ['barcode', 'queue'] });
    },
  });
}

export function useBatchGenerateLabels() {
  return useMutation({
    mutationFn: (items: api.BatchLabelItem[]) => api.batchGenerateLabels(items),
  });
}

export function useRecordLabelPrints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { labels: api.LabelData[]; goodsReceiptId?: string | null }) =>
      api.recordLabelPrints(args.labels, args.goodsReceiptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barcode', 'labels'] }),
  });
}

export function useLabelHistory(productId?: string) {
  return useQuery({
    queryKey: barcodeKeys.labelHistory(productId),
    queryFn: () => api.fetchLabelHistory(productId),
  });
}

export function useScanHistory(filters: api.ScanHistoryFilters = {}) {
  return useQuery({
    queryKey: barcodeKeys.history(filters),
    queryFn: () => api.fetchScanHistory(filters),
  });
}