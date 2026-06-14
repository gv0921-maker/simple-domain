import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSavedFilters, getDefaultFilter, saveFilter, updateFilter, deleteFilter,
  setUserDefault, setSystemDefault, type SavedFilter,
} from '@/lib/services/savedFilters';
import type { FilterState } from '@/lib/filters/types';

const key = (m: string) => ['saved_filters', m] as const;

export function useSavedFilters(module: string) {
  return useQuery({ queryKey: key(module), queryFn: () => getSavedFilters(module) });
}

export function useDefaultFilter(module: string) {
  return useQuery({ queryKey: ['default_filter', module], queryFn: () => getDefaultFilter(module) });
}

export function useSaveFilter(module: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { name: string; state: FilterState; isDefault?: boolean; isSystemDefault?: boolean }) =>
      saveFilter(module, args.name, args.state, { is_default: args.isDefault, is_system_default: args.isSystemDefault }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(module) });
      qc.invalidateQueries({ queryKey: ['default_filter', module] });
    },
  });
}

export function useUpdateFilter(module: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<Pick<SavedFilter,'name'|'filter_state'|'is_default'|'is_system_default'>> }) =>
      updateFilter(args.id, args.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(module) });
      qc.invalidateQueries({ queryKey: ['default_filter', module] });
    },
  });
}

export function useDeleteFilter(module: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFilter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(module) });
      qc.invalidateQueries({ queryKey: ['default_filter', module] });
    },
  });
}

export function useSetUserDefault(module: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setUserDefault(module, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(module) });
      qc.invalidateQueries({ queryKey: ['default_filter', module] });
    },
  });
}

export function useSetSystemDefault(module: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setSystemDefault(module, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(module) });
      qc.invalidateQueries({ queryKey: ['default_filter', module] });
    },
  });
}
