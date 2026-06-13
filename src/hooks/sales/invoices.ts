import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/sales/invoices';

export const soInvoiceKeys = {
  summary: (id: string) => ['so-invoice-summary', id] as const,
  list: (id: string) => ['so-invoice-list', id] as const,
  validate: (id: string, type: string) => ['so-invoice-validate', id, type] as const,
};

export const useSOInvoiceSummary = (id: string | undefined) =>
  useQuery({
    queryKey: id ? soInvoiceKeys.summary(id) : ['noop'],
    queryFn: () => svc.getSOInvoiceSummary(id!),
    enabled: !!id,
  });

export const useInvoicesForSO = (id: string | undefined) =>
  useQuery({
    queryKey: id ? soInvoiceKeys.list(id) : ['noop'],
    queryFn: () => svc.getInvoicesForSO(id!),
    enabled: !!id,
  });

export const useValidateInvoiceType = (
  id: string | undefined,
  type: svc.SOInvoiceType,
  enabled = true,
) =>
  useQuery({
    queryKey: id ? soInvoiceKeys.validate(id, type) : ['noop'],
    queryFn: () => svc.validateInvoiceType(id!, type),
    enabled: !!id && enabled,
  });

export function useCreatePartialInvoice(salesOrderId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Omit<Parameters<typeof svc.createPartialInvoice>[0], 'salesOrderId'>) =>
      svc.createPartialInvoice({ ...vars, salesOrderId: salesOrderId! }),
    onSuccess: () => {
      if (salesOrderId) {
        qc.invalidateQueries({ queryKey: soInvoiceKeys.summary(salesOrderId) });
        qc.invalidateQueries({ queryKey: soInvoiceKeys.list(salesOrderId) });
      }
      qc.invalidateQueries({ queryKey: ['invoicing'] });
      qc.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}