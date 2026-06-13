import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/services/refunds';

export const refundKeys = {
  all: ['refunds'] as const,
  list: (f: api.RefundFilters) => ['refunds', 'list', f] as const,
  byId: (id: string) => ['refunds', 'detail', id] as const,
};

export function useRefunds(filters: api.RefundFilters = {}) {
  return useQuery({ queryKey: refundKeys.list(filters), queryFn: () => api.getRefunds(filters) });
}
export function useRefund(id: string | undefined) {
  return useQuery({
    queryKey: refundKeys.byId(id ?? ''),
    queryFn: () => api.getRefundById(id!),
    enabled: !!id,
  });
}
