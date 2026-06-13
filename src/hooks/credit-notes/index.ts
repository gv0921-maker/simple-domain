import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/creditNotes';

export const creditNoteKeys = {
  all: ['credit-notes'] as const,
  list: (f: api.CreditNoteFilters) => ['credit-notes', 'list', f] as const,
  byId: (id: string) => ['credit-notes', 'detail', id] as const,
  customerActive: (cid: string) => ['credit-notes', 'customer-active', cid] as const,
  expiring: (days: number) => ['credit-notes', 'expiring', days] as const,
};

function inv(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: creditNoteKeys.all });
}

export function useCreditNotes(filters: api.CreditNoteFilters = {}) {
  return useQuery({
    queryKey: creditNoteKeys.list(filters),
    queryFn: () => api.getCreditNotes(filters),
    refetchInterval: 60_000 * 60, // hourly check for expiries
  });
}
export function useCreditNote(id: string | undefined) {
  return useQuery({
    queryKey: creditNoteKeys.byId(id ?? ''),
    queryFn: () => api.getCreditNoteById(id!),
    enabled: !!id,
  });
}
export function useCustomerActiveCreditNotes(customerId: string | null | undefined) {
  return useQuery({
    queryKey: creditNoteKeys.customerActive(customerId ?? ''),
    queryFn: () => api.getCustomerActiveCreditNotes(customerId!),
    enabled: !!customerId,
  });
}
export function useExpiringCreditNotes(daysAhead = 30) {
  return useQuery({
    queryKey: creditNoteKeys.expiring(daysAhead),
    queryFn: () => api.getExpiringCreditNotes(daysAhead),
  });
}
export function useRedeemCreditNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.redeemCreditNote, onSuccess: () => inv(qc) });
}
export function useVoidCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { cnId: string; reason: string }) => api.voidCreditNote(a.cnId, a.reason),
    onSuccess: () => inv(qc),
  });
}
