import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/lib/services/hr/leaveAllotments';

export const allotmentKeys = {
  all: ['hr', 'monthlyAllotments'] as const,
  byMonth: (y: number, m: number) => [...allotmentKeys.all, y, m] as const,
  balance: (empId: string, y: number, m: number) =>
    ['hr', 'monthlyBalance', empId, y, m] as const,
  myCurrent: () => ['hr', 'myMonthlyBalance'] as const,
};

export const useEmployeeMonthlyBalance = (
  employeeId: string | undefined, year: number, month: number,
) => useQuery({
  queryKey: employeeId ? allotmentKeys.balance(employeeId, year, month) : ['noop'],
  queryFn: () => svc.getEmployeeMonthlyBalance(employeeId!, year, month),
  enabled: !!employeeId,
});

export const useMyMonthlyBalance = () => useQuery({
  queryKey: allotmentKeys.myCurrent(),
  queryFn: () => svc.getMyCurrentMonthBalance(),
});

export const useAllotments = (year: number, month: number) =>
  useQuery({
    queryKey: allotmentKeys.byMonth(year, month),
    queryFn: () => svc.getAllEmployeesAllotments(year, month),
  });

export function useSetAllotment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { employeeId: string; year: number; month: number; paidLeavesAllotted: number }) =>
      svc.setMonthlyAllotment(p.employeeId, p.year, p.month, p.paidLeavesAllotted),
    onSuccess: () => qc.invalidateQueries({ queryKey: allotmentKeys.all }),
  });
}

export function useBulkSetAllotments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { year: number; month: number; rows: Array<{ employee_id: string; paid_leaves_allotted: number }> }) =>
      svc.bulkSetAllotments(p.year, p.month, p.rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: allotmentKeys.all }),
  });
}

export function useCopyPrevMonthAllotments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { year: number; month: number }) =>
      svc.copyAllotmentsFromPreviousMonth(p.year, p.month),
    onSuccess: () => qc.invalidateQueries({ queryKey: allotmentKeys.all }),
  });
}