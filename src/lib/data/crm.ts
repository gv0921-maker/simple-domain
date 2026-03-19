// CRM Data Management - Contacts, Companies, Leads, Opportunities, Activities, Pipelines

import { getItem, setItem } from '../storage';

// ================== Types ==================

export type ContactType = 'individual' | 'company';
export type ContactStatus = 'active' | 'archived';
export type LeadSource = 'website' | 'referral' | 'social_media' | 'trade_show' | 'cold_call' | 'email_campaign' | 'import' | 'manual' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';
export type OpportunityStage = 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'follow_up';
export type NoteVisibility = 'private' | 'team' | 'public';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  type: 'billing' | 'shipping' | 'both';
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  employeeCount?: string;
  annualRevenue?: number;
  phone?: string;
  email?: string;
  addresses: Address[];
  parentCompanyId?: string;
  tags: string[];
  notes?: string;
  assignedTo?: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  type: ContactType;
  firstName: string;
  lastName: string;
  email: string;
  emails?: { email: string; type: string }[];
  phone?: string;
  phones?: { phone: string; type: string }[];
  companyId?: string;
  companyName?: string;
  jobTitle?: string;
  department?: string;
  addresses: Address[];
  tags: string[];
  notes?: string;
  assignedTo?: string;
  status: ContactStatus;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  title: string;
  contactId?: string;
  contactName: string;
  email: string;
  phone?: string;
  companyId?: string;
  companyName?: string;
  source: LeadSource;
  sourceDetail?: string;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  expectedRevenue: number;
  probability: number;
  assignedTo?: string;
  teamId?: string;
  tags: string[];
  notes?: string;
  qualifiedAt?: string;
  convertedAt?: string;
  convertedToOpportunityId?: string;
  lostReason?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  probability: number;
  color: string;
  description?: string;
  automationHooks?: string[];
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityProduct {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Opportunity {
  id: string;
  name: string;
  contactId?: string;
  contactName: string;
  companyId?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  pipelineId: string;
  stageId: string;
  stage: OpportunityStage;
  expectedRevenue: number;
  probability: number;
  priority: 0 | 1 | 2 | 3; // star rating (0=none, 1-3 stars like Odoo)
  expectedCloseDate: string;
  assignedTo?: string;
  salesTeam?: string;
  teamId?: string;
  products: OpportunityProduct[];
  tags: string[];
  notes?: string;
  internalNotes?: string;
  lostReason?: string;
  wonAt?: string;
  lostAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  relatedTo: 'contact' | 'company' | 'lead' | 'opportunity';
  relatedId: string;
  userId: string;
  userName: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  priority?: LeadPriority;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  relatedTo: 'contact' | 'company' | 'lead' | 'opportunity';
  relatedId: string;
  userId: string;
  userName: string;
  visibility: NoteVisibility;
  mentions?: string[];
  attachments?: { name: string; url: string; type: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CRMTag {
  id: string;
  name: string;
  color: string;
  category?: string;
}

// ================== Default Data ==================

const DEFAULT_PIPELINES: Pipeline[] = [
  {
    id: 'default',
    name: 'Default Sales Pipeline',
    description: 'Standard sales pipeline for all opportunities',
    isDefault: true,
    stages: [
      { id: 'new', pipelineId: 'default', name: 'New', order: 1, probability: 10, color: 'hsl(210, 70%, 55%)' },
      { id: 'qualified', pipelineId: 'default', name: 'Qualified', order: 2, probability: 30, color: 'hsl(174, 60%, 45%)' },
      { id: 'proposition', pipelineId: 'default', name: 'Proposition', order: 3, probability: 60, color: 'hsl(38, 90%, 55%)' },
      { id: 'won', pipelineId: 'default', name: 'Won', order: 4, probability: 100, color: 'hsl(142, 60%, 45%)' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'GOOD LIFE FURNITURE',
    website: '',
    industry: 'Furniture',
    phone: '+91 8296830111',
    email: 'vigu092@gmail.com',
    addresses: [{ street: 'GROUND FLOOR, KULALA BHAVANA', city: 'Dakshina Kannada', type: 'both' }],
    tags: ['Headquarters'],
    status: 'active',
    createdAt: '2025-11-01T13:42:10Z',
    updatedAt: '2025-11-01T13:49:01Z',
  },
  {
    id: 'c2',
    name: 'Goodlife Kurlon-Home',
    website: '',
    industry: 'Furniture',
    email: 'sales@goodlifefurnitures.in',
    addresses: [{ street: 'Ground floor, Mayur Park', city: 'Mangalore', type: 'both' }],
    tags: ['Branch'],
    status: 'active',
    createdAt: '2025-11-03T11:22:56Z',
    updatedAt: '2025-11-03T11:22:56Z',
  },
];

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: '1',
    type: 'individual',
    firstName: 'Mohan',
    lastName: 'Raj',
    email: 'goodlifefurnituremanager@gmail.com',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-01T15:00:46Z',
    updatedAt: '2025-11-03T17:31:45Z',
  },
  {
    id: '2',
    type: 'individual',
    firstName: 'Vikesh',
    lastName: '',
    email: 'glfslteam1@gmail.com',
    addresses: [],
    tags: ['Sales Team'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-01T15:10:06Z',
    updatedAt: '2025-11-03T10:31:01Z',
  },
  {
    id: '3',
    type: 'individual',
    firstName: 'Manisha',
    lastName: '',
    email: 'ggoodllife1@gmail.com',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-01T15:11:10Z',
    updatedAt: '2025-11-03T10:43:12Z',
  },
  {
    id: '4',
    type: 'individual',
    firstName: 'Manoj',
    lastName: 'Acharya',
    email: 'glfdlincharge@gmail.com',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:24:41Z',
    updatedAt: '2025-11-03T10:25:02Z',
  },
  {
    id: '5',
    type: 'individual',
    firstName: 'Mahalakshmi',
    lastName: '',
    email: 'goodlifefurniturebilling@gmail.com',
    addresses: [],
    tags: ['Billing'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:25:36Z',
    updatedAt: '2025-11-03T05:27:00Z',
  },
  {
    id: '6',
    type: 'individual',
    firstName: 'Budhan',
    lastName: 'Kumar',
    email: '',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:27:38Z',
    updatedAt: '2025-11-03T04:27:38Z',
  },
  {
    id: '7',
    type: 'individual',
    firstName: 'Sateesha',
    lastName: 'M',
    email: '',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:29:26Z',
    updatedAt: '2025-12-08T13:02:23Z',
  },
  {
    id: '8',
    type: 'individual',
    firstName: 'Nanda',
    lastName: 'Kishor',
    email: '',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:32:18Z',
    updatedAt: '2025-12-23T08:08:29Z',
  },
  {
    id: '9',
    type: 'individual',
    firstName: 'Naveen',
    lastName: 'Acharya',
    email: '',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:37:00Z',
    updatedAt: '2025-11-03T04:37:00Z',
  },
  {
    id: '10',
    type: 'individual',
    firstName: 'Nisha',
    lastName: 'Sharel',
    email: 'glfkadri1@gmail.com',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T04:47:45Z',
    updatedAt: '2025-12-26T06:30:08Z',
  },
  {
    id: '11',
    type: 'individual',
    firstName: 'Manager',
    lastName: '',
    email: 'goodlifefurnituremanager@gmail.com',
    addresses: [],
    tags: ['Management'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-03T17:29:44Z',
    updatedAt: '2026-01-06T14:46:11Z',
  },
  {
    id: '12',
    type: 'individual',
    firstName: 'Aashni',
    lastName: '',
    email: 'goodlifepsks@gmail.com',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-11-17T05:04:27Z',
    updatedAt: '2025-12-26T06:31:21Z',
  },
  {
    id: '13',
    type: 'individual',
    firstName: 'Amarnath',
    lastName: '',
    email: '',
    addresses: [],
    tags: ['Staff'],
    status: 'active',
    score: 0,
    createdAt: '2025-12-08T05:52:26Z',
    updatedAt: '2025-12-08T13:02:19Z',
  },
  {
    id: '14',
    type: 'individual',
    firstName: 'Vakil',
    lastName: '',
    email: '',
    addresses: [],
    tags: [],
    status: 'active',
    score: 0,
    createdAt: '2025-12-25T08:00:50Z',
    updatedAt: '2025-12-25T08:00:50Z',
  },
  {
    id: '15',
    type: 'individual',
    firstName: 'Chandrashekara',
    lastName: '',
    email: '',
    addresses: [],
    tags: [],
    status: 'active',
    score: 0,
    createdAt: '2025-12-25T08:05:23Z',
    updatedAt: '2025-12-25T08:05:23Z',
  },
  {
    id: '16',
    type: 'individual',
    firstName: 'Ashraf',
    lastName: '',
    email: '',
    addresses: [],
    tags: [],
    status: 'active',
    score: 0,
    createdAt: '2025-12-25T08:08:19Z',
    updatedAt: '2025-12-25T08:08:19Z',
  },
  {
    id: '17',
    type: 'individual',
    firstName: 'K.M.',
    lastName: 'Salian',
    email: '',
    phone: '+91 63661 75175',
    addresses: [],
    tags: [],
    status: 'active',
    score: 0,
    createdAt: '2026-03-05T06:20:11Z',
    updatedAt: '2026-03-05T06:20:11Z',
  },
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'l1',
    title: 'Office Furniture Quote',
    contactId: '4',
    contactName: 'Emily Davis',
    email: 'emily@newstartup.example.com',
    phone: '+1 555-1111',
    companyName: 'New Startup LLC',
    source: 'website',
    status: 'qualified',
    priority: 'high',
    score: 75,
    expectedRevenue: 25000,
    probability: 60,
    assignedTo: 'Sales Manager',
    tags: ['Hot Lead'],
    createdBy: 'Sales Manager',
    createdAt: '2025-01-18T10:00:00Z',
    updatedAt: '2025-01-22T14:00:00Z',
  },
  {
    id: 'l2',
    title: 'Retail Store Setup',
    contactName: 'Robert Wilson',
    email: 'rwilson@retailchain.example.com',
    companyName: 'Retail Chain Corp',
    source: 'referral',
    status: 'qualified',
    priority: 'high',
    score: 85,
    expectedRevenue: 150000,
    probability: 75,
    tags: ['Enterprise'],
    createdBy: 'Management',
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-24T11:00:00Z',
  },
  {
    id: 'l3',
    title: 'Home Office Collection',
    contactName: 'Lisa Brown',
    email: 'lisa.b@freelance.example.me',
    source: 'social_media',
    status: 'new',
    priority: 'low',
    score: 30,
    expectedRevenue: 5000,
    probability: 30,
    tags: [],
    createdBy: 'Sales Manager',
    createdAt: '2025-01-25T14:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'l4',
    title: 'Corporate Relocation Furniture',
    contactName: 'James Anderson',
    email: 'janderson@bigcorp.example.com',
    phone: '+1 555-2222',
    companyName: 'BigCorp Industries',
    source: 'trade_show',
    status: 'contacted',
    priority: 'medium',
    score: 55,
    expectedRevenue: 75000,
    probability: 45,
    assignedTo: 'Sales Rep',
    tags: ['Trade Show 2025'],
    createdBy: 'Management',
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-01-26T09:00:00Z',
  },
];

const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'o1',
    name: 'Office Design Project',
    contactId: '1',
    contactName: 'John Smith',
    email: 'john.smith@acme.example.com',
    phone: '+1 555-0123',
    companyId: 'c1',
    companyName: 'Acme Corporation',
    pipelineId: 'default',
    stageId: 'new',
    stage: 'new',
    expectedRevenue: 24000,
    probability: 10,
    priority: 2,
    expectedCloseDate: '2025-02-28',
    assignedTo: 'Sales Manager',
    salesTeam: 'Pre-Sales',
    products: [],
    tags: ['Design'],
    createdAt: '2025-01-08T10:00:00Z',
    updatedAt: '2025-01-26T14:00:00Z',
  },
  {
    id: 'o2',
    name: 'Quote for 150 carpets',
    contactId: '2',
    contactName: 'Sarah Johnson',
    email: 'sarah.j@techstart.example.io',
    companyId: 'c2',
    companyName: 'TechStart Inc',
    pipelineId: 'default',
    stageId: 'new',
    stage: 'new',
    expectedRevenue: 40000,
    probability: 10,
    priority: 1,
    expectedCloseDate: '2025-03-15',
    salesTeam: 'Pre-Sales',
    products: [],
    tags: ['Product'],
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-23T11:00:00Z',
  },
  {
    id: 'o3',
    name: 'Interest in your products',
    contactId: '3',
    contactName: 'Michael Chen',
    email: 'mchen@globalretail.example.com',
    phone: '+1 555-0789',
    companyId: 'c3',
    companyName: 'The Jackson Group',
    pipelineId: 'default',
    stageId: 'qualified',
    stage: 'qualified',
    expectedRevenue: 2000,
    probability: 30,
    priority: 2,
    expectedCloseDate: '2025-02-15',
    assignedTo: 'Sales Manager',
    salesTeam: 'Pre-Sales',
    products: [],
    tags: ['Product', 'Information'],
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-27T10:00:00Z',
  },
  {
    id: 'o4',
    name: 'DeltaPC: 10 Computer Desks',
    contactName: 'Lisa Brown',
    email: 'lisa@deltapc.example.com',
    companyName: 'DeltaPC',
    pipelineId: 'default',
    stageId: 'qualified',
    stage: 'qualified',
    expectedRevenue: 35000,
    probability: 30,
    priority: 1,
    expectedCloseDate: '2025-03-20',
    salesTeam: 'Sales',
    products: [],
    tags: ['Information', 'Training'],
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-24T11:00:00Z',
  },
  {
    id: 'o5',
    name: 'Open Space Design',
    contactName: 'Robert Wilson',
    email: 'rwilson@deco.example.com',
    companyName: 'Deco Addict',
    pipelineId: 'default',
    stageId: 'proposition',
    stage: 'proposition',
    expectedRevenue: 11000,
    probability: 60,
    priority: 3,
    expectedCloseDate: '2025-02-20',
    assignedTo: 'Sales Manager',
    salesTeam: 'Pre-Sales',
    products: [],
    tags: ['Design'],
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-25T16:00:00Z',
  },
  {
    id: 'o6',
    name: 'Office Design and Architecture',
    contactName: 'James Anderson',
    email: 'janderson@bigcorp.example.com',
    companyName: 'Azure Interior',
    pipelineId: 'default',
    stageId: 'proposition',
    stage: 'proposition',
    expectedRevenue: 9000,
    probability: 60,
    priority: 2,
    expectedCloseDate: '2025-03-01',
    products: [],
    tags: ['Design', 'Consulting'],
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-01-26T09:00:00Z',
  },
  {
    id: 'o7',
    name: 'Need 20 Desks',
    contactName: 'Emily Davis',
    email: 'emily@newstartup.example.com',
    companyName: 'Ready Mat',
    pipelineId: 'default',
    stageId: 'qualified',
    stage: 'qualified',
    expectedRevenue: 60000,
    probability: 30,
    priority: 1,
    expectedCloseDate: '2025-04-15',
    products: [],
    tags: ['Product', 'Consulting'],
    createdAt: '2025-01-22T14:00:00Z',
    updatedAt: '2025-01-28T09:00:00Z',
  },
  {
    id: 'o8',
    name: 'Distributor Contract',
    contactName: 'Alex Thompson',
    email: 'alex@gemini.example.com',
    companyName: 'Gemini Furniture',
    pipelineId: 'default',
    stageId: 'won',
    stage: 'won',
    expectedRevenue: 19800,
    probability: 100,
    priority: 3,
    expectedCloseDate: '2025-01-20',
    wonAt: '2025-01-20T10:00:00Z',
    products: [],
    tags: ['Information', 'Other'],
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
];

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    type: 'call',
    subject: 'Initial discovery call',
    description: 'Discussed requirements for office furniture',
    relatedTo: 'lead',
    relatedId: 'l1',
    userId: '1',
    userName: 'Sales Manager',
    completed: true,
    completedAt: '2025-01-20T10:30:00Z',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:30:00Z',
  },
  {
    id: 'a2',
    type: 'email',
    subject: 'Sent proposal document',
    relatedTo: 'opportunity',
    relatedId: 'o1',
    userId: '1',
    userName: 'Sales Manager',
    completed: true,
    completedAt: '2025-01-22T14:00:00Z',
    createdAt: '2025-01-22T14:00:00Z',
    updatedAt: '2025-01-22T14:00:00Z',
  },
  {
    id: 'a3',
    type: 'meeting',
    subject: 'Product demo with stakeholders',
    description: 'Demo scheduled with procurement team',
    relatedTo: 'opportunity',
    relatedId: 'o3',
    userId: '1',
    userName: 'Sales Manager',
    dueDate: '2025-02-01T10:00:00Z',
    completed: false,
    priority: 'high',
    createdAt: '2025-01-25T09:00:00Z',
    updatedAt: '2025-01-25T09:00:00Z',
  },
  {
    id: 'a4',
    type: 'follow_up',
    subject: 'Follow up on proposal feedback',
    relatedTo: 'opportunity',
    relatedId: 'o1',
    userId: '1',
    userName: 'Sales Manager',
    dueDate: '2025-01-30T09:00:00Z',
    completed: false,
    priority: 'medium',
    createdAt: '2025-01-26T11:00:00Z',
    updatedAt: '2025-01-26T11:00:00Z',
  },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'n1',
    content: 'Customer expressed interest in bulk discount for orders over $50k. Follow up required.',
    relatedTo: 'opportunity',
    relatedId: 'o1',
    userId: '1',
    userName: 'Sales Manager',
    visibility: 'team',
    createdAt: '2025-01-22T15:00:00Z',
    updatedAt: '2025-01-22T15:00:00Z',
  },
  {
    id: 'n2',
    content: 'Budget approval pending from CFO. Expected decision by end of month.',
    relatedTo: 'opportunity',
    relatedId: 'o3',
    userId: '1',
    userName: 'Sales Manager',
    visibility: 'public',
    createdAt: '2025-01-25T16:00:00Z',
    updatedAt: '2025-01-25T16:00:00Z',
  },
];

const DEFAULT_TAGS: CRMTag[] = [
  { id: 't1', name: 'VIP', color: 'hsl(var(--chart-coral))' },
  { id: 't2', name: 'Enterprise', color: 'hsl(var(--chart-blue))' },
  { id: 't3', name: 'Priority', color: 'hsl(var(--warning))' },
  { id: 't4', name: 'Hot Lead', color: 'hsl(var(--destructive))' },
  { id: 't5', name: 'Startup', color: 'hsl(var(--success))' },
  { id: 't6', name: 'New Customer', color: 'hsl(var(--info))' },
];

// ================== CRUD Operations ==================

// Companies
export function getCompanies(): Company[] {
  ensureCRMVersion();
  return getItem<Company[]>('crm_companies', DEFAULT_COMPANIES);
}

export function getCompany(id: string): Company | undefined {
  return getCompanies().find(c => c.id === id);
}

export function saveCompany(company: Partial<Company> & { id?: string }): Company {
  const companies = getCompanies();
  const now = new Date().toISOString();
  
  if (company.id) {
    const index = companies.findIndex(c => c.id === company.id);
    if (index >= 0) {
      companies[index] = { ...companies[index], ...company, updatedAt: now };
      setItem('crm_companies', companies);
      return companies[index];
    }
  }
  
  const newCompany: Company = {
    id: crypto.randomUUID(),
    name: company.name || '',
    addresses: [],
    tags: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...company,
  };
  companies.push(newCompany);
  setItem('crm_companies', companies);
  return newCompany;
}

export function deleteCompany(id: string): void {
  const companies = getCompanies().filter(c => c.id !== id);
  setItem('crm_companies', companies);
}

// Contacts
export function getContacts(): Contact[] {
  ensureCRMVersion();
  return getItem<Contact[]>('crm_contacts', DEFAULT_CONTACTS);
}

export function getContact(id: string): Contact | undefined {
  return getContacts().find(c => c.id === id);
}

export function saveContact(contact: Partial<Contact> & { id?: string }): Contact {
  const contacts = getContacts();
  const now = new Date().toISOString();
  
  if (contact.id) {
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index >= 0) {
      contacts[index] = { ...contacts[index], ...contact, updatedAt: now };
      setItem('crm_contacts', contacts);
      return contacts[index];
    }
  }
  
  const newContact: Contact = {
    id: crypto.randomUUID(),
    type: 'individual',
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    email: contact.email || '',
    addresses: [],
    tags: [],
    status: 'active',
    score: 0,
    createdAt: now,
    updatedAt: now,
    ...contact,
  };
  contacts.push(newContact);
  setItem('crm_contacts', contacts);
  return newContact;
}

export function deleteContact(id: string): void {
  const contacts = getContacts().filter(c => c.id !== id);
  setItem('crm_contacts', contacts);
}

// Check for duplicate contacts
export function findDuplicateContacts(email: string, phone?: string): Contact[] {
  const contacts = getContacts();
  return contacts.filter(c => 
    c.email.toLowerCase() === email.toLowerCase() ||
    (phone && c.phone === phone)
  );
}

// Leads
export function getLeads(): Lead[] {
  return getItem<Lead[]>('crm_leads', DEFAULT_LEADS);
}

export function getLead(id: string): Lead | undefined {
  return getLeads().find(l => l.id === id);
}

export function saveLead(lead: Partial<Lead> & { id?: string }): Lead {
  const leads = getLeads();
  const now = new Date().toISOString();
  
  if (lead.id) {
    const index = leads.findIndex(l => l.id === lead.id);
    if (index >= 0) {
      leads[index] = { ...leads[index], ...lead, updatedAt: now };
      setItem('crm_leads', leads);
      return leads[index];
    }
  }
  
  const newLead: Lead = {
    id: crypto.randomUUID(),
    title: lead.title || '',
    contactName: lead.contactName || '',
    email: lead.email || '',
    source: 'manual',
    status: 'new',
    priority: 'medium',
    score: 0,
    expectedRevenue: 0,
    probability: 10,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...lead,
  };
  leads.push(newLead);
  setItem('crm_leads', leads);
  return newLead;
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead | undefined {
  const lead = getLead(id);
  if (lead) {
    return saveLead({ ...lead, status });
  }
  return undefined;
}

export function deleteLead(id: string): void {
  const leads = getLeads().filter(l => l.id !== id);
  setItem('crm_leads', leads);
}

// Convert lead to opportunity
export function convertLeadToOpportunity(leadId: string, opportunityData?: Partial<Opportunity>): Opportunity | undefined {
  const lead = getLead(leadId);
  if (!lead) return undefined;
  
  const opportunity = saveOpportunity({
    name: lead.title,
    contactName: lead.contactName,
    companyName: lead.companyName,
    expectedRevenue: lead.expectedRevenue,
    probability: lead.probability,
    tags: lead.tags,
    ...opportunityData,
  });
  
  saveLead({
    ...lead,
    status: 'converted',
    convertedAt: new Date().toISOString(),
    convertedToOpportunityId: opportunity.id,
  });
  
  return opportunity;
}

// Pipelines
export function getPipelines(): Pipeline[] {
  return getItem<Pipeline[]>('crm_pipelines', DEFAULT_PIPELINES);
}

export function getPipeline(id: string): Pipeline | undefined {
  return getPipelines().find(p => p.id === id);
}

export function getDefaultPipeline(): Pipeline {
  const pipelines = getPipelines();
  return pipelines.find(p => p.isDefault) || pipelines[0];
}

export function savePipeline(pipeline: Partial<Pipeline> & { id?: string }): Pipeline {
  const pipelines = getPipelines();
  const now = new Date().toISOString();
  
  if (pipeline.id) {
    const index = pipelines.findIndex(p => p.id === pipeline.id);
    if (index >= 0) {
      pipelines[index] = { ...pipelines[index], ...pipeline, updatedAt: now };
      setItem('crm_pipelines', pipelines);
      return pipelines[index];
    }
  }
  
  const newPipeline: Pipeline = {
    id: crypto.randomUUID(),
    name: pipeline.name || 'New Pipeline',
    isDefault: false,
    stages: [],
    createdAt: now,
    updatedAt: now,
    ...pipeline,
  };
  pipelines.push(newPipeline);
  setItem('crm_pipelines', pipelines);
  return newPipeline;
}

// Force reset CRM data to new Odoo-style pipeline on version change
const CRM_VERSION_KEY = 'crm_data_version';
const CRM_CURRENT_VERSION = 3;

function ensureCRMVersion() {
  const stored = getItem<number>(CRM_VERSION_KEY, 0);
  if (stored < CRM_CURRENT_VERSION) {
    // Clear old CRM data to use new defaults (restored from backup)
    setItem('crm_opportunities', DEFAULT_OPPORTUNITIES);
    setItem('crm_pipelines', DEFAULT_PIPELINES);
    setItem('crm_companies', DEFAULT_COMPANIES);
    setItem('crm_contacts', DEFAULT_CONTACTS);
    setItem(CRM_VERSION_KEY, CRM_CURRENT_VERSION);
  }
}

export function getOpportunities(): Opportunity[] {
  ensureCRMVersion();
  return getItem<Opportunity[]>('crm_opportunities', DEFAULT_OPPORTUNITIES);
}

export function getOpportunity(id: string): Opportunity | undefined {
  return getOpportunities().find(o => o.id === id);
}

export function saveOpportunity(opp: Partial<Opportunity> & { id?: string }): Opportunity {
  const opportunities = getOpportunities();
  const now = new Date().toISOString();
  const defaultPipeline = getDefaultPipeline();
  
  if (opp.id) {
    const index = opportunities.findIndex(o => o.id === opp.id);
    if (index >= 0) {
      opportunities[index] = { ...opportunities[index], ...opp, updatedAt: now };
      setItem('crm_opportunities', opportunities);
      return opportunities[index];
    }
  }
  
  const newOpp: Opportunity = {
    id: crypto.randomUUID(),
    name: opp.name || '',
    contactName: opp.contactName || '',
    pipelineId: defaultPipeline.id,
    stageId: defaultPipeline.stages[0]?.id || 'new',
    stage: 'new',
    expectedRevenue: 0,
    probability: 10,
    priority: 0,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    products: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...opp,
  };
  opportunities.push(newOpp);
  setItem('crm_opportunities', opportunities);
  return newOpp;
}

export function updateOpportunityStage(id: string, stageId: string, stage: OpportunityStage): Opportunity | undefined {
  const opp = getOpportunity(id);
  if (!opp) return undefined;
  
  const updates: Partial<Opportunity> = { stageId, stage };
  
  if (stage === 'won') {
    updates.wonAt = new Date().toISOString();
    updates.probability = 100;
  } else if (stage === 'lost') {
    updates.lostAt = new Date().toISOString();
    updates.probability = 0;
  }
  
  return saveOpportunity({ ...opp, ...updates });
}

export function deleteOpportunity(id: string): void {
  const opportunities = getOpportunities().filter(o => o.id !== id);
  setItem('crm_opportunities', opportunities);
}

// Activities
export function getActivities(relatedTo?: string, relatedId?: string): Activity[] {
  const activities = getItem<Activity[]>('crm_activities', DEFAULT_ACTIVITIES);
  if (relatedTo && relatedId) {
    return activities.filter(a => a.relatedTo === relatedTo && a.relatedId === relatedId);
  }
  return activities;
}

export function getActivity(id: string): Activity | undefined {
  return getActivities().find(a => a.id === id);
}

export function saveActivity(activity: Partial<Activity> & { id?: string }): Activity {
  const activities = getActivities();
  const now = new Date().toISOString();
  
  if (activity.id) {
    const index = activities.findIndex(a => a.id === activity.id);
    if (index >= 0) {
      activities[index] = { ...activities[index], ...activity, updatedAt: now };
      setItem('crm_activities', activities);
      return activities[index];
    }
  }
  
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    type: 'task',
    subject: activity.subject || '',
    relatedTo: activity.relatedTo || 'contact',
    relatedId: activity.relatedId || '',
    userId: activity.userId || '',
    userName: activity.userName || '',
    completed: false,
    createdAt: now,
    updatedAt: now,
    ...activity,
  };
  activities.push(newActivity);
  setItem('crm_activities', activities);
  return newActivity;
}

export function completeActivity(id: string): Activity | undefined {
  const activity = getActivity(id);
  if (activity) {
    return saveActivity({
      ...activity,
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }
  return undefined;
}

export function deleteActivity(id: string): void {
  const activities = getActivities().filter(a => a.id !== id);
  setItem('crm_activities', activities);
}

// Notes
export function getNotes(relatedTo?: string, relatedId?: string): Note[] {
  const notes = getItem<Note[]>('crm_notes', DEFAULT_NOTES);
  if (relatedTo && relatedId) {
    return notes.filter(n => n.relatedTo === relatedTo && n.relatedId === relatedId);
  }
  return notes;
}

export function saveNote(note: Partial<Note> & { id?: string }): Note {
  const notes = getNotes();
  const now = new Date().toISOString();
  
  if (note.id) {
    const index = notes.findIndex(n => n.id === note.id);
    if (index >= 0) {
      notes[index] = { ...notes[index], ...note, updatedAt: now };
      setItem('crm_notes', notes);
      return notes[index];
    }
  }
  
  const newNote: Note = {
    id: crypto.randomUUID(),
    content: note.content || '',
    relatedTo: note.relatedTo || 'contact',
    relatedId: note.relatedId || '',
    userId: note.userId || '',
    userName: note.userName || '',
    visibility: 'team',
    createdAt: now,
    updatedAt: now,
    ...note,
  };
  notes.push(newNote);
  setItem('crm_notes', notes);
  return newNote;
}

export function deleteNote(id: string): void {
  const notes = getNotes().filter(n => n.id !== id);
  setItem('crm_notes', notes);
}

// Tags
export function getTags(): CRMTag[] {
  return getItem<CRMTag[]>('crm_tags', DEFAULT_TAGS);
}

export function saveTag(tag: Partial<CRMTag>): CRMTag {
  const tags = getTags();
  
  if (tag.id) {
    const index = tags.findIndex(t => t.id === tag.id);
    if (index >= 0) {
      tags[index] = { ...tags[index], ...tag };
      setItem('crm_tags', tags);
      return tags[index];
    }
  }
  
  const newTag: CRMTag = {
    id: crypto.randomUUID(),
    name: tag.name || '',
    color: tag.color || 'hsl(var(--muted))',
    ...tag,
  };
  tags.push(newTag);
  setItem('crm_tags', tags);
  return newTag;
}

// ================== Analytics ==================

export interface CRMStats {
  totalContacts: number;
  totalCompanies: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  totalOpportunities: number;
  activeOpportunities: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  wonRevenue: number;
  lostRevenue: number;
  winRate: number;
  avgDealSize: number;
  activitiesCompleted: number;
  activitiesPending: number;
}

export function getCRMStats(): CRMStats {
  const contacts = getContacts();
  const companies = getCompanies();
  const leads = getLeads();
  const opportunities = getOpportunities();
  const activities = getActivities();
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const activeOpps = opportunities.filter(o => o.stage !== 'won' && o.stage !== 'lost');
  const wonOpps = opportunities.filter(o => o.stage === 'won');
  const lostOpps = opportunities.filter(o => o.stage === 'lost');
  const closedOpps = [...wonOpps, ...lostOpps];
  
  return {
    totalContacts: contacts.filter(c => c.status === 'active').length,
    totalCompanies: companies.filter(c => c.status === 'active').length,
    totalLeads: leads.length,
    newLeadsThisMonth: leads.filter(l => new Date(l.createdAt) >= monthStart).length,
    totalOpportunities: opportunities.length,
    activeOpportunities: activeOpps.length,
    pipelineValue: activeOpps.reduce((sum, o) => sum + o.expectedRevenue, 0),
    weightedPipelineValue: activeOpps.reduce((sum, o) => sum + (o.expectedRevenue * o.probability / 100), 0),
    wonRevenue: wonOpps.reduce((sum, o) => sum + o.expectedRevenue, 0),
    lostRevenue: lostOpps.reduce((sum, o) => sum + o.expectedRevenue, 0),
    winRate: closedOpps.length > 0 ? Math.round((wonOpps.length / closedOpps.length) * 100) : 0,
    avgDealSize: wonOpps.length > 0 ? Math.round(wonOpps.reduce((sum, o) => sum + o.expectedRevenue, 0) / wonOpps.length) : 0,
    activitiesCompleted: activities.filter(a => a.completed).length,
    activitiesPending: activities.filter(a => !a.completed).length,
  };
}

export interface LeadsBySource {
  source: string;
  count: number;
  value: number;
}

export function getLeadsBySource(): LeadsBySource[] {
  const leads = getLeads();
  const sourceMap = new Map<string, { count: number; value: number }>();
  
  leads.forEach(lead => {
    const existing = sourceMap.get(lead.source) || { count: 0, value: 0 };
    sourceMap.set(lead.source, {
      count: existing.count + 1,
      value: existing.value + lead.expectedRevenue,
    });
  });
  
  return Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    ...data,
  }));
}

export interface OpportunitiesByStage {
  stage: string;
  stageId: string;
  count: number;
  value: number;
}

export function getOpportunitiesByStage(): OpportunitiesByStage[] {
  const opportunities = getOpportunities();
  const pipeline = getDefaultPipeline();
  
  return pipeline.stages.map(stage => {
    const stageOpps = opportunities.filter(o => o.stageId === stage.id);
    return {
      stage: stage.name,
      stageId: stage.id,
      count: stageOpps.length,
      value: stageOpps.reduce((sum, o) => sum + o.expectedRevenue, 0),
    };
  });
}

// ================== Import/Export ==================

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export function importContacts(data: Partial<Contact>[]): ImportResult {
  const result: ImportResult = { success: 0, failed: 0, duplicates: 0, errors: [] };
  
  data.forEach((row, index) => {
    try {
      if (!row.email) {
        result.failed++;
        result.errors.push(`Row ${index + 1}: Email is required`);
        return;
      }
      
      const duplicates = findDuplicateContacts(row.email, row.phone);
      if (duplicates.length > 0) {
        result.duplicates++;
        return;
      }
      
      saveContact({
        ...row,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
      });
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push(`Row ${index + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  });
  
  return result;
}

export function importOpportunities(data: Partial<Opportunity>[]): ImportResult {
  const result: ImportResult = { success: 0, failed: 0, duplicates: 0, errors: [] };
  
  data.forEach((row, index) => {
    try {
      if (!row.name && !row.contactName) {
        result.failed++;
        result.errors.push(`Row ${index + 1}: Opportunity name or contact name is required`);
        return;
      }
      
      // Check for duplicate by name
      const existing = getOpportunities().find(o => 
        o.name === row.name && o.contactName === row.contactName
      );
      if (existing) {
        result.duplicates++;
        return;
      }
      
      // Map stage name to stage ID
      const pipeline = getDefaultPipeline();
      let stageId = pipeline.stages[0]?.id || 'new';
      let stage: OpportunityStage = 'new';
      
      if (row.stageId) {
        const matchedStage = pipeline.stages.find(s => 
          s.name.toLowerCase() === row.stageId?.toLowerCase() ||
          s.id === row.stageId
        );
        if (matchedStage) {
          stageId = matchedStage.id;
          stage = matchedStage.id as OpportunityStage;
        }
      }
      
      saveOpportunity({
        ...row,
        name: row.name || `${row.contactName}'s opportunity`,
        stageId,
        stage,
      });
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push(`Row ${index + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  });
  
  return result;
}

export function importLeads(data: Partial<Lead>[]): ImportResult {
  const result: ImportResult = { success: 0, failed: 0, duplicates: 0, errors: [] };
  
  data.forEach((row, index) => {
    try {
      if (!row.title && !row.contactName) {
        result.failed++;
        result.errors.push(`Row ${index + 1}: Lead title or contact name is required`);
        return;
      }
      
      saveLead({
        ...row,
        title: row.title || `${row.contactName}'s lead`,
        contactName: row.contactName || '',
        email: row.email || '',
      });
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push(`Row ${index + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  });
  
  return result;
}

export function exportContacts(): Contact[] {
  return getContacts();
}

export function exportLeads(): Lead[] {
  return getLeads();
}

export function exportOpportunities(): Opportunity[] {
  return getOpportunities();
}
