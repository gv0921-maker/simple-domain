import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/sales/payments';
import { salesKeys } from './keys';

export const paymentsKeys = {
  accounts: (activeOnly: boolean) => [...salesKeys.all, 'payment-accounts', activeOnly] as const,
  orderPayments: (orderId: string) => [...salesKeys.all, 'order-payments', orderId] as const,
  summary: (orderId: string) => [...salesKeys.all, 'payment-summary', orderId] as const,
};

export function usePaymentAccounts(activeOnly = true) {
  return useQuery({
    queryKey: paymentsKeys.accounts(activeOnly),
    queryFn: () => api.getPaymentAccounts(activeOnly),
  });
}

export function useSavePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.savePaymentAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'payment-accounts'] });
    },
  });
}

export function useDeletePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePaymentAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'payment-accounts'] });
    },
  });
}

export function useSalesOrderPayments(orderId: string | undefined) {
  return useQuery({
    queryKey: paymentsKeys.orderPayments(orderId ?? ''),
    queryFn: () => api.getSalesOrderPayments(orderId!),
    enabled: !!orderId,
  });
}

export function usePaymentSummary(orderId: string | undefined) {
  return useQuery({
    queryKey: paymentsKeys.summary(orderId ?? ''),
    queryFn: () => api.getPaymentSummary(orderId!),
    enabled: !!orderId,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.recordPayment,
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: paymentsKeys.orderPayments(p.sales_order_id) });
      qc.invalidateQueries({ queryKey: paymentsKeys.summary(p.sales_order_id) });
      qc.invalidateQueries({ queryKey: salesKeys.order(p.sales_order_id) });
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'order-rich', p.sales_order_id] });
      qc.invalidateQueries({ queryKey: salesKeys.orders() });
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'orders-rich'] });
    },
  });
}

export function useVoidPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { paymentId: string; reason: string }) => api.voidPayment(args.paymentId, args.reason),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: paymentsKeys.orderPayments(p.sales_order_id) });
      qc.invalidateQueries({ queryKey: paymentsKeys.summary(p.sales_order_id) });
      qc.invalidateQueries({ queryKey: salesKeys.order(p.sales_order_id) });
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'order-rich', p.sales_order_id] });
    },
  });
}