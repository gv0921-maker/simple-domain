import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/returns/resolution';
import { returnKeys } from './index';

export const resolutionKeys = {
  exchangesForReturn: (rtId: string) => ['returns', 'exchanges', rtId] as const,
  availableSerials: (pid: string) => ['returns', 'replacement-serials', pid] as const,
  productSearch: (minPrice: number, q: string) => ['returns', 'replacement-products', minPrice, q] as const,
};

function inv(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: returnKeys.all });
  qc.invalidateQueries({ queryKey: ['returns', 'exchanges'] });
  qc.invalidateQueries({ queryKey: ['credit-notes'] });
  qc.invalidateQueries({ queryKey: ['refunds'] });
}

export function useExchangesForReturn(rtId: string | undefined) {
  return useQuery({
    queryKey: resolutionKeys.exchangesForReturn(rtId ?? ''),
    queryFn: () => api.getExchangesForReturn(rtId!),
    enabled: !!rtId,
  });
}

export function useAvailableReplacementSerials(productId: string | null | undefined) {
  return useQuery({
    queryKey: resolutionKeys.availableSerials(productId ?? ''),
    queryFn: () => api.getAvailableSerialsForProduct(productId!),
    enabled: !!productId,
  });
}

export function useEligibleReplacementProducts(minPrice: number, query: string, enabled = true) {
  return useQuery({
    queryKey: resolutionKeys.productSearch(minPrice, query),
    queryFn: () => api.searchEligibleReplacementProducts(minPrice, query),
    enabled,
  });
}

export function useProcessExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { itemId: string; replacementProductId: string }) =>
      api.processExchange(a.itemId, a.replacementProductId),
    onSuccess: () => inv(qc),
  });
}
export function useSelectExchangeSerial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { exchangeId: string; serialId: string }) =>
      api.selectExchangeReplacementSerial(a.exchangeId, a.serialId),
    onSuccess: () => inv(qc),
  });
}
export function useSettleExchangeDifference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: {
      exchangeId: string;
      paymentMode: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi';
      paymentAccountId: string;
      referenceNumber?: string | null;
    }) => api.settleExchangePriceDifference(a.exchangeId, a.paymentMode, a.paymentAccountId, a.referenceNumber ?? null),
    onSuccess: () => inv(qc),
  });
}
export function useCompleteExchange() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.completeExchange, onSuccess: () => inv(qc) });
}
export function useProcessCreditNoteResolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { itemId: string; notes: string | null }) =>
      api.processCreditNote(a.itemId, a.notes),
    onSuccess: () => inv(qc),
  });
}
export function useProcessRefundResolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: {
      itemId: string; amount: number;
      mode: 'cash' | 'bank_transfer' | 'cheque' | 'upi';
      paymentAccountId: string; referenceNumber?: string | null;
    }) => api.processRefund(a.itemId, a.amount, a.mode, a.paymentAccountId, a.referenceNumber ?? null),
    onSuccess: () => inv(qc),
  });
}
export function useApplyStockAction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.applyStockAction, onSuccess: () => inv(qc) });
}
export function useCompleteReturnRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.completeReturnRequest, onSuccess: () => inv(qc) });
}
