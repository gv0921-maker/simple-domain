import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/services/inventory/internalMovements';

export const imKeys = {
  all: ['internal-movements'] as const,
  list: (f: api.MovementFilters) => ['internal-movements', 'list', f] as const,
  byId: (id: string) => ['internal-movements', 'detail', id] as const,
  queueId: (id: string) => ['internal-movements', 'queue', id] as const,
};

export function useInternalMovements(filters: api.MovementFilters = {}) {
  return useQuery({
    queryKey: imKeys.list(filters),
    queryFn: () => api.getInternalMovements(filters),
  });
}

export function useInternalMovement(id: string | undefined) {
  return useQuery({
    queryKey: imKeys.byId(id ?? ''),
    queryFn: () => api.getInternalMovementById(id!),
    enabled: !!id,
  });
}

export function useCreateInternalMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createInternalMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internal-movements'] });
      qc.invalidateQueries({ queryKey: ['barcode', 'queue'] });
    },
  });
}

export function useStartMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.startMovement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal-movements'] }),
  });
}

export function useCompleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.completeMovement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal-movements'] }),
  });
}

export function useCancelMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { movementId: string; reason: string }) => api.cancelMovement(args.movementId, args.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal-movements'] }),
  });
}

export function useMovementQueueId(id: string | undefined) {
  return useQuery({
    queryKey: imKeys.queueId(id ?? ''),
    queryFn: () => api.getMovementQueueId(id!),
    enabled: !!id,
  });
}