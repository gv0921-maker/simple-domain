// TODO: Replace localStorage with Supabase queries
// CRM Data Management - Contacts, Companies, Leads, Opportunities, Activities, Pipelines

import { getItem, setItem } from '../storage';
import { logCRM } from '@/lib/crm/audit';

// ================== Types ==================

export type ContactType = 'individual' | 'company';
export type ContactStatus = 'active' | 'archived';
export type OpportunityStage = 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'follow_up';
export type NoteVisibility = 'private' | 'team' | 'public';

export interface Address {
  street?: string;
  street2?: string;
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

export interface CustomField {
  key: string;
  label: string;
  value: string;
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
  website?: string;
  gstin?: string;
  addresses: Address[];
  tags: string[];
  notes?: string;
  assignedTo?: string;
  status: ContactStatus;
  score: number;
  parentContactId?: string;
  customFields?: CustomField[];
  salesperson?: string;
  salesTeam?: string;
  paymentTerms?: string;
  priceList?: string;
  purchasePaymentTerms?: string;
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

export interface RichAttachment {
  name: string;
  type: string;
  size?: number;
  dataUrl?: string;
  url?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  relatedTo: 'contact' | 'company' | 'opportunity';
  relatedId: string;
  userId: string;
  userName: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  mentions?: string[];
  attachments?: RichAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  relatedTo: 'contact' | 'company' | 'opportunity';
  relatedId: string;
  userId: string;
  userName: string;
  visibility: NoteVisibility;
  mentions?: string[];
  attachments?: RichAttachment[];
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

const DEFAULT_COMPANIES: Company[] = [];

const DEFAULT_CONTACTS: Contact[] = [];

const DEFAULT_OPPORTUNITIES: Opportunity[] = [];

const DEFAULT_ACTIVITIES: Activity[] = [];

const DEFAULT_NOTES: Note[] = [];

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
      logCRM('update', 'company', company.id, `Updated company "${companies[index].name}"`);
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
  const target = getCompany(id);
  const companies = getCompanies().filter(c => c.id !== id);
  setItem('crm_companies', companies);
  if (target) logCRM('delete', 'company', id, `Deleted company "${target.name}"`);
}

// Contacts
export function getContacts(): Contact[] {
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
      logCRM('update', 'contact', contact.id!, `Updated contact "${contacts[index].firstName} ${contacts[index].lastName}"`);
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
  const target = getContact(id);
  const contacts = getContacts().filter(c => c.id !== id);
  setItem('crm_contacts', contacts);
  if (target) logCRM('delete', 'contact', id, `Deleted contact "${target.firstName} ${target.lastName}"`);
}

// Check for duplicate contacts (matches on email OR any phone — primary or secondary)
export function findDuplicateContacts(email: string, phone?: string, excludeId?: string): Contact[] {
  const contacts = getContacts();
  const normalizePhone = (p?: string) => (p || '').replace(/[^\d+]/g, '');
  const targetPhone = normalizePhone(phone);
  const targetEmail = (email || '').toLowerCase().trim();
  return contacts.filter(c => {
    if (excludeId && c.id === excludeId) return false;
    // Email match (primary or any secondary)
    if (targetEmail) {
      if (c.email?.toLowerCase() === targetEmail) return true;
      if (c.emails?.some(e => e.email.toLowerCase() === targetEmail)) return true;
    }
    // Phone match (primary or any secondary, normalized)
    if (targetPhone) {
      if (normalizePhone(c.phone) === targetPhone) return true;
      if (c.phones?.some(p => normalizePhone(p.phone) === targetPhone)) return true;
    }
    return false;
  });
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
      logCRM('update', 'pipeline', pipeline.id, `Updated pipeline "${pipelines[index].name}"`);
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
    // Clear all CRM data to use new empty defaults
    setItem('crm_opportunities', DEFAULT_OPPORTUNITIES);
    setItem('crm_pipelines', DEFAULT_PIPELINES);
    setItem('crm_contacts', DEFAULT_CONTACTS);
    setItem('crm_companies', DEFAULT_COMPANIES);
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
      logCRM('update', 'opportunity', opp.id, `Updated opportunity "${opportunities[index].name}"`);
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
  const target = getOpportunity(id);
  const opportunities = getOpportunities().filter(o => o.id !== id);
  setItem('crm_opportunities', opportunities);
  if (target) logCRM('delete', 'opportunity', id, `Deleted opportunity "${target.name}"`);
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
      logCRM('update', 'activity', activity.id!, `Updated activity "${activities[index].subject}"`);
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
  const target = getActivity(id);
  const activities = getActivities().filter(a => a.id !== id);
  setItem('crm_activities', activities);
  if (target) logCRM('delete', 'activity', id, `Deleted activity "${target.subject}"`);
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
      logCRM('update', 'note', note.id!, 'Updated note');
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
  logCRM('delete', 'note', id, 'Deleted note');
}

// New: pipeline & stage delete with audit logging
export function deletePipeline(id: string): { success: boolean; reason?: string } {
  const pipelines = getPipelines();
  const target = pipelines.find(p => p.id === id);
  if (!target) return { success: false, reason: 'Pipeline not found' };
  if (target.isDefault) return { success: false, reason: 'Cannot delete the default pipeline' };
  const opps = getOpportunities().filter(o => o.pipelineId === id);
  if (opps.length > 0) return { success: false, reason: `${opps.length} opportunity(ies) still use this pipeline` };
  setItem('crm_pipelines', pipelines.filter(p => p.id !== id));
  logCRM('delete', 'pipeline', id, `Deleted pipeline "${target.name}"`);
  return { success: true };
}

export function setDefaultPipeline(id: string): void {
  const pipelines = getPipelines().map(p => ({ ...p, isDefault: p.id === id }));
  setItem('crm_pipelines', pipelines);
  logCRM('update', 'pipeline', id, 'Set as default pipeline');
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

  let contacts = getContacts();

  // Build lookup indexes for O(1) matching instead of O(n) per row
  const normalizePhone = (p?: string) => (p || '').replace(/[^\d+]/g, '');
  const idIndex = new Map<string, number>();
  const emailIndex = new Map<string, number>();
  const phoneIndex = new Map<string, number>();
  const nameIndex = new Map<string, number>();
  contacts.forEach((c, i) => {
    if (c.id) idIndex.set(c.id, i);
    if (c.email) emailIndex.set(c.email.toLowerCase(), i);
    const np = normalizePhone(c.phone);
    if (np) phoneIndex.set(np, i);
    c.phones?.forEach(p => {
      const k = normalizePhone(p.phone);
      if (k) phoneIndex.set(k, i);
    });
    const nameKey = `${c.firstName.toLowerCase()}|${c.lastName.toLowerCase()}`;
    if (c.firstName) nameIndex.set(nameKey, i);
  });

  data.forEach((row, index) => {
    try {
      const rowId = typeof row.id === 'string' ? row.id.trim() : '';
      const firstName = String(row.firstName || '').trim();
      const lastName = String(row.lastName || '').trim();
      const email = String(row.email || '').trim();
      const phone = String(row.phone || '').trim();

      const hasAnyValue = Object.values(row).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== '';
      });

      if (!hasAnyValue) {
        return;
      }

      const rowType = String((row as any).type || '').toLowerCase().trim();
      const rowStatus = String((row as any).status || '').toLowerCase().trim();
      const rowTags = Array.isArray((row as any).tags)
        ? (row as any).tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : typeof (row as any).tags === 'string'
          ? String((row as any).tags).split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

      const address: Address | undefined = (row as any).street || (row as any).street2 || (row as any).city || (row as any).state || (row as any).postalCode || (row as any).country
        ? {
            street: (row as any).street,
            street2: (row as any).street2,
            city: (row as any).city,
            state: (row as any).state,
            postalCode: (row as any).postalCode,
            country: (row as any).country,
            type: 'both',
          }
        : undefined;

      const contactData: Partial<Contact> = {
        ...row,
        ...(rowId ? { id: rowId } : {}),
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...((row as any).website ? { website: String((row as any).website).trim() } : {}),
        ...((row as any).gstin ? { gstin: String((row as any).gstin).trim() } : {}),
        ...(rowType === 'company' || rowType === 'individual' ? { type: rowType as ContactType } : {}),
        ...(address ? { addresses: [address] } : Array.isArray(row.addresses) && row.addresses.length > 0 ? { addresses: row.addresses } : {}),
        ...(rowTags.length > 0 ? { tags: rowTags } : {}),
        ...(row.score !== undefined && row.score !== null
          ? { score: Number(row.score) || 0 }
          : {}),
        ...((row as any).assignedTo ? { assignedTo: String((row as any).assignedTo).trim() } : {}),
        ...(rowStatus === 'active' || rowStatus === 'archived' ? { status: rowStatus as ContactStatus } : {}),
      };

      // Use indexed lookups for O(1) matching
      let existingIdx: number | undefined;
      if (rowId) existingIdx = idIndex.get(rowId);
      if (existingIdx === undefined && email) existingIdx = emailIndex.get(email.toLowerCase());
      if (existingIdx === undefined && phone) {
        const np = normalizePhone(phone);
        if (np) existingIdx = phoneIndex.get(np);
      }
      if (existingIdx === undefined && firstName) {
        existingIdx = nameIndex.get(`${firstName.toLowerCase()}|${lastName.toLowerCase()}`);
      }

      const existingContact = existingIdx !== undefined ? contacts[existingIdx] : undefined;

      if (existingContact) {
        const merged: Partial<Contact> = { id: existingContact.id };

        for (const [key, value] of Object.entries(contactData)) {
          if (key === 'id') continue;
          if (value !== undefined && value !== null && value !== '') {
            (merged as any)[key] = value;
          }
        }

        if (Array.isArray(contactData.tags) && contactData.tags.length > 0) {
          merged.tags = [...new Set([...(existingContact.tags || []), ...contactData.tags])];
        }

        if (address) {
          const existingAddresses = existingContact.addresses || [];
          const alreadyExists = existingAddresses.some(
            (a) =>
              (a.street || '') === (address.street || '') &&
              (a.street2 || '') === (address.street2 || '') &&
              (a.city || '') === (address.city || '') &&
              (a.state || '') === (address.state || '') &&
              (a.postalCode || '') === (address.postalCode || '') &&
              (a.country || '') === (address.country || '')
          );
          merged.addresses = alreadyExists ? existingAddresses : [...existingAddresses, address];
        }

        const updated = saveContact(merged);
        contacts[existingIdx!] = updated;
        // Update indexes with new data
        if (updated.email) emailIndex.set(updated.email.toLowerCase(), existingIdx!);
        if (updated.firstName) nameIndex.set(`${updated.firstName.toLowerCase()}|${updated.lastName.toLowerCase()}`, existingIdx!);
        result.duplicates++;
        result.success++;
        return;
      }

      const hasIdentity = Boolean(
        rowId || firstName || lastName || email || phone || String((row as any).companyName || '').trim()
      );

      if (!hasIdentity) {
        return;
      }

      const saved = saveContact(contactData);
      const newIdx = contacts.length;
      contacts.push(saved);
      // Update indexes for new contact
      if (saved.id) idIndex.set(saved.id, newIdx);
      if (saved.email) emailIndex.set(saved.email.toLowerCase(), newIdx);
      if (saved.firstName) nameIndex.set(`${saved.firstName.toLowerCase()}|${saved.lastName.toLowerCase()}`, newIdx);
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push(`Row ${index + 2}: ${e instanceof Error ? e.message : 'Unknown error'}`);
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

export function exportContacts(): Contact[] {
  return getContacts();
}

export function exportOpportunities(): Opportunity[] {
  return getOpportunities();
}
