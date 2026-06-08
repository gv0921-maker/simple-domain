import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/sales/api';
import { salesKeys } from './keys';

export * from './keys';
export type {
  SbCustomer, SbQuotation, SbQuotationLine, SbSalesOrder, SbOrderLine,
  SbPricelist, SbPricelistItem, SbSubscription,
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