// Sales & CRM data management

import { getItem, setItem } from '../storage';

export type LeadStatus = 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
export type OpportunityStage = 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'done' | 'cancelled';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: LeadStatus;
  expectedRevenue: number;
  probability: number;
  assignedTo?: string;
  tags: string[];
  notes?: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  name: string;
  contactId?: string;
  contactName: string;
  company?: string;
  stage: OpportunityStage;
  expectedRevenue: number;
  probability: number;
  expectedCloseDate: string;
  assignedTo?: string;
  products: OpportunityProduct[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface SalesOrder {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  orderDate: string;
  deliveryDate?: string;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  type: 'call' | 'meeting' | 'note' | 'task';
  subject: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  timestamp: string;
}

// Default demo data
const DEFAULT_CONTACTS: Contact[] = [];

const DEFAULT_LEADS: Lead[] = [];

const DEFAULT_OPPORTUNITIES: Opportunity[] = [];

const DEFAULT_ORDERS: SalesOrder[] = [];

// CRUD operations
export function getContacts(): Contact[] {
  return getItem<Contact[]>('contacts', DEFAULT_CONTACTS);
}

export function getContact(id: string): Contact | undefined {
  return getContacts().find((c) => c.id === id);
}

export function saveContact(contact: Contact): void {
  const contacts = getContacts();
  const index = contacts.findIndex((c) => c.id === contact.id);
  if (index >= 0) {
    contacts[index] = { ...contact, updatedAt: new Date().toISOString() };
  } else {
    contacts.push({ ...contact, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('contacts', contacts);
}

export function getLeads(): Lead[] {
  return getItem<Lead[]>('leads', DEFAULT_LEADS);
}

export function getLead(id: string): Lead | undefined {
  return getLeads().find((l) => l.id === id);
}

export function saveLead(lead: Lead): void {
  const leads = getLeads();
  const index = leads.findIndex((l) => l.id === lead.id);
  if (index >= 0) {
    leads[index] = { ...lead, updatedAt: new Date().toISOString() };
  } else {
    leads.push({ ...lead, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('leads', leads);
}

export function updateLeadStatus(id: string, status: LeadStatus): void {
  const lead = getLead(id);
  if (lead) {
    lead.status = status;
    saveLead(lead);
  }
}

export function getOpportunities(): Opportunity[] {
  return getItem<Opportunity[]>('opportunities', DEFAULT_OPPORTUNITIES);
}

export function getOpportunity(id: string): Opportunity | undefined {
  return getOpportunities().find((o) => o.id === id);
}

export function saveOpportunity(opp: Opportunity): void {
  const opportunities = getOpportunities();
  const index = opportunities.findIndex((o) => o.id === opp.id);
  if (index >= 0) {
    opportunities[index] = { ...opp, updatedAt: new Date().toISOString() };
  } else {
    opportunities.push({ ...opp, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('opportunities', opportunities);
}

export function getSalesOrders(): SalesOrder[] {
  return getItem<SalesOrder[]>('salesOrders', DEFAULT_ORDERS);
}

export function getSalesOrder(id: string): SalesOrder | undefined {
  return getSalesOrders().find((o) => o.id === id);
}

export function saveSalesOrder(order: SalesOrder): void {
  const orders = getSalesOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    orders[index] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    orders.push({ ...order, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setItem('salesOrders', orders);
}
