import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/inventory/reservations';
import { inventoryKeys } from './keys';

export const reservationKeys = {
  all: [...inventoryKeys.all, 'reservations'] as const,
  list: () => [...reservationKeys.all, 'list'] as const,
  bySalesOrder: (id: string) => [...reservationKeys.all, 'order', id] as const,
  byProduct: (id: string) => [...reservationKeys.all, 'product', id] as const,
};

export const useReservations = () =>
  useQuery({ queryKey: reservationKeys.list(), queryFn: svc.listReservationsAsync });

export const useReservationsBySalesOrder = (id: string | undefined) =>
  useQuery({
    queryKey: id ? reservationKeys.bySalesOrder(id) : ['noop'],
    queryFn: () => svc.listReservationsBySalesOrderAsync(id!),
    enabled: !!id,
  });

export const useReservationsByProduct = (id: string | undefined) =>
  useQuery({
    queryKey: id ? reservationKeys.byProduct(id) : ['noop'],
    queryFn: () => svc.listReservationsByProductAsync(id!),
    enabled: !!id,
  });

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: reservationKeys.all });
  qc.invalidateQueries({ queryKey: inventoryKeys.serials() });
  qc.invalidateQueries({ queryKey: inventoryKeys.products() });
}

export function useCreateReservations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: svc.CreateReservationInput[]) => svc.createReservationsAsync(inputs),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useReleaseReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.releaseReservationAsync(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.deleteReservationAsync(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export type { StockReservation, StockReservationStatus, CreateReservationInput } from '@/lib/services/inventory/reservations';