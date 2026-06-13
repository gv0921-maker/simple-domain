// TanStack Query hooks for the HR module.
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as hr from '@/lib/services/hr/api';

export * from './leaveAllotments';
export * from './sundayRoster';

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

// ============================================================
// Batch 3 — Leaves & Roster
// ============================================================
export const leaveKeys = {
  types: () => [...hrKeys.all, 'leaveTypes'] as const,
  entitlements: (year?: number) => [...hrKeys.all, 'entitlements', year ?? 'all'] as const,
  balances: (year: number) => [...hrKeys.all, 'balances', year] as const,
  employeeBalance: (empId: string, year: number) =>
    [...hrKeys.all, 'employeeBalance', empId, year] as const,
  requests: (filters?: unknown) => [...hrKeys.all, 'leaveRequests', filters ?? 'all'] as const,
  request: (id: string) => [...hrKeys.all, 'leaveRequest', id] as const,
  approvalLog: (id: string) => [...hrKeys.all, 'leaveApprovalLog', id] as const,
  rosters: (from: string, to: string, ids?: string[]) =>
    [...hrKeys.all, 'rosters', from, to, ids?.join(',') ?? 'all'] as const,
  compOff: (empId?: string) => [...hrKeys.all, 'compOff', empId ?? 'all'] as const,
  workedOnOff: (from: string, to: string) =>
    [...hrKeys.all, 'workedOnOff', from, to] as const,
} as const;

// Leave types
export const useLeaveTypes = () =>
  useQuery({ queryKey: leaveKeys.types(), queryFn: hr.listLeaveTypes });
export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.LeaveTypeInsert) => hr.createLeaveType(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.types() }),
  });
}
export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.LeaveTypeUpdate }) =>
      hr.updateLeaveType(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.types() }),
  });
}
export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteLeaveType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.types() }),
  });
}

// Entitlements
export const useEntitlements = (year?: number) =>
  useQuery({ queryKey: leaveKeys.entitlements(year), queryFn: () => hr.listEntitlements(year) });
export function useUpsertEntitlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.LeaveEntitlementInsert) => hr.upsertEntitlement(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'entitlements'] }),
  });
}
export function useDeleteEntitlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteEntitlement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'entitlements'] }),
  });
}

// Balances
export const useBalances = (year: number) =>
  useQuery({ queryKey: leaveKeys.balances(year), queryFn: () => hr.listBalances(year) });
export function useUpsertBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.LeaveBalanceInsert) => hr.upsertBalance(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'balances'] }),
  });
}
export function useCarryForward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fromYear: number) => hr.carryForwardLeaves(fromYear),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'balances'] }),
  });
}
export const useEmployeeLeaveBalance = (employeeId: string | undefined, year: number) =>
  useQuery({
    queryKey: employeeId ? leaveKeys.employeeBalance(employeeId, year) : ['noop'],
    queryFn: () => hr.getEmployeeLeaveBalance(employeeId!, year),
    enabled: !!employeeId,
  });

// Leave requests
export const useLeaveRequests = (filters?: Parameters<typeof hr.listLeaveRequests>[0]) =>
  useQuery({ queryKey: leaveKeys.requests(filters), queryFn: () => hr.listLeaveRequests(filters) });
export const useLeaveRequest = (id: string | undefined) =>
  useQuery({
    queryKey: id ? leaveKeys.request(id) : ['noop'],
    queryFn: () => hr.getLeaveRequest(id!),
    enabled: !!id,
  });
export const useApprovalLog = (id: string | undefined) =>
  useQuery({
    queryKey: id ? leaveKeys.approvalLog(id) : ['noop'],
    queryFn: () => hr.listApprovalLog(id!),
    enabled: !!id,
  });
export function useSubmitLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Parameters<typeof hr.submitLeaveRequest>[0]) => hr.submitLeaveRequest(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'leaveRequests'] }),
  });
}
export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approver_id, comments }: { id: string; approver_id?: string | null; comments?: string }) =>
      hr.approveLeaveRequest(id, approver_id, comments),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'leaveRequests'] }),
  });
}
export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => hr.rejectLeaveRequest(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'leaveRequests'] }),
  });
}
export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => hr.cancelLeaveRequest(id, comments),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'leaveRequests'] }),
  });
}

// Rosters
export const useRosters = (from: string, to: string, employeeIds?: string[]) =>
  useQuery({
    queryKey: leaveKeys.rosters(from, to, employeeIds),
    queryFn: () => hr.listRosters({ from, to, employeeIds }),
    enabled: !!from && !!to,
  });
export function useUpsertRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.EmployeeRosterInsert) => hr.upsertRoster(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'rosters'] }),
  });
}
export function useScheduleWeeklyOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, dates, notes }: { employeeId: string; dates: string[]; notes?: string }) =>
      hr.scheduleWeeklyOff(employeeId, dates, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'rosters'] }),
  });
}
export function useRescheduleWeeklyOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, originalDate, newDate }: { employeeId: string; originalDate: string; newDate: string }) =>
      hr.rescheduleWeeklyOff(employeeId, originalDate, newDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'rosters'] }),
  });
}
export const useWorkedOnWeeklyOff = (from: string, to: string) =>
  useQuery({
    queryKey: leaveKeys.workedOnOff(from, to),
    queryFn: () => hr.listWorkedOnWeeklyOff(from, to),
    enabled: !!from && !!to,
  });

// Comp-off
export const useCompOffCredits = (employeeId?: string) =>
  useQuery({ queryKey: leaveKeys.compOff(employeeId), queryFn: () => hr.listCompOffCredits(employeeId) });
export function useGrantCompOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Parameters<typeof hr.grantCompOff>[0]) => hr.grantCompOff(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'compOff'] }),
  });
}

// ============================================================
// Batch 4 — Payroll
// ============================================================
export const payrollKeys = {
  components: () => [...hrKeys.all, 'salaryComponents'] as const,
  settings: () => [...hrKeys.all, 'payrollSettings'] as const,
  taxSlabs: (fy: string, regime: string) => [...hrKeys.all, 'taxSlabs', fy, regime] as const,
  loans: (empId?: string) => [...hrKeys.all, 'loans', empId ?? 'all'] as const,
  advances: (empId?: string) => [...hrKeys.all, 'advances', empId ?? 'all'] as const,
  periods: () => [...hrKeys.all, 'payrollPeriods'] as const,
  period: (id: string) => [...hrKeys.all, 'payrollPeriod', id] as const,
  periodPayslips: (id: string) => [...hrKeys.all, 'periodPayslips', id] as const,
  payslip: (id: string) => [...hrKeys.all, 'payslip', id] as const,
  employeePayslips: (empId: string) => [...hrKeys.all, 'employeePayslips', empId] as const,
} as const;

export const useSalaryComponents = () =>
  useQuery({ queryKey: payrollKeys.components(), queryFn: hr.listSalaryComponents });
export function useCreateSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.SalaryComponentInsert) => hr.createSalaryComponent(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.components() }),
  });
}
export function useUpdateSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.SalaryComponentUpdate }) =>
      hr.updateSalaryComponent(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.components() }),
  });
}
export function useDeleteSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteSalaryComponent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.components() }),
  });
}

export const usePayrollSettings = () =>
  useQuery({ queryKey: payrollKeys.settings(), queryFn: hr.getActivePayrollSettings });
export function useUpdatePayrollSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.PayrollSettingsUpdate }) =>
      hr.updatePayrollSettings(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.settings() }),
  });
}

export const useTaxSlabs = (fy: string, regime: 'old' | 'new') =>
  useQuery({
    queryKey: payrollKeys.taxSlabs(fy, regime),
    queryFn: () => hr.listTaxSlabs(fy, regime),
    enabled: !!fy,
  });
export function useUpsertTaxSlab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.TaxSlabInsert) => hr.upsertTaxSlab(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'taxSlabs'] }),
  });
}
export function useDeleteTaxSlab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteTaxSlab(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'taxSlabs'] }),
  });
}

export const useLoans = (empId?: string) =>
  useQuery({ queryKey: payrollKeys.loans(empId), queryFn: () => hr.listLoans(empId) });
export function useAddLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.EmployeeLoanInsert) => hr.addLoan(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'loans'] }),
  });
}
export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<hr.EmployeeLoan> }) =>
      hr.updateLoan(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'loans'] }),
  });
}

export const useAdvances = (empId?: string) =>
  useQuery({ queryKey: payrollKeys.advances(empId), queryFn: () => hr.listAdvances(empId) });
export function useAddAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.EmployeeAdvanceInsert) => hr.addAdvance(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'advances'] }),
  });
}
export function useUpdateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<hr.EmployeeAdvance> }) =>
      hr.updateAdvance(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'advances'] }),
  });
}

export const usePayrollPeriods = () =>
  useQuery({ queryKey: payrollKeys.periods(), queryFn: hr.listPayrollPeriods });
export const usePayrollPeriod = (id: string | undefined) =>
  useQuery({
    queryKey: id ? payrollKeys.period(id) : ['noop'],
    queryFn: () => hr.getPayrollPeriod(id!),
    enabled: !!id,
  });
export const usePeriodPayslips = (id: string | undefined) =>
  useQuery({
    queryKey: id ? payrollKeys.periodPayslips(id) : ['noop'],
    queryFn: () => hr.listPayslipsForPeriod(id!),
    enabled: !!id,
  });
export const usePayslip = (id: string | undefined) =>
  useQuery({
    queryKey: id ? payrollKeys.payslip(id) : ['noop'],
    queryFn: () => hr.getPayslip(id!),
    enabled: !!id,
  });
export const useEmployeePayslips = (empId: string | undefined) =>
  useQuery({
    queryKey: empId ? payrollKeys.employeePayslips(empId) : ['noop'],
    queryFn: () => hr.listPayslipsForEmployee(empId!),
    enabled: !!empId,
  });

export function useCreatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => hr.createPayrollPeriod(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.periods() }),
  });
}
export function useProcessPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => hr.processPayroll(periodId),
    onSuccess: (_d, periodId) => {
      qc.invalidateQueries({ queryKey: payrollKeys.periods() });
      qc.invalidateQueries({ queryKey: payrollKeys.period(periodId) });
      qc.invalidateQueries({ queryKey: payrollKeys.periodPayslips(periodId) });
    },
  });
}
export function useRecalculatePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payslipId: string) => hr.recalculatePayslip(payslipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...hrKeys.all, 'payslip'] });
      qc.invalidateQueries({ queryKey: [...hrKeys.all, 'periodPayslips'] });
    },
  });
}
export function useFinalizePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.finalizePayslip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...hrKeys.all, 'payslip'] }),
  });
}
export function useBulkFinalizePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => hr.bulkFinalizePayroll(periodId),
    onSuccess: (_d, periodId) => {
      qc.invalidateQueries({ queryKey: payrollKeys.periodPayslips(periodId) });
      qc.invalidateQueries({ queryKey: payrollKeys.period(periodId) });
    },
  });
}
export function useLockPayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => hr.lockPayrollPeriod(periodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.periods() }),
  });
}
export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ periodId, date, reference }: { periodId: string; date: string; reference: string }) =>
      hr.markPaid(periodId, date, reference),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.periods() }),
  });
}

// ============== Batch 5: Appraisals ==============
export const appraisalKeys = {
  all: ['hr', 'appraisal'] as const,
  cycles: () => [...appraisalKeys.all, 'cycles'] as const,
  cycle: (id: string) => [...appraisalKeys.cycles(), id] as const,
  templates: () => [...appraisalKeys.all, 'templates'] as const,
  criteria: (tplId: string) => [...appraisalKeys.all, 'criteria', tplId] as const,
  byCycle: (id: string) => [...appraisalKeys.all, 'byCycle', id] as const,
  byEmployee: (id: string) => [...appraisalKeys.all, 'byEmployee', id] as const,
  byReviewer: (id: string) => [...appraisalKeys.all, 'byReviewer', id] as const,
  appraisal: (id: string) => [...appraisalKeys.all, 'appraisal', id] as const,
  ratings: (id: string) => [...appraisalKeys.all, 'ratings', id] as const,
  goals: (id: string) => [...appraisalKeys.all, 'goals', id] as const,
  pendingIncrements: () => [...appraisalKeys.all, 'pendingIncrements'] as const,
};

export const useAppraisalCycles = () =>
  useQuery({ queryKey: appraisalKeys.cycles(), queryFn: hr.listAppraisalCycles });
export const useAppraisalCycle = (id: string | undefined) =>
  useQuery({ queryKey: id ? appraisalKeys.cycle(id) : ['noop'], queryFn: () => hr.getAppraisalCycle(id!), enabled: !!id });

export function useCreateAppraisalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.AppraisalCycleInsert) => hr.createAppraisalCycle(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.cycles() }),
  });
}
export function useUpdateAppraisalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.AppraisalCycleUpdate }) => hr.updateAppraisalCycle(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.cycles() }),
  });
}
export function useDeleteAppraisalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteAppraisalCycle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.cycles() }),
  });
}
export function useLaunchAppraisalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.launchAppraisalCycle(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: appraisalKeys.cycles() });
      qc.invalidateQueries({ queryKey: appraisalKeys.byCycle(id) });
    },
  });
}

export const useAppraisalTemplates = () =>
  useQuery({ queryKey: appraisalKeys.templates(), queryFn: hr.listTemplates });
export const useAppraisalCriteria = (tplId: string | undefined) =>
  useQuery({ queryKey: tplId ? appraisalKeys.criteria(tplId) : ['noop'], queryFn: () => hr.listCriteria(tplId!), enabled: !!tplId });

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.AppraisalTemplateInsert) => hr.createTemplate(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.templates() }),
  });
}
export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<hr.AppraisalTemplate> }) => hr.updateTemplate(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.templates() }),
  });
}
export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.templates() }),
  });
}
export function useCreateCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.AppraisalCriterionInsert) => hr.createCriterion(p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: appraisalKeys.criteria(p.template_id) }),
  });
}
export function useUpdateCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<hr.AppraisalCriterion> }) => hr.updateCriterion(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export function useDeleteCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteCriterion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}

export const useAppraisalsByCycle = (cycleId: string | undefined) =>
  useQuery({
    queryKey: cycleId ? appraisalKeys.byCycle(cycleId) : ['noop'],
    queryFn: () => hr.listAppraisalsByCycle(cycleId!),
    enabled: !!cycleId,
  });
export const useAppraisalsForEmployee = (empId: string | undefined) =>
  useQuery({
    queryKey: empId ? appraisalKeys.byEmployee(empId) : ['noop'],
    queryFn: () => hr.listAppraisalsForEmployee(empId!),
    enabled: !!empId,
  });
export const useAppraisalsForReviewer = (revId: string | undefined) =>
  useQuery({
    queryKey: revId ? appraisalKeys.byReviewer(revId) : ['noop'],
    queryFn: () => hr.listAppraisalsForReviewer(revId!),
    enabled: !!revId,
  });
export const useAppraisal = (id: string | undefined) =>
  useQuery({
    queryKey: id ? appraisalKeys.appraisal(id) : ['noop'],
    queryFn: () => hr.getAppraisal(id!),
    enabled: !!id,
  });
export const useAppraisalRatings = (id: string | undefined) =>
  useQuery({
    queryKey: id ? appraisalKeys.ratings(id) : ['noop'],
    queryFn: () => hr.listRatings(id!),
    enabled: !!id,
  });
export const useAppraisalGoals = (id: string | undefined) =>
  useQuery({
    queryKey: id ? appraisalKeys.goals(id) : ['noop'],
    queryFn: () => hr.listGoals(id!),
    enabled: !!id,
  });

export function useUpdateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: hr.AppraisalUpdate }) => hr.updateAppraisal(id, patch),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: appraisalKeys.appraisal(v.id) }),
  });
}
export function useUpsertRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.AppraisalRatingInsert) => hr.upsertRating(p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: appraisalKeys.ratings(p.appraisal_id) }),
  });
}
export function useSubmitSelfReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.submitSelfReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export function useSubmitManagerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.submitManagerReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export function useFinalizeAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.finalizeAppraisal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export function useAcknowledgeAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response?: string }) => hr.acknowledgeAppraisal(id, response),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: hr.AppraisalGoalInsert) => hr.createGoal(p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: appraisalKeys.goals(p.appraisal_id) }),
  });
}
export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<hr.AppraisalGoal> }) => hr.updateGoal(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hr.deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appraisalKeys.all }),
  });
}
export const usePendingIncrements = () =>
  useQuery({ queryKey: appraisalKeys.pendingIncrements(), queryFn: hr.listPendingIncrements });