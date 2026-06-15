// CRM domain types — single source of truth.
// Pure type definitions only. No runtime, no localStorage, no IO.
// Data access lives in @/lib/data/crm-supabase and is wrapped by
// the React Query hooks in @/hooks/crm/useCRMQueries.

export type ContactType = 'individual' | 'company';
export type ContactStatus = 'active' | 'archived';
export type OpportunityStage = 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
export type ActivityType = 'call' | 'meeting' | 'task' | 'note' | 'follow_up';
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
  // Loyalty (B2C). Optional for back-compat with existing records.
  loyaltyTier?: 'bronze' | 'silver' | 'gold';
  loyaltyPoints?: number;
  totalLifetimeSpend?: number;
  loyaltyTierUpdatedAt?: string;
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
  priority: 0 | 1 | 2 | 3;
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
  stageHistory?: { stageId: string; enteredAt: string }[];
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

export interface OpportunitiesByStage {
  stage: string;
  stageId: string;
  count: number;
  value: number;
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}