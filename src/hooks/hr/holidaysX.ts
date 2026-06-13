import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/hr/holidays';

export const holidayKeys = {
  all: ['hr', 'holidaysX'] as const,
  list: (year?: number) => [...holidayKeys.all, 'list', year ?? 'all'] as const,
  upcoming: (d: number) => [...holidayKeys.all, 'upcoming', d] as const,
};

export const useHolidaysList = (year?: number) =>
  useQuery({ queryKey: holidayKeys.list(year), queryFn: () => svc.listHolidays(year) });

export const useUpcomingHolidays = (days = 30) =>
  useQuery({ queryKey: holidayKeys.upcoming(days), queryFn: () => svc.getUpcomingHolidays(days) });

export function useCreateHolidayX() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: svc.HolidayInsert) => svc.createHoliday(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
}
export function useUpdateHolidayX() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: svc.HolidayUpdate }) => svc.updateHoliday(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
}
export function useDeactivateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.deactivateHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
}
export function useDeleteHolidayX() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.deleteHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
}