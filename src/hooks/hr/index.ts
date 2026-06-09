// TanStack Query hooks for the HR module.
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as hr from '@/lib/services/hr/api';

export const hrKeys = {
  all: ['hr'] as const,
  departments: () => [...hrKeys.all, 'departments'] as const,
  department: (id: string) => [...hrKeys.departments(), id] as const,
  employees: () => [...hrKeys.all, 'employees'] as const,
  employee: (id: string) => [...hrKeys.employees(), id] as const,
  contracts: () => [...hrKeys.all, 'contracts'] as const,
  contract: (id: string) => [...hrKeys.contracts(), id] as const,
  contractsByEmployee: (employeeId: string) =>
    [...hrKeys.contracts(), 'employee', employeeId] as const,
  attendance: () => [...hrKeys.all, 'attendance'] as const,
  activeSession: (empId: string) => [...hrKeys.attendance(), 'active', empId] as const,
  daily: (empId: string, date: string) => [...hrKeys.attendance(), 'daily', empId, date] as const,
  monthly: (empId: string, month: string) => [...hrKeys.attendance(), 'monthly', empId, month] as const,
  range: (ids: string[], start: string, end: string) =>
    [...hrKeys.attendance(), 'range', ids.join(','), start, end] as const,
  locations: () => [...hrKeys.all, 'locations'] as const,
  holidays: () => [...hrKeys.all, 'holidays'] as const,
  schedules: (empId?: string) => [...hrKeys.all, 'schedules', empId ?? 'all'] as const,
} as const;

// ---------- Departments ----------
export const useDepartments = () =>
  useQuery({ queryKey: hrKeys.departments(), queryFn: hr.listDepartments });

export const useDepartment = (id: string | undefined) =>
  useQuery({
    queryKey: id ? hrKeys.department(id) : ['noop'],
    queryFn: () => hr.getDepartment(id!),
    enabled: !!id,
  });

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.DepartmentInsert) => hr.createDepartment(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.departments() }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.DepartmentUpdate }) =>
      hr.updateDepartment(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.departments() }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.departments() }),
  });
}

// ---------- Employees ----------
export const useEmployees = () =>
  useQuery({ queryKey: hrKeys.employees(), queryFn: hr.listEmployees });

export const useEmployee = (id: string | undefined) =>
  useQuery({
    queryKey: id ? hrKeys.employee(id) : ['noop'],
    queryFn: () => hr.getEmployee(id!),
    enabled: !!id,
  });

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.EmployeeInsert) => hr.createEmployee(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.employees() }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.EmployeeUpdate }) =>
      hr.updateEmployee(id, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees() });
      qc.invalidateQueries({ queryKey: hrKeys.employee(vars.id) });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.employees() }),
  });
}

// ---------- Contracts ----------
export const useContracts = () =>
  useQuery({ queryKey: hrKeys.contracts(), queryFn: hr.listContracts });

export const useContract = (id: string | undefined) =>
  useQuery({
    queryKey: id ? hrKeys.contract(id) : ['noop'],
    queryFn: () => hr.getContract(id!),
    enabled: !!id,
  });

export const useContractsByEmployee = (employeeId: string | undefined) =>
  useQuery({
    queryKey: employeeId ? hrKeys.contractsByEmployee(employeeId) : ['noop'],
    queryFn: () => hr.listContractsByEmployee(employeeId!),
    enabled: !!employeeId,
  });

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.ContractInsert) => hr.createContract(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.contracts() }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.ContractUpdate }) =>
      hr.updateContract(id, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: hrKeys.contracts() });
      qc.invalidateQueries({ queryKey: hrKeys.contract(vars.id) });
    },
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteContract(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.contracts() }),
  });
}

// ---------- Attendance Sessions ----------
export function useActiveSession(employeeId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!employeeId) return;
    return hr.subscribeToActiveSession(employeeId, () => {
      qc.invalidateQueries({ queryKey: hrKeys.attendance() });
    });
  }, [employeeId, qc]);
  return useQuery({
    queryKey: employeeId ? hrKeys.activeSession(employeeId) : ['noop'],
    queryFn: () => hr.getActiveSession(employeeId!),
    enabled: !!employeeId,
  });
}

export const useDailyAttendance = (employeeId: string | undefined, date: string) =>
  useQuery({
    queryKey: employeeId ? hrKeys.daily(employeeId, date) : ['noop'],
    queryFn: () => hr.getDailyAttendance(employeeId!, date),
    enabled: !!employeeId,
  });

export const useMonthlyAttendance = (employeeId: string | undefined, month: string) =>
  useQuery({
    queryKey: employeeId ? hrKeys.monthly(employeeId, month) : ['noop'],
    queryFn: () => hr.getMonthlyAttendance(employeeId!, month),
    enabled: !!employeeId,
  });

export const useRangeAttendance = (employeeIds: string[], startDate: string, endDate: string) =>
  useQuery({
    queryKey: hrKeys.range(employeeIds, startDate, endDate),
    queryFn: () => hr.getRangeAttendance(employeeIds, startDate, endDate),
    enabled: employeeIds.length > 0,
  });

export function usePunchIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Parameters<typeof hr.punchIn>[0]) => hr.punchIn(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.attendance() }),
  });
}

export function usePunchOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Parameters<typeof hr.punchOut>[0]) => hr.punchOut(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.attendance() }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.AttendanceSessionUpdate }) =>
      hr.updateSession(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.attendance() }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.attendance() }),
  });
}

export function useBulkInsertSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: hr.AttendanceSessionInsert[]) => hr.bulkInsertFromCSV(rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.attendance() }),
  });
}

// ---------- Locations ----------
export const useLocations = () =>
  useQuery({ queryKey: hrKeys.locations(), queryFn: hr.listLocations });

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.AttendanceLocationInsert) => hr.createLocation(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.locations() }),
  });
}
export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.AttendanceLocationUpdate }) =>
      hr.updateLocation(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.locations() }),
  });
}
export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.locations() }),
  });
}

// ---------- Holidays ----------
export const useHolidays = () =>
  useQuery({ queryKey: hrKeys.holidays(), queryFn: hr.listHolidays });
export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.HolidayInsert) => hr.createHoliday(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.holidays() }),
  });
}
export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.HolidayUpdate }) =>
      hr.updateHoliday(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.holidays() }),
  });
}
export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hrKeys.holidays() }),
  });
}

// ---------- Schedules ----------
export const useSchedules = (employeeId?: string) =>
  useQuery({ queryKey: hrKeys.schedules(employeeId), queryFn: () => hr.listSchedules(employeeId) });

export function useUpsertSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.WorkScheduleInsert) => hr.upsertSchedule(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'schedules'] }),
  });
}