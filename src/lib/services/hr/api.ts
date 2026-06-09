// HR module async service layer — Supabase-backed.
// Thin pass-through wrappers around the generated client. All identifiers
// follow the DB snake_case schema for simplicity.

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Department = Database['public']['Tables']['departments']['Row'];
export type DepartmentInsert = Database['public']['Tables']['departments']['Insert'];
export type DepartmentUpdate = Database['public']['Tables']['departments']['Update'];

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
export type ContractUpdate = Database['public']['Tables']['contracts']['Update'];

// ---------- Departments ----------
export async function listDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getDepartment(id: string): Promise<Department | null> {
  const { data, error } = await supabase.from('departments').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDepartment(payload: DepartmentInsert): Promise<Department> {
  const { data, error } = await supabase.from('departments').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, patch: DepartmentUpdate): Promise<Department> {
  const { data, error } = await supabase
    .from('departments').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Employees ----------
export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees').select('*').order('full_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEmployee(payload: EmployeeInsert): Promise<Employee> {
  const { data, error } = await supabase.from('employees').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, patch: EmployeeUpdate): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Contracts ----------
export async function listContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listContractsByEmployee(employeeId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts').select('*').eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getContract(id: string): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createContract(payload: ContractInsert): Promise<Contract> {
  const { data, error } = await supabase.from('contracts').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateContract(id: string, patch: ContractUpdate): Promise<Contract> {
  const { data, error } = await supabase
    .from('contracts').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
}

// Re-export Batch 2 attendance service surface
export * from './attendance';
// Re-export Batch 3 leaves + roster service surface
export * from './leaves';
// Re-export Batch 4 payroll service surface
export * from './payroll';
// Re-export Batch 5 appraisals service surface
export * from './appraisals';