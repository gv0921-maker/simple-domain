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
    name: 'Goodlife Kurlon-Home',
    website: undefined,
    industry: 'Wholesale/Retail',
    employeeCount: '10-50',
    annualRevenue: 5000000,
    phone: '+91 8296830111',
    email: 'sales@goodlifefurnitures.in',
    addresses: [{ street: 'Ground floor, Mayur Park', city: 'Mangalore', state: 'Karnataka', postalCode: '575001', country: 'India', type: 'both' }],
    tags: ['Franchise', 'Mattress'],
    status: 'active',
    createdAt: '2025-02-24T07:53:00Z',
    updatedAt: '2025-03-10T13:42:00Z',
  },
  {
    id: 'c2',
    name: 'Prestige Builders',
    industry: 'Construction',
    employeeCount: '50-100',
    annualRevenue: 25000000,
    phone: '+91 98450 12345',
    email: 'procurement@prestigebuilders.in',
    addresses: [{ street: 'KS Rao Road', city: 'Mangalore', state: 'Karnataka', postalCode: '575001', country: 'India', type: 'billing' }],
    tags: ['Enterprise', 'Bulk Orders'],
    status: 'active',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-03-01T11:00:00Z',
  },
  {
    id: 'c3',
    name: 'Manipal Hotels Group',
    industry: 'Food/Hospitality',
    employeeCount: '100-500',
    annualRevenue: 50000000,
    phone: '+91 82006 78900',
    email: 'purchase@manipalhotels.in',
    addresses: [{ street: 'Tiger Circle', city: 'Manipal', state: 'Karnataka', postalCode: '576104', country: 'India', type: 'billing' }],
    tags: ['Enterprise', 'VIP'],
    status: 'active',
    createdAt: '2025-01-02T08:00:00Z',
    updatedAt: '2025-02-25T16:00:00Z',
  },
  {
    id: 'c4',
    name: 'Infosys Mangalore',
    industry: 'IT/Communication',
    employeeCount: '500+',
    annualRevenue: 100000000,
    phone: '+91 824 2274000',
    email: 'facilities@infosys.com',
    addresses: [{ street: 'Kottara', city: 'Mangalore', state: 'Karnataka', postalCode: '575006', country: 'India', type: 'both' }],
    tags: ['Corporate', 'IT'],
    status: 'active',
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-03-05T14:00:00Z',
  },
  {
    id: 'c5',
    name: 'Nitte Education Trust',
    industry: 'Education',
    employeeCount: '100-500',
    annualRevenue: 30000000,
    phone: '+91 824 2204161',
    email: 'admin@nitte.edu.in',
    addresses: [{ street: 'University Enclave, Deralakatte', city: 'Mangalore', state: 'Karnataka', postalCode: '575018', country: 'India', type: 'both' }],
    tags: ['Education', 'Bulk Orders'],
    status: 'active',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-02-20T12:00:00Z',
  },
];

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: '1',
    type: 'individual',
    firstName: 'Rajesh',
    lastName: 'Shetty',
    email: 'rajesh.shetty@prestigebuilders.in',
    phone: '+91 98450 12345',
    companyId: 'c2',
    companyName: 'Prestige Builders',
    jobTitle: 'Procurement Manager',
    department: 'Operations',
    addresses: [],
    tags: ['VIP', 'Bulk Buyer'],
    status: 'active',
    score: 85,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-03-01T14:00:00Z',
  },
  {
    id: '2',
    type: 'individual',
    firstName: 'Priya',
    lastName: 'Nayak',
    email: 'priya.nayak@manipalhotels.in',
    phone: '+91 82006 78901',
    companyId: 'c3',
    companyName: 'Manipal Hotels Group',
    jobTitle: 'Interior Design Head',
    department: 'Design',
    addresses: [],
    tags: ['Enterprise', 'Priority'],
    status: 'active',
    score: 95,
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-02-25T16:00:00Z',
  },
  {
    id: '3',
    type: 'individual',
    firstName: 'Suresh',
    lastName: 'Pai',
    email: 'suresh.pai@infosys.com',
    phone: '+91 98861 45678',
    companyId: 'c4',
    companyName: 'Infosys Mangalore',
    jobTitle: 'Facilities Manager',
    department: 'Admin',
    addresses: [],
    tags: ['Corporate', 'IT'],
    status: 'active',
    score: 90,
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-03-05T14:00:00Z',
  },
  {
    id: '4',
    type: 'individual',
    firstName: 'Anitha',
    lastName: 'Rao',
    email: 'anitha.rao@nitte.edu.in',
    phone: '+91 99005 67890',
    companyId: 'c5',
    companyName: 'Nitte Education Trust',
    jobTitle: 'Administrative Officer',
    addresses: [],
    tags: ['Education'],
    status: 'active',
    score: 70,
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-02-20T12:00:00Z',
  },
  {
    id: '5',
    type: 'individual',
    firstName: 'Deepak',
    lastName: 'Hegde',
    email: 'deepak.hegde@gmail.com',
    phone: '+91 94490 11234',
    companyName: 'Hegde Interiors',
    jobTitle: 'Owner',
    addresses: [],
    tags: ['Interior Designer', 'Referral Partner'],
    status: 'active',
    score: 75,
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2025-03-12T11:00:00Z',
  },
  {
    id: '6',
    type: 'individual',
    firstName: 'Kavitha',
    lastName: 'Shenoy',
    email: 'kavitha.shenoy@yahoo.com',
    phone: '+91 87620 55678',
    jobTitle: 'Homeowner',
    addresses: [],
    tags: ['Walk-in', 'Residential'],
    status: 'active',
    score: 50,
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-15T14:00:00Z',
  },
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'l1',
    title: 'Hotel Room Furniture Package',
    contactId: '2',
    contactName: 'Priya Nayak',
    email: 'priya.nayak@manipalhotels.in',
    phone: '+91 82006 78901',
    companyId: 'c3',
    companyName: 'Manipal Hotels Group',
    source: 'referral',
    status: 'qualified',
    priority: 'high',
    score: 90,
    expectedRevenue: 850000,
    probability: 70,
    assignedTo: 'Vikesh',
    tags: ['Hospitality', 'Bulk'],
    createdBy: 'Mohan Raj',
    createdAt: '2025-03-10T10:00:00Z',
    updatedAt: '2025-03-18T14:00:00Z',
  },
  {
    id: 'l2',
    title: 'Office Workstation Setup - 50 Units',
    contactId: '3',
    contactName: 'Suresh Pai',
    email: 'suresh.pai@infosys.com',
    phone: '+91 98861 45678',
    companyId: 'c4',
    companyName: 'Infosys Mangalore',
    source: 'cold_call',
    status: 'contacted',
    priority: 'high',
    score: 80,
    expectedRevenue: 1200000,
    probability: 50,
    assignedTo: 'Vikesh',
    tags: ['Corporate', 'Office'],
    createdBy: 'Management',
    createdAt: '2025-03-05T09:00:00Z',
    updatedAt: '2025-03-17T11:00:00Z',
  },
  {
    id: 'l3',
    title: 'Hostel Furniture for New Block',
    contactId: '4',
    contactName: 'Anitha Rao',
    email: 'anitha.rao@nitte.edu.in',
    phone: '+91 99005 67890',
    companyId: 'c5',
    companyName: 'Nitte Education Trust',
    source: 'referral',
    status: 'new',
    priority: 'medium',
    score: 65,
    expectedRevenue: 600000,
    probability: 40,
    tags: ['Education', 'Hostel'],
    createdBy: 'Mohan Raj',
    createdAt: '2025-03-15T14:00:00Z',
    updatedAt: '2025-03-15T14:00:00Z',
  },
  {
    id: 'l4',
    title: 'Villa Interior - Complete Furnishing',
    contactName: 'Deepak Hegde',
    contactId: '5',
    email: 'deepak.hegde@gmail.com',
    phone: '+91 94490 11234',
    companyName: 'Hegde Interiors',
    source: 'website',
    status: 'qualified',
    priority: 'medium',
    score: 70,
    expectedRevenue: 350000,
    probability: 55,
    assignedTo: 'Vikesh',
    tags: ['Residential', 'Interior Designer'],
    createdBy: 'Vikesh',
    createdAt: '2025-03-12T11:00:00Z',
    updatedAt: '2025-03-18T09:00:00Z',
  },
  {
    id: 'l5',
    title: 'Living Room Sofa Set Enquiry',
    contactName: 'Kavitha Shenoy',
    contactId: '6',
    email: 'kavitha.shenoy@yahoo.com',
    phone: '+91 87620 55678',
    source: 'website',
    status: 'new',
    priority: 'low',
    score: 35,
    expectedRevenue: 75000,
    probability: 30,
    tags: ['Walk-in', 'Sofa'],
    createdBy: 'Vikesh',
    createdAt: '2025-03-18T10:00:00Z',
    updatedAt: '2025-03-18T10:00:00Z',
  },
  {
    id: 'l6',
    title: 'Apartment Flat Furnishing - 25 Units',
    contactId: '1',
    contactName: 'Rajesh Shetty',
    email: 'rajesh.shetty@prestigebuilders.in',
    phone: '+91 98450 12345',
    companyId: 'c2',
    companyName: 'Prestige Builders',
    source: 'trade_show',
    status: 'contacted',
    priority: 'urgent',
    score: 85,
    expectedRevenue: 2500000,
    probability: 60,
    assignedTo: 'Mohan Raj',
    tags: ['Builder', 'Bulk'],
    createdBy: 'Management',
    createdAt: '2025-03-08T11:00:00Z',
    updatedAt: '2025-03-19T09:00:00Z',
  },
  {
    id: 'l7',
    title: 'Kurlon Mattress Bulk Order',
    contactName: 'Ramesh Kumar',
    email: 'ramesh.kumar@sleepwell.in',
    phone: '+91 97310 22345',
    companyName: 'SleepWell Distributors',
    source: 'cold_call',
    status: 'new',
    priority: 'medium',
    score: 55,
    expectedRevenue: 180000,
    probability: 35,
    tags: ['Mattress', 'Distributor'],
    createdBy: 'Mohan Raj',
    createdAt: '2025-03-19T08:00:00Z',
    updatedAt: '2025-03-19T08:00:00Z',
  },
];

const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'o1',
    name: 'Prestige Towers - Model Flat Furnishing',
    contactId: '1',
    contactName: 'Rajesh Shetty',
    email: 'rajesh.shetty@prestigebuilders.in',
    phone: '+91 98450 12345',
    companyId: 'c2',
    companyName: 'Prestige Builders',
    pipelineId: 'default',
    stageId: 'new',
    stage: 'new',
    expectedRevenue: 450000,
    probability: 10,
    priority: 2,
    expectedCloseDate: '2025-04-15',
    assignedTo: 'Vikesh',
    salesTeam: 'Sales Department',
    products: [],
    tags: ['Builder', 'Model Flat'],
    createdAt: '2025-02-20T10:00:00Z',
    updatedAt: '2025-03-18T14:00:00Z',
  },
  {
    id: 'o2',
    name: 'Hotel Lobby & Restaurant Furniture',
    contactId: '2',
    contactName: 'Priya Nayak',
    email: 'priya.nayak@manipalhotels.in',
    companyId: 'c3',
    companyName: 'Manipal Hotels Group',
    pipelineId: 'default',
    stageId: 'qualified',
    stage: 'qualified',
    expectedRevenue: 1200000,
    probability: 30,
    priority: 3,
    expectedCloseDate: '2025-04-30',
    assignedTo: 'Mohan Raj',
    salesTeam: 'Sales Department',
    products: [],
    tags: ['Hospitality', 'Premium'],
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2025-03-15T11:00:00Z',
  },
  {
    id: 'o3',
    name: 'Infosys Cafeteria Seating',
    contactId: '3',
    contactName: 'Suresh Pai',
    email: 'suresh.pai@infosys.com',
    phone: '+91 98861 45678',
    companyId: 'c4',
    companyName: 'Infosys Mangalore',
    pipelineId: 'default',
    stageId: 'proposition',
    stage: 'proposition',
    expectedRevenue: 680000,
    probability: 60,
    priority: 2,
    expectedCloseDate: '2025-03-30',
    assignedTo: 'Vikesh',
    salesTeam: 'Sales Department',
    products: [],
    tags: ['Corporate', 'Seating'],
    createdAt: '2025-01-25T08:00:00Z',
    updatedAt: '2025-03-12T10:00:00Z',
  },
  {
    id: 'o4',
    name: 'Nitte Hostel Bunk Beds - 100 Units',
    contactId: '4',
    contactName: 'Anitha Rao',
    email: 'anitha.rao@nitte.edu.in',
    companyId: 'c5',
    companyName: 'Nitte Education Trust',
    pipelineId: 'default',
    stageId: 'qualified',
    stage: 'qualified',
    expectedRevenue: 500000,
    probability: 30,
    priority: 1,
    expectedCloseDate: '2025-05-15',
    salesTeam: 'Sales Department',
    products: [],
    tags: ['Education', 'Bulk'],
    createdAt: '2025-02-05T09:00:00Z',
    updatedAt: '2025-03-10T11:00:00Z',
  },
  {
    id: 'o5',
    name: 'Premium Sofa Collection - Showroom',
    contactName: 'Deepak Hegde',
    contactId: '5',
    email: 'deepak.hegde@gmail.com',
    companyName: 'Hegde Interiors',
    pipelineId: 'default',
    stageId: 'proposition',
    stage: 'proposition',
    expectedRevenue: 280000,
    probability: 60,
    priority: 2,
    expectedCloseDate: '2025-04-10',
    assignedTo: 'Vikesh',
    salesTeam: 'Sales Department',
    products: [],
    tags: ['Interior Designer', 'Premium'],
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-03-14T16:00:00Z',
  },
  {
    id: 'o6',
    name: 'Kurlon Mattress Display Setup',
    contactName: 'Arun Kamath',
    email: 'arun@kurlondealer.in',
    companyName: 'Kurlon Dealers Network',
    pipelineId: 'default',
    stageId: 'new',
    stage: 'new',
    expectedRevenue: 150000,
    probability: 10,
    priority: 1,
    expectedCloseDate: '2025-04-20',
    products: [],
    tags: ['Mattress', 'Display'],
    createdAt: '2025-03-01T11:00:00Z',
    updatedAt: '2025-03-16T09:00:00Z',
  },
  {
    id: 'o7',
    name: 'Complete Office Furnishing - Startup',
    contactName: 'Nikhil Prabhu',
    email: 'nikhil@techstartmangalore.in',
    companyName: 'TechStart Mangalore',
    pipelineId: 'default',
    stageId: 'qualified',
    stage: 'qualified',
    expectedRevenue: 320000,
    probability: 30,
    priority: 1,
    expectedCloseDate: '2025-05-01',
    products: [],
    tags: ['Startup', 'Office'],
    createdAt: '2025-02-28T14:00:00Z',
    updatedAt: '2025-03-17T09:00:00Z',
  },
  {
    id: 'o8',
    name: 'Residential Apartment Furnishing',
    contactName: 'Vinod Shetty',
    email: 'vinod.shetty@gmail.com',
    companyName: 'Personal',
    pipelineId: 'default',
    stageId: 'won',
    stage: 'won',
    expectedRevenue: 225000,
    probability: 100,
    priority: 2,
    expectedCloseDate: '2025-03-10',
    wonAt: '2025-03-10T10:00:00Z',
    products: [],
    tags: ['Residential', 'Repeat Customer'],
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-03-10T10:00:00Z',
  },
];

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    type: 'call',
    subject: 'Initial requirement discussion',
    description: 'Discussed furniture requirements for new hotel wing - 30 rooms',
    relatedTo: 'lead',
    relatedId: 'l1',
    userId: '3',
    userName: 'Vikesh',
    completed: true,
    completedAt: '2025-03-12T10:30:00Z',
    createdAt: '2025-03-12T10:00:00Z',
    updatedAt: '2025-03-12T10:30:00Z',
  },
  {
    id: 'a2',
    type: 'email',
    subject: 'Sent quotation for cafeteria seating',
    relatedTo: 'opportunity',
    relatedId: 'o3',
    userId: '3',
    userName: 'Vikesh',
    completed: true,
    completedAt: '2025-03-14T14:00:00Z',
    createdAt: '2025-03-14T14:00:00Z',
    updatedAt: '2025-03-14T14:00:00Z',
  },
  {
    id: 'a3',
    type: 'meeting',
    subject: 'Site visit - Manipal Hotels new wing',
    description: 'Measure rooms and finalize furniture layout',
    relatedTo: 'opportunity',
    relatedId: 'o2',
    userId: '2',
    userName: 'Mohan Raj',
    dueDate: '2025-03-22T10:00:00Z',
    completed: false,
    priority: 'high',
    createdAt: '2025-03-15T09:00:00Z',
    updatedAt: '2025-03-15T09:00:00Z',
  },
  {
    id: 'a4',
    type: 'follow_up',
    subject: 'Follow up on Prestige model flat proposal',
    relatedTo: 'opportunity',
    relatedId: 'o1',
    userId: '3',
    userName: 'Vikesh',
    dueDate: '2025-03-21T09:00:00Z',
    completed: false,
    priority: 'medium',
    createdAt: '2025-03-18T11:00:00Z',
    updatedAt: '2025-03-18T11:00:00Z',
  },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'n1',
    content: 'Customer interested in bulk discount for 25+ flat furnishing packages. Need to discuss with Management for pricing approval.',
    relatedTo: 'opportunity',
    relatedId: 'o1',
    userId: '3',
    userName: 'Vikesh',
    visibility: 'team',
    createdAt: '2025-03-18T15:00:00Z',
    updatedAt: '2025-03-18T15:00:00Z',
  },
  {
    id: 'n2',
    content: 'Hotel management wants premium teak wood furniture for lobby. Budget approval pending from CFO. Expected decision by month end.',
    relatedTo: 'opportunity',
    relatedId: 'o2',
    userId: '2',
    userName: 'Mohan Raj',
    visibility: 'public',
    createdAt: '2025-03-15T16:00:00Z',
    updatedAt: '2025-03-15T16:00:00Z',
  },
];

const DEFAULT_TAGS: CRMTag[] = [
  { id: 't1', name: 'VIP', color: 'hsl(var(--chart-coral))' },
  { id: 't2', name: 'Enterprise', color: 'hsl(var(--chart-blue))' },
  { id: 't3', name: 'Priority', color: 'hsl(var(--warning))' },
  { id: 't4', name: 'Bulk Orders', color: 'hsl(var(--destructive))' },
  { id: 't5', name: 'Residential', color: 'hsl(var(--success))' },
  { id: 't6', name: 'Corporate', color: 'hsl(var(--info))' },
  { id: 't7', name: 'Hospitality', color: 'hsl(var(--chart-coral))' },
  { id: 't8', name: 'Interior Designer', color: 'hsl(var(--chart-blue))' },
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
    // Clear all CRM data to use new backup-based defaults
    setItem('crm_opportunities', DEFAULT_OPPORTUNITIES);
    setItem('crm_pipelines', DEFAULT_PIPELINES);
    setItem('crm_companies', DEFAULT_COMPANIES);
    setItem('crm_contacts', DEFAULT_CONTACTS);
    setItem('crm_leads', DEFAULT_LEADS);
    setItem('crm_activities', DEFAULT_ACTIVITIES);
    setItem('crm_notes', DEFAULT_NOTES);
    setItem('crm_tags', DEFAULT_TAGS);
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
