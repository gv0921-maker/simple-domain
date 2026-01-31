// HR/Employees module data layer

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  managerId?: string;
  managerName?: string;
  hireDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  workLocation: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  managerName?: string;
  parentId?: string;
  employeeCount: number;
  color: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workedHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'remote';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
}

export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'permanent' | 'temporary' | 'contractor' | 'intern';
  startDate: string;
  endDate?: string;
  salary: number;
  currency: string;
  status: 'active' | 'expired' | 'terminated';
}

// Mock data
let employees: Employee[] = [
  { id: 'EMP-001', employeeId: 'E001', name: 'John Smith', email: 'john.smith@company.com', phone: '+1 555-0101', departmentId: 'DEPT-001', departmentName: 'Engineering', jobTitle: 'Senior Developer', hireDate: '2021-03-15', status: 'active', workLocation: 'Office' },
  { id: 'EMP-002', employeeId: 'E002', name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '+1 555-0102', departmentId: 'DEPT-001', departmentName: 'Engineering', jobTitle: 'Tech Lead', managerId: 'EMP-005', managerName: 'Michael Chen', hireDate: '2020-06-01', status: 'active', workLocation: 'Remote' },
  { id: 'EMP-003', employeeId: 'E003', name: 'Mike Williams', email: 'mike.w@company.com', phone: '+1 555-0103', departmentId: 'DEPT-002', departmentName: 'Sales', jobTitle: 'Sales Manager', hireDate: '2019-11-20', status: 'active', workLocation: 'Office' },
  { id: 'EMP-004', employeeId: 'E004', name: 'Emily Brown', email: 'emily.b@company.com', phone: '+1 555-0104', departmentId: 'DEPT-003', departmentName: 'HR', jobTitle: 'HR Specialist', hireDate: '2022-01-10', status: 'on_leave', workLocation: 'Office' },
  { id: 'EMP-005', employeeId: 'E005', name: 'Michael Chen', email: 'michael.c@company.com', phone: '+1 555-0105', departmentId: 'DEPT-001', departmentName: 'Engineering', jobTitle: 'Engineering Manager', hireDate: '2018-05-01', status: 'active', workLocation: 'Hybrid' },
  { id: 'EMP-006', employeeId: 'E006', name: 'Lisa Anderson', email: 'lisa.a@company.com', phone: '+1 555-0106', departmentId: 'DEPT-004', departmentName: 'Finance', jobTitle: 'Financial Analyst', hireDate: '2021-08-15', status: 'active', workLocation: 'Office' },
  { id: 'EMP-007', employeeId: 'E007', name: 'David Lee', email: 'david.l@company.com', phone: '+1 555-0107', departmentId: 'DEPT-002', departmentName: 'Sales', jobTitle: 'Account Executive', hireDate: '2023-02-01', status: 'active', workLocation: 'Remote' },
  { id: 'EMP-008', employeeId: 'E008', name: 'Jennifer Taylor', email: 'jennifer.t@company.com', phone: '+1 555-0108', departmentId: 'DEPT-005', departmentName: 'Marketing', jobTitle: 'Marketing Coordinator', hireDate: '2022-09-01', status: 'active', workLocation: 'Office' },
];

let departments: Department[] = [
  { id: 'DEPT-001', name: 'Engineering', code: 'ENG', managerId: 'EMP-005', managerName: 'Michael Chen', employeeCount: 12, color: '#3b82f6' },
  { id: 'DEPT-002', name: 'Sales', code: 'SAL', managerId: 'EMP-003', managerName: 'Mike Williams', employeeCount: 8, color: '#22c55e' },
  { id: 'DEPT-003', name: 'HR', code: 'HR', employeeCount: 4, color: '#f59e0b' },
  { id: 'DEPT-004', name: 'Finance', code: 'FIN', employeeCount: 5, color: '#8b5cf6' },
  { id: 'DEPT-005', name: 'Marketing', code: 'MKT', employeeCount: 6, color: '#ec4899' },
  { id: 'DEPT-006', name: 'Operations', code: 'OPS', employeeCount: 10, color: '#06b6d4' },
];

let attendance: Attendance[] = [
  { id: 'ATT-001', employeeId: 'EMP-001', employeeName: 'John Smith', date: '2024-01-15', checkIn: '09:00', checkOut: '18:00', workedHours: 9, status: 'present' },
  { id: 'ATT-002', employeeId: 'EMP-002', employeeName: 'Sarah Johnson', date: '2024-01-15', checkIn: '08:45', checkOut: '17:30', workedHours: 8.75, status: 'present' },
  { id: 'ATT-003', employeeId: 'EMP-003', employeeName: 'Mike Williams', date: '2024-01-15', checkIn: '09:30', checkOut: '18:15', workedHours: 8.75, status: 'late' },
  { id: 'ATT-004', employeeId: 'EMP-004', employeeName: 'Emily Brown', date: '2024-01-15', status: 'absent', workedHours: 0 },
  { id: 'ATT-005', employeeId: 'EMP-005', employeeName: 'Michael Chen', date: '2024-01-15', checkIn: '08:30', checkOut: '19:00', workedHours: 10.5, status: 'present' },
  { id: 'ATT-006', employeeId: 'EMP-006', employeeName: 'Lisa Anderson', date: '2024-01-15', checkIn: '09:00', checkOut: '13:00', workedHours: 4, status: 'half_day' },
  { id: 'ATT-007', employeeId: 'EMP-007', employeeName: 'David Lee', date: '2024-01-15', checkIn: '09:00', checkOut: '17:00', workedHours: 8, status: 'remote' },
];

let leaveRequests: LeaveRequest[] = [
  { id: 'LR-001', employeeId: 'EMP-004', employeeName: 'Emily Brown', type: 'sick', startDate: '2024-01-15', endDate: '2024-01-17', days: 3, reason: 'Flu', status: 'approved', approvedBy: 'HR Manager' },
  { id: 'LR-002', employeeId: 'EMP-001', employeeName: 'John Smith', type: 'annual', startDate: '2024-02-01', endDate: '2024-02-05', days: 5, reason: 'Family vacation', status: 'pending' },
  { id: 'LR-003', employeeId: 'EMP-002', employeeName: 'Sarah Johnson', type: 'annual', startDate: '2024-01-22', endDate: '2024-01-24', days: 3, status: 'approved', approvedBy: 'Michael Chen' },
  { id: 'LR-004', employeeId: 'EMP-006', employeeName: 'Lisa Anderson', type: 'unpaid', startDate: '2024-01-15', endDate: '2024-01-15', days: 0.5, reason: 'Personal appointment', status: 'approved' },
];

let contracts: Contract[] = [
  { id: 'CON-001', employeeId: 'EMP-001', employeeName: 'John Smith', type: 'permanent', startDate: '2021-03-15', salary: 85000, currency: 'USD', status: 'active' },
  { id: 'CON-002', employeeId: 'EMP-002', employeeName: 'Sarah Johnson', type: 'permanent', startDate: '2020-06-01', salary: 95000, currency: 'USD', status: 'active' },
  { id: 'CON-003', employeeId: 'EMP-003', employeeName: 'Mike Williams', type: 'permanent', startDate: '2019-11-20', salary: 78000, currency: 'USD', status: 'active' },
  { id: 'CON-004', employeeId: 'EMP-005', employeeName: 'Michael Chen', type: 'permanent', startDate: '2018-05-01', salary: 120000, currency: 'USD', status: 'active' },
  { id: 'CON-005', employeeId: 'EMP-007', employeeName: 'David Lee', type: 'temporary', startDate: '2023-02-01', endDate: '2024-02-01', salary: 55000, currency: 'USD', status: 'active' },
];

// CRUD operations
export function getEmployees() {
  return [...employees];
}

export function getEmployee(id: string) {
  return employees.find(e => e.id === id);
}

export function createEmployee(data: Omit<Employee, 'id' | 'employeeId'>) {
  const newId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
  const newEmployee: Employee = {
    ...data,
    id: newId,
    employeeId: `E${String(employees.length + 1).padStart(3, '0')}`,
  };
  employees = [...employees, newEmployee];
  return newEmployee;
}

export function updateEmployee(id: string, data: Partial<Employee>) {
  employees = employees.map(e => e.id === id ? { ...e, ...data } : e);
  return employees.find(e => e.id === id);
}

export function deleteEmployee(id: string) {
  employees = employees.filter(e => e.id !== id);
}

export function getDepartments() {
  return [...departments];
}

export function createDepartment(data: Omit<Department, 'id' | 'employeeCount'>) {
  const newId = `DEPT-${String(departments.length + 1).padStart(3, '0')}`;
  const newDept: Department = { ...data, id: newId, employeeCount: 0 };
  departments = [...departments, newDept];
  return newDept;
}

export function updateDepartment(id: string, data: Partial<Department>) {
  departments = departments.map(d => d.id === id ? { ...d, ...data } : d);
  return departments.find(d => d.id === id);
}

export function deleteDepartment(id: string) {
  departments = departments.filter(d => d.id !== id);
}

export function getAttendance(date?: string) {
  if (date) {
    return attendance.filter(a => a.date === date);
  }
  return [...attendance];
}

export function createAttendance(data: Omit<Attendance, 'id'>) {
  const newId = `ATT-${String(attendance.length + 1).padStart(3, '0')}`;
  const newAtt: Attendance = { ...data, id: newId };
  attendance = [...attendance, newAtt];
  return newAtt;
}

export function getLeaveRequests() {
  return [...leaveRequests];
}

export function createLeaveRequest(data: Omit<LeaveRequest, 'id'>) {
  const newId = `LR-${String(leaveRequests.length + 1).padStart(3, '0')}`;
  const newLR: LeaveRequest = { ...data, id: newId };
  leaveRequests = [...leaveRequests, newLR];
  return newLR;
}

export function updateLeaveRequest(id: string, data: Partial<LeaveRequest>) {
  leaveRequests = leaveRequests.map(lr => lr.id === id ? { ...lr, ...data } : lr);
  return leaveRequests.find(lr => lr.id === id);
}

export function getContracts() {
  return [...contracts];
}

export function createContract(data: Omit<Contract, 'id'>) {
  const newId = `CON-${String(contracts.length + 1).padStart(3, '0')}`;
  const newContract: Contract = { ...data, id: newId };
  contracts = [...contracts, newContract];
  return newContract;
}

// HR metrics
export function getHRMetrics() {
  const totalEmployees = employees.filter(e => e.status !== 'terminated').length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const onLeave = employees.filter(e => e.status === 'on_leave').length;
  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'pending').length;
  const avgTenure = employees.reduce((sum, e) => {
    const years = (new Date().getTime() - new Date(e.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    return sum + years;
  }, 0) / employees.length;

  return {
    totalEmployees,
    activeEmployees,
    onLeave,
    pendingLeaves,
    avgTenure: Math.round(avgTenure * 10) / 10,
    departmentCount: departments.length,
  };
}
