import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/sales/deliveryNotes';

const keys = {
  summary: (invoiceId: string) => ['invoice', invoiceId, 'delivery-summary'] as const,
  list: (invoiceId: string) => ['invoice', invoiceId, 'delivery-notes'] as const,
  detail: (dnId: string) => ['delivery-note', dnId] as const,
  serials: (soId: string, productId: string) => ['so', soId, 'available-serials', productId] as const,
};

export const useInvoiceDeliverySummary = (invoiceId: string | undefined) =>
  useQuery({
    queryKey: invoiceId ? keys.summary(invoiceId) : ['noop'],
    queryFn: () => svc.getInvoiceDeliverySummary(invoiceId!),
    enabled: !!invoiceId,
  });

export const useDeliveryNotesForInvoice = (invoiceId: string | undefined) =>
  useQuery({
    queryKey: invoiceId ? keys.list(invoiceId) : ['noop'],
    queryFn: () => svc.getDeliveryNotesForInvoice(invoiceId!),
    enabled: !!invoiceId,
  });

export const useAvailableSerialsForSO = (
  salesOrderId: string | undefined,
  productId: string | undefined,
) =>
  useQuery({
    queryKey: salesOrderId && productId ? keys.serials(salesOrderId, productId) : ['noop'],
    queryFn: () => svc.getAvailableSerialsForSO(salesOrderId!, productId!),
    enabled: !!salesOrderId && !!productId,
  });

export function useCreatePartialDeliveryNote(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineItems: svc.DeliveryLineInput[]) =>
      svc.createPartialDeliveryNote(invoiceId, lineItems),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.summary(invoiceId) });
      qc.invalidateQueries({ queryKey: keys.list(invoiceId) });
    },
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dnId, signatureReceived }: { dnId: string; signatureReceived: boolean }) =>
      svc.confirmDelivery(dnId, signatureReceived),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: keys.detail(vars.dnId) });
      qc.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}