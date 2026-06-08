import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as qcApi from '@/lib/services/qc/api';
import * as dqApi from '@/lib/services/qc/delivery';

export const qcKeys = {
  all: ['qc'] as const,
  byReference: (t: qcApi.QCReferenceType, id: string) => ['qc', 'ref', t, id] as const,
  byProduct: (productId: string) => ['qc', 'product', productId] as const,
};

export const useQCByReference = (t: qcApi.QCReferenceType, id: string | undefined) =>
  useQuery({
    queryKey: id ? qcKeys.byReference(t, id) : ['noop'],
    queryFn: () => qcApi.getQCByReferenceAsync(t, id!),
    enabled: !!id,
  });

export const useQCByProduct = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? qcKeys.byProduct(productId) : ['noop'],
    queryFn: () => qcApi.getQCByProductAsync(productId!),
    enabled: !!productId,
  });

export function useCreateGoodsReceiptQC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: qcApi.CreateGoodsReceiptQCInput[]) =>
      qcApi.createGoodsReceiptQCAsync(inputs),
    onSuccess: () => qc.invalidateQueries({ queryKey: qcKeys.all }),
  });
}

// ---------- Delivery QC ----------
export const deliveryQCKeys = {
  all: ['delivery-qc'] as const,
  byOrder: (id: string) => ['delivery-qc', 'order', id] as const,
};

export const useDeliveryQC = (salesOrderId: string | undefined) =>
  useQuery({
    queryKey: salesOrderId ? deliveryQCKeys.byOrder(salesOrderId) : ['noop'],
    queryFn: () => dqApi.getLatestDeliveryQCAsync(salesOrderId!),
    enabled: !!salesOrderId,
  });

export function useCreateDeliveryQC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: dqApi.CreateDeliveryQCInput) => dqApi.createDeliveryQCAsync(input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: deliveryQCKeys.byOrder(vars.salesOrderId) });
    },
  });
}