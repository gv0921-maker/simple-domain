import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/vendors';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: (activeOnly: boolean) => ['vendors', 'list', activeOnly] as const,
  byId: (id: string) => ['vendors', 'detail', id] as const,
};

export function useVendors(activeOnly = true) {
  return useQuery({ queryKey: vendorKeys.list(activeOnly), queryFn: () => api.getVendors(activeOnly) });
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.byId(id ?? ''),
    queryFn: () => api.getVendorById(id!),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createVendor,
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Partial<api.VendorInput> }) => api.updateVendor(args.id, args.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeactivateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deactivateVendor,
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}