import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/numbering/api';

export const numberingKeys = {
  all: ['numbering'] as const,
  settings: () => [...numberingKeys.all, 'settings'] as const,
  fy: () => [...numberingKeys.all, 'fy'] as const,
  preview: (type: string) => [...numberingKeys.all, 'preview', type] as const,
};

export function useCurrentFY() {
  return useQuery({ queryKey: numberingKeys.fy(), queryFn: api.getCurrentFY });
}

export function useNumberingSettings() {
  return useQuery({ queryKey: numberingKeys.settings(), queryFn: api.getNumberingSettings });
}

export function useUpdateNumberingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateNumberingSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: numberingKeys.all });
    },
  });
}

export function usePreviewNextNumber(type: api.DocumentType | string, enabled = true) {
  return useQuery({
    queryKey: numberingKeys.preview(type),
    queryFn: () => api.previewNextNumber(type),
    enabled,
    staleTime: 10_000,
  });
}

export { api as numberingApi };