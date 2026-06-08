import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/sales/api';
import { salesKeys } from './keys';

export * from './keys';
export type {
  SbCustomer, SbQuotation, SbQuotationLine, SbSalesOrder, SbOrderLine,
  SbPricelist, SbPricelistItem, SbSubscription, SbSubscriptionLine,
  SbOrderActivity, SbQuotationVersion,
} from '@/lib/services/sales/api';

// -------- Customers --------
export function useCustomers() {
  return useQuery({ queryKey: salesKeys.customers(), queryFn: api.listCustomers });
}
export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: salesKeys.customer(id ?? ''),
    queryFn: () => api.getCustomer(id!),
    enabled: !!id,
  });
}
export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveCustomer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.customers() }); },
  });
}
export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCustomer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.customers() }); },
  });
}

// -------- Quotations --------
export function useQuotations() {
  return useQuery({ queryKey: salesKeys.quotations(), queryFn: api.listQuotations });
}
export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: salesKeys.quotation(id ?? ''),
    queryFn: () => api.getQuotation(id!),
    enabled: !!id,
  });
}
export function useSaveQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { quotation: Partial<api.SbQuotation> & { reference: string }; lines?: Array<Omit<api.SbQuotationLine, 'id' | 'quotationId'>> }) =>
      api.saveQuotation(args.quotation, args.lines),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: salesKeys.quotations() });
      if (q?.id) qc.invalidateQueries({ queryKey: salesKeys.quotation(q.id) });
    },
  });
}
export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteQuotation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.quotations() }); },
  });
}

// -------- Sales Orders --------
export function useSalesOrders() {
  return useQuery({ queryKey: salesKeys.orders(), queryFn: api.listSalesOrders });
}
export function useSalesOrder(id: string | undefined) {
  return useQuery({
    queryKey: salesKeys.order(id ?? ''),
    queryFn: () => api.getSalesOrder(id!),
    enabled: !!id,
  });
}
export function useSaveSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { order: Partial<api.SbSalesOrder> & { reference: string }; lines?: Array<Omit<api.SbOrderLine, 'id' | 'orderId'>> }) =>
      api.saveSalesOrder(args.order, args.lines),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: salesKeys.orders() });
      if (o?.id) qc.invalidateQueries({ queryKey: salesKeys.order(o.id) });
    },
  });
}
export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSalesOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.orders() }); },
  });
}

// -------- Pricelists --------
export function usePricelists() {
  return useQuery({ queryKey: salesKeys.pricelists(), queryFn: api.listPricelists });
}
export function usePricelist(id: string | undefined) {
  return useQuery({
    queryKey: salesKeys.pricelist(id ?? ''),
    queryFn: () => api.getPricelist(id!),
    enabled: !!id,
  });
}
export function useSavePricelist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { pricelist: Partial<api.SbPricelist> & { name: string }; items?: Array<Omit<api.SbPricelistItem, 'id' | 'pricelistId'>> }) =>
      api.savePricelist(args.pricelist, args.items),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: salesKeys.pricelists() });
      if (p?.id) qc.invalidateQueries({ queryKey: salesKeys.pricelist(p.id) });
    },
  });
}
export function useDeletePricelist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePricelist,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.pricelists() }); },
  });
}

// -------- Subscriptions --------
export function useSubscriptions() {
  return useQuery({ queryKey: salesKeys.subscriptions(), queryFn: api.listSubscriptions });
}
export function useSubscription(id: string | undefined) {
  return useQuery({
    queryKey: salesKeys.subscription(id ?? ''),
    queryFn: () => api.getSubscription(id!),
    enabled: !!id,
  });
}
export function useSaveSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveSubscription,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.subscriptions() }); },
  });
}
export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSubscription,
    onSuccess: () => { qc.invalidateQueries({ queryKey: salesKeys.subscriptions() }); },
  });
}

// -------- Order Activities --------
export function useOrderActivities(orderId: string | undefined) {
  return useQuery({
    queryKey: [...salesKeys.all, 'order-activities', orderId ?? ''] as const,
    queryFn: () => api.listOrderActivities(orderId!),
    enabled: !!orderId,
  });
}
export function useAddOrderActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.addOrderActivity,
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'order-activities', a.orderId] });
      qc.invalidateQueries({ queryKey: salesKeys.order(a.orderId) });
    },
  });
}

// -------- Quotation Versions --------
export function useQuotationVersions(quotationId: string | undefined) {
  return useQuery({
    queryKey: [...salesKeys.all, 'quotation-versions', quotationId ?? ''] as const,
    queryFn: () => api.listQuotationVersions(quotationId!),
    enabled: !!quotationId,
  });
}
export function useAddQuotationVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.addQuotationVersion,
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'quotation-versions', v.quotationId] });
      qc.invalidateQueries({ queryKey: salesKeys.quotation(v.quotationId) });
    },
  });
}

// -------- Subscription save accepts lines now --------
export function useSaveSubscriptionWithLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      subscription: Partial<api.SbSubscription>;
      lines?: Array<Omit<api.SbSubscriptionLine, 'id' | 'subscriptionId'>>;
    }) => api.saveSubscription(args.subscription, args.lines),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: salesKeys.subscriptions() });
      if (s?.id) qc.invalidateQueries({ queryKey: salesKeys.subscription(s.id) });
    },
  });
}

// -------- Rich Quotations (full B2C model) --------
import type { Quotation } from '@/lib/services/sales/types';

export function useQuotationsRich() {
  return useQuery({ queryKey: [...salesKeys.all, 'quotations-rich'] as const, queryFn: api.listQuotationsRich });
}
export function useQuotationRich(id: string | undefined) {
  return useQuery({
    queryKey: [...salesKeys.all, 'quotation-rich', id ?? ''] as const,
    queryFn: () => api.getQuotationRich(id!),
    enabled: !!id && id !== 'new',
  });
}
export function useSaveQuotationRich() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (q: Partial<Quotation> & { reference: string }) => api.saveQuotationRich(q),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'quotations-rich'] });
      qc.invalidateQueries({ queryKey: salesKeys.quotations() });
      if (q?.id) {
        qc.invalidateQueries({ queryKey: [...salesKeys.all, 'quotation-rich', q.id] });
        qc.invalidateQueries({ queryKey: salesKeys.quotation(q.id) });
      }
    },
  });
}
export function useDeleteQuotationRich() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteQuotation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'quotations-rich'] });
      qc.invalidateQueries({ queryKey: salesKeys.quotations() });
    },
  });
}

// -------- Rich Sales Orders (full B2C model) --------
import type { SalesOrder } from '@/lib/services/sales/types';

export function useSalesOrdersRich() {
  return useQuery({ queryKey: [...salesKeys.all, 'orders-rich'] as const, queryFn: api.listSalesOrdersRich });
}
export function useSalesOrderRich(id: string | undefined) {
  return useQuery({
    queryKey: [...salesKeys.all, 'order-rich', id ?? ''] as const,
    queryFn: () => api.getSalesOrderRich(id!),
    enabled: !!id && id !== 'new',
  });
}
export function useSaveSalesOrderRich() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (o: Partial<SalesOrder> & { reference: string }) => api.saveSalesOrderRich(o),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'orders-rich'] });
      qc.invalidateQueries({ queryKey: salesKeys.orders() });
      if (o?.id) {
        qc.invalidateQueries({ queryKey: [...salesKeys.all, 'order-rich', o.id] });
        qc.invalidateQueries({ queryKey: salesKeys.order(o.id) });
      }
    },
  });
}
export function useDeleteSalesOrderRich() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSalesOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'orders-rich'] });
      qc.invalidateQueries({ queryKey: salesKeys.orders() });
    },
  });
}