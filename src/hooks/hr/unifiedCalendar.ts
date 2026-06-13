import { useQuery } from '@tanstack/react-query';
import { getCalendarData, getEmployeeCalendarSummary } from '@/lib/services/hr/unifiedCalendar';

export function useUnifiedCalendar(startDate: string, endDate: string, employeeId?: string) {
  return useQuery({
    queryKey: ['hr', 'unifiedCalendar', startDate, endDate, employeeId ?? 'all'],
    queryFn: () => getCalendarData(startDate, endDate, employeeId),
  });
}

export function useEmployeeCalendarSummary(employeeId: string | undefined, month: number, year: number) {
  return useQuery({
    queryKey: ['hr', 'unifiedCalendarSummary', employeeId, month, year],
    queryFn: () => getEmployeeCalendarSummary(employeeId!, month, year),
    enabled: !!employeeId,
  });
}