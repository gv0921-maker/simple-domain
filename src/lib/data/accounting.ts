// Accounting module data layer

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  balance: number;
  isReconcilable: boolean;
  isActive: boolean;
}

export interface JournalEntry {
  id: string;
  name: string;
  date: string;
  journal: string;
  reference?: string;
  status: 'draft' | 'posted' | 'cancelled';
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
  partnerId?: string;
  partnerName?: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  lines: InvoiceLine[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
}

export interface InvoiceLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  number: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'received' | 'paid' | 'overdue';
  total: number;
  amountPaid: number;
}

export interface Payment {
  id: string;
  name: string;
  date: string;
  type: 'inbound' | 'outbound';
  partnerId: string;
  partnerName: string;
  amount: number;
  method: 'bank_transfer' | 'cash' | 'check' | 'card';
  status: 'draft' | 'posted' | 'reconciled';
  reference?: string;
}

// Mock data
let accounts: Account[] = [
  { id: 'ACC-100', code: '1000', name: 'Cash', type: 'asset', balance: 150000, isReconcilable: true, isActive: true },
  { id: 'ACC-101', code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 85000, isReconcilable: true, isActive: true },
  { id: 'ACC-102', code: '1200', name: 'Inventory', type: 'asset', balance: 320000, isReconcilable: false, isActive: true },
  { id: 'ACC-103', code: '1300', name: 'Prepaid Expenses', type: 'asset', balance: 12000, isReconcilable: false, isActive: true },
  { id: 'ACC-200', code: '2000', name: 'Accounts Payable', type: 'liability', balance: 45000, isReconcilable: true, isActive: true },
  { id: 'ACC-201', code: '2100', name: 'Accrued Liabilities', type: 'liability', balance: 18000, isReconcilable: false, isActive: true },
  { id: 'ACC-202', code: '2200', name: 'Notes Payable', type: 'liability', balance: 100000, isReconcilable: false, isActive: true },
  { id: 'ACC-300', code: '3000', name: 'Common Stock', type: 'equity', balance: 200000, isReconcilable: false, isActive: true },
  { id: 'ACC-301', code: '3100', name: 'Retained Earnings', type: 'equity', balance: 150000, isReconcilable: false, isActive: true },
  { id: 'ACC-400', code: '4000', name: 'Sales Revenue', type: 'revenue', balance: 520000, isReconcilable: false, isActive: true },
  { id: 'ACC-401', code: '4100', name: 'Service Revenue', type: 'revenue', balance: 85000, isReconcilable: false, isActive: true },
  { id: 'ACC-500', code: '5000', name: 'Cost of Goods Sold', type: 'expense', balance: 280000, isReconcilable: false, isActive: true },
  { id: 'ACC-501', code: '5100', name: 'Salaries Expense', type: 'expense', balance: 120000, isReconcilable: false, isActive: true },
  { id: 'ACC-502', code: '5200', name: 'Rent Expense', type: 'expense', balance: 36000, isReconcilable: false, isActive: true },
  { id: 'ACC-503', code: '5300', name: 'Utilities Expense', type: 'expense', balance: 8500, isReconcilable: false, isActive: true },
];

let journalEntries: JournalEntry[] = [
  {
    id: 'JE-001',
    name: 'JE/2024/0001',
    date: '2024-01-15',
    journal: 'Sales',
    reference: 'INV-001',
    status: 'posted',
    lines: [
      { id: 'JL-001', accountId: 'ACC-101', accountName: 'Accounts Receivable', debit: 11800, credit: 0 },
      { id: 'JL-002', accountId: 'ACC-400', accountName: 'Sales Revenue', debit: 0, credit: 10000 },
      { id: 'JL-003', accountId: 'ACC-201', accountName: 'Accrued Liabilities', debit: 0, credit: 1800 },
    ],
    totalDebit: 11800,
    totalCredit: 11800,
  },
  {
    id: 'JE-002',
    name: 'JE/2024/0002',
    date: '2024-01-18',
    journal: 'Purchase',
    status: 'posted',
    lines: [
      { id: 'JL-004', accountId: 'ACC-102', accountName: 'Inventory', debit: 5000, credit: 0 },
      { id: 'JL-005', accountId: 'ACC-200', accountName: 'Accounts Payable', debit: 0, credit: 5000 },
    ],
    totalDebit: 5000,
    totalCredit: 5000,
  },
];

let invoices: Invoice[] = [
  {
    id: 'INV-001',
    number: 'INV/2024/0001',
    customerId: 'CUST-001',
    customerName: 'Acme Corporation',
    date: '2024-01-15',
    dueDate: '2024-02-14',
    status: 'sent',
    lines: [
      { id: 'IL-001', productId: 'PROD-001', productName: 'Widget A', quantity: 50, unitPrice: 100, taxRate: 18, subtotal: 5000 },
      { id: 'IL-002', productId: 'PROD-002', productName: 'Widget B', quantity: 25, unitPrice: 200, taxRate: 18, subtotal: 5000 },
    ],
    subtotal: 10000,
    tax: 1800,
    total: 11800,
    amountPaid: 0,
    amountDue: 11800,
  },
  {
    id: 'INV-002',
    number: 'INV/2024/0002',
    customerId: 'CUST-002',
    customerName: 'Tech Solutions Ltd',
    date: '2024-01-10',
    dueDate: '2024-02-09',
    status: 'paid',
    lines: [
      { id: 'IL-003', productId: 'PROD-003', productName: 'Service Package', quantity: 1, unitPrice: 5000, taxRate: 18, subtotal: 5000 },
    ],
    subtotal: 5000,
    tax: 900,
    total: 5900,
    amountPaid: 5900,
    amountDue: 0,
  },
  {
    id: 'INV-003',
    number: 'INV/2024/0003',
    customerId: 'CUST-003',
    customerName: 'Global Industries',
    date: '2024-01-05',
    dueDate: '2024-01-20',
    status: 'overdue',
    lines: [
      { id: 'IL-004', productId: 'PROD-001', productName: 'Widget A', quantity: 100, unitPrice: 100, taxRate: 18, subtotal: 10000 },
    ],
    subtotal: 10000,
    tax: 1800,
    total: 11800,
    amountPaid: 0,
    amountDue: 11800,
  },
];

let bills: Bill[] = [
  { id: 'BILL-001', number: 'BILL/2024/0001', vendorId: 'VEND-001', vendorName: 'Supplier Co', date: '2024-01-12', dueDate: '2024-02-12', status: 'received', total: 8500, amountPaid: 0 },
  { id: 'BILL-002', number: 'BILL/2024/0002', vendorId: 'VEND-002', vendorName: 'Parts Inc', date: '2024-01-08', dueDate: '2024-02-08', status: 'paid', total: 3200, amountPaid: 3200 },
];

let payments: Payment[] = [
  { id: 'PAY-001', name: 'PAY/2024/0001', date: '2024-01-12', type: 'inbound', partnerId: 'CUST-002', partnerName: 'Tech Solutions Ltd', amount: 5900, method: 'bank_transfer', status: 'reconciled' },
  { id: 'PAY-002', name: 'PAY/2024/0002', date: '2024-01-14', type: 'outbound', partnerId: 'VEND-002', partnerName: 'Parts Inc', amount: 3200, method: 'bank_transfer', status: 'posted' },
];

// CRUD operations
export function getAccounts() {
  return [...accounts];
}

export function getAccountsByType(type: Account['type']) {
  return accounts.filter(a => a.type === type);
}

export function createAccount(data: Omit<Account, 'id' | 'balance'>) {
  const newId = `ACC-${String(accounts.length + 1).padStart(3, '0')}`;
  const newAccount: Account = { ...data, id: newId, balance: 0 };
  accounts = [...accounts, newAccount];
  return newAccount;
}

export function updateAccount(id: string, data: Partial<Account>) {
  accounts = accounts.map(a => a.id === id ? { ...a, ...data } : a);
  return accounts.find(a => a.id === id);
}

export function getJournalEntries() {
  return [...journalEntries];
}

export function createJournalEntry(data: Omit<JournalEntry, 'id' | 'name'>) {
  const newId = `JE-${String(journalEntries.length + 1).padStart(3, '0')}`;
  const newJE: JournalEntry = {
    ...data,
    id: newId,
    name: `JE/2024/${String(journalEntries.length + 1).padStart(4, '0')}`,
  };
  journalEntries = [...journalEntries, newJE];
  return newJE;
}

export function updateJournalEntry(id: string, data: Partial<JournalEntry>) {
  journalEntries = journalEntries.map(je => je.id === id ? { ...je, ...data } : je);
  return journalEntries.find(je => je.id === id);
}

export function getInvoices() {
  return [...invoices];
}

export function getInvoice(id: string) {
  return invoices.find(inv => inv.id === id);
}

export function createInvoice(data: Omit<Invoice, 'id' | 'number'>) {
  const newId = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
  const newInvoice: Invoice = {
    ...data,
    id: newId,
    number: `INV/2024/${String(invoices.length + 1).padStart(4, '0')}`,
  };
  invoices = [...invoices, newInvoice];
  return newInvoice;
}

export function updateInvoice(id: string, data: Partial<Invoice>) {
  invoices = invoices.map(inv => inv.id === id ? { ...inv, ...data } : inv);
  return invoices.find(inv => inv.id === id);
}

export function getBills() {
  return [...bills];
}

export function getPayments() {
  return [...payments];
}

export function createPayment(data: Omit<Payment, 'id' | 'name'>) {
  const newId = `PAY-${String(payments.length + 1).padStart(3, '0')}`;
  const newPayment: Payment = {
    ...data,
    id: newId,
    name: `PAY/2024/${String(payments.length + 1).padStart(4, '0')}`,
  };
  payments = [...payments, newPayment];
  return newPayment;
}

// Financial metrics
export function getFinancialSummary() {
  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  
  const receivables = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.amountDue, 0);
  const payables = bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.total - b.amountPaid), 0);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalRevenue,
    totalExpenses,
    netIncome,
    receivables,
    payables,
  };
}
