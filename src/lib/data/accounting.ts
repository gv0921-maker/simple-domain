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
  status: 'draft' | 'paid' | 'overdue' | 'cancelled';
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
let accounts: Account[] = [];

let journalEntries: JournalEntry[] = [];

let invoices: Invoice[] = [];

let bills: Bill[] = [];

let payments: Payment[] = [];

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
