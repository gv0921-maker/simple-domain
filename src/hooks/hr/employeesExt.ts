import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/hr/employeesExt';

export const useEmployeeDirectoryRestricted = () =>
  useQuery({ queryKey: ['hr', 'directory', 'restricted'], queryFn: svc.getEmployeeDirectoryRestricted });

export const useOrgChart = () =>
  useQuery({ queryKey: ['hr', 'orgChart'], queryFn: svc.getOrgChartData });

export const useTodayStatusMap = (ids: string[]) =>
  useQuery({
    queryKey: ['hr', 'todayStatus', ids.join(',')],
    queryFn: () => svc.getTodayStatusMap(ids),
    enabled: ids.length > 0,
  });

export function useSetEmployeeManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, managerId }: { employeeId: string; managerId: string | null }) =>
      svc.setEmployeeManager(employeeId, managerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'orgChart'] }),
  });
}