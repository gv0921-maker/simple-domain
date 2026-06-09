// TanStack Query hooks for the HR module.
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