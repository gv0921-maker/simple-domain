import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCompanySettings,
  updateCompanySettings,
  type CompanySettings,
} from '@/lib/services/companySettings/api';

const KEY = ['company-settings'] as const;

export function useCompanySettings() {
  return useQuery<CompanySettings | null>({
    queryKey: KEY,
    queryFn: fetchCompanySettings,
    staleTime: 60_000,
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<CompanySettings> }) =>
      updateCompanySettings(vars.id, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}