import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/hr/sundayRoster';

export const sundayRosterKeys = {
  all: ['hr', 'sundayRosters'] as const,
  list: (from: string, to: string, ids?: string[]) =>
    [...sundayRosterKeys.all, from, to, ids?.join(',') ?? 'all'] as const,
  mine: (from: string, to: string) => ['hr', 'mySundayRoster', from, to] as const,
};

export const useSundayRosters = (from: string, to: string, employeeIds?: string[]) =>
  useQuery({
    queryKey: sundayRosterKeys.list(from, to, employeeIds),
    queryFn: () => svc.getRosters(from, to, employeeIds),
    enabled: !!from && !!to,
  });

export const useMySundayRoster = (from: string, to: string) =>
  useQuery({
    queryKey: sundayRosterKeys.mine(from, to),
    queryFn: () => svc.getMyRoster(from, to),
    enabled: !!from && !!to,
  });

export function useAssignSundayDuty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { employeeId: string; sundayDate: string; compOffDate: string }) =>
      svc.assignSundayDuty(p.employeeId, p.sundayDate, p.compOffDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: sundayRosterKeys.all }),
  });
}

export function useBulkAssignSundayDuty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignments: Array<{ employee_id: string; sunday_date: string; comp_off_date: string }>) =>
      svc.bulkAssignSundayDuty(assignments),
    onSuccess: () => qc.invalidateQueries({ queryKey: sundayRosterKeys.all }),
  });
}

export function useClearRosterAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.clearRosterAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sundayRosterKeys.all }),
  });
}