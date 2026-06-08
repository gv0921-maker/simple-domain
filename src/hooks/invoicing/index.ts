import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/invoicing/api';
import { invoicingKeys } from './keys';

export { invoicingKeys };
export type {
  Invoice, InvoiceLine, Payment, InvoiceType, InvoiceStatus, PriceApprovalStatus,
  PaymentMethod, SaveInvoiceInput, SavePaymentInput,
} from '@/lib/services/invoicing/api';

// -------- Invoices --------
export const useInvoices = (type?: api.InvoiceType) =>
  useQuery({
    queryKey: invoicingKeys.invoices(type),
    queryFn: () => api.fetchInvoices(type),
  });

export const useInvoice = (id: string | undefined) =>
  useQuery({
    queryKey: id ? invoicingKeys.invoice(id) : ['noop'],
    queryFn: () => api.fetchInvoiceById(id!),
    enabled: !!id,
  });

export function useSaveInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.SaveInvoiceInput) => api.saveInvoice(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicingKeys.all }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInvoice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicingKeys.all }),
  });
}

// -------- Invoice lines --------
export const useInvoiceLines = (invoiceId: string | undefined) =>
  useQuery({
    queryKey: invoiceId ? invoicingKeys.invoiceLines(invoiceId) : ['noop'],
    queryFn: () => api.fetchInvoiceLines(invoiceId!),
    enabled: !!invoiceId,
  });

export function useSaveInvoiceLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveInvoiceLine,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: invoicingKeys.invoiceLines(vars.invoice_id) });
      qc.invalidateQueries({ queryKey: invoicingKeys.all });
    },
  });
}

// -------- Payments --------
export const usePayments = () =>
  useQuery({ queryKey: invoicingKeys.payments(), queryFn: api.fetchPayments });

export function useSavePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.savePayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicingKeys.payments() }),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicingKeys.payments() }),
  });
}

// -------- Price approvals --------
export const usePendingPriceApprovals = () =>
  useQuery({
    queryKey: [...invoicingKeys.all, 'price-approvals'] as const,
    queryFn: api.fetchPendingPriceApprovals,
  });

export const usePendingPriceApprovalsCount = (enabled = true) =>
  useQuery({
    queryKey: [...invoicingKeys.all, 'price-approvals', 'count'] as const,
    queryFn: api.fetchPendingPriceApprovalsCount,
    enabled,
  });

export function useSetInvoicePriceApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { invoiceId: string; status: api.PriceApprovalStatus }) =>
      api.setInvoicePriceApproval(vars.invoiceId, vars.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicingKeys.all }),
  });
}

export function useUpdateInvoiceLineApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { lineId: string; approved_price: number | null; approval_notes: string | null }) =>
      api.updateInvoiceLineApproval(vars.lineId, vars.approved_price, vars.approval_notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicingKeys.all }),
  });
}