// Supabase-backed CRM data layer
// Mirrors the API surface of src/lib/data/crm.ts but is fully async.
// Components should normally consume these via the hooks in
// src/hooks/crm/useCRMQueries.ts so React Query handles caching.

import { supabase } from '@/integrations/supabase/client';
import type {
  Activity,
  Address,
  CRMStats,
  CRMTag,
  Company,
  Contact,
  Note,
  Opportunity,
  OpportunitiesByStage,
  OpportunityStage,
  Pipeline,
  PipelineStage,
} from './crm';

// ---------- helpers ----------

function nowIso() {
  return new Date().toISOString();
}

function isUuid(v?: string): boolean {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function newId(): string {
  return crypto.randomUUID();
}

function logErr(scope: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[crm-supabase:${scope}]`, err);
}

// ---------- mappers: Contact ----------

type ContactRow = Record<string, unknown>;

function mapContact(row: ContactRow): Contact {
  return {
    id: String(row.id),
    type: (row.type as Contact['type']) || 'individual',
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    email: String(row.email ?? ''),
    emails: (row.emails as Contact['emails']) ?? [],
    phone: row.phone as string | undefined,
    phones: (row.phones as Contact['phones']) ?? [],
    companyId: row.company_id as string | undefined,
    companyName: row.company_name as string | undefined,
    jobTitle: row.job_title as string | undefined,
    department: row.department as string | undefined,
    website: row.website as string | undefined,
    gstin: row.gstin as string | undefined,
    addresses: (row.addresses as Address[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    notes: row.notes as string | undefined,
    assignedTo: row.assigned_to as string | undefined,
    status: (row.status as Contact['status']) || 'active',
    score: Number(row.score ?? 0),
    parentContactId: row.parent_contact_id as string | undefined,
    customFields: (row.custom_fields as Contact['customFields']) ?? [],
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toContactRow(c: Partial<Contact>): ContactRow {
  const row: ContactRow = {};
  if (c.id) row.id = c.id;
  if (c.type !== undefined) row.type = c.type;
  if (c.firstName !== undefined) row.first_name = c.firstName;
  if (c.lastName !== undefined) row.last_name = c.lastName;
  if (c.email !== undefined) row.email = c.email;
  if (c.emails !== undefined) row.emails = c.emails;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.phones !== undefined) row.phones = c.phones;
  if (c.companyId !== undefined) row.company_id = c.companyId || null;
  if (c.companyName !== undefined) row.company_name = c.companyName;
  if (c.jobTitle !== undefined) row.job_title = c.jobTitle;
  if (c.department !== undefined) row.department = c.department;
  if (c.website !== undefined) row.website = c.website;
  if (c.gstin !== undefined) row.gstin = c.gstin;
  if (c.addresses !== undefined) row.addresses = c.addresses;
  if (c.tags !== undefined) row.tags = c.tags;
  if (c.notes !== undefined) row.notes = c.notes;
  if (c.assignedTo !== undefined) row.assigned_to = c.assignedTo;
  if (c.status !== undefined) row.status = c.status;
  if (c.score !== undefined) row.score = c.score;
  if (c.parentContactId !== undefined) row.parent_contact_id = c.parentContactId || null;
  if (c.customFields !== undefined) row.custom_fields = c.customFields;
  return row;
}

// ---------- mappers: Company ----------

function mapCompany(row: ContactRow): Company {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    website: row.website as string | undefined,
    industry: row.industry as string | undefined,
    employeeCount: row.employee_count as string | undefined,
    annualRevenue: row.annual_revenue == null ? undefined : Number(row.annual_revenue),
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    addresses: (row.addresses as Address[]) ?? [],
    parentCompanyId: row.parent_company_id as string | undefined,
    tags: (row.tags as string[]) ?? [],
    notes: row.notes as string | undefined,
    assignedTo: row.assigned_to as string | undefined,
    status: (row.status as Company['status']) || 'active',
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toCompanyRow(c: Partial<Company>): ContactRow {
  const row: ContactRow = {};
  if (c.id) row.id = c.id;
  if (c.name !== undefined) row.name = c.name;
  if (c.website !== undefined) row.website = c.website;
  if (c.industry !== undefined) row.industry = c.industry;
  if (c.employeeCount !== undefined) row.employee_count = c.employeeCount;
  if (c.annualRevenue !== undefined) row.annual_revenue = c.annualRevenue;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.email !== undefined) row.email = c.email;
  if (c.addresses !== undefined) row.addresses = c.addresses;
  if (c.parentCompanyId !== undefined) row.parent_company_id = c.parentCompanyId || null;
  if (c.tags !== undefined) row.tags = c.tags;
  if (c.notes !== undefined) row.notes = c.notes;
  if (c.assignedTo !== undefined) row.assigned_to = c.assignedTo;
  if (c.status !== undefined) row.status = c.status;
  return row;
}

// ---------- mappers: Opportunity ----------

function mapOpportunity(row: ContactRow): Opportunity {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    contactId: row.contact_id as string | undefined,
    contactName: String(row.contact_name ?? ''),
    companyId: row.company_id as string | undefined,
    companyName: row.company_name as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    pipelineId: String(row.pipeline_id ?? ''),
    stageId: String(row.stage_id ?? 'new'),
    stage: (row.stage as OpportunityStage) || 'new',
    expectedRevenue: Number(row.expected_revenue ?? 0),
    probability: Number(row.probability ?? 10),
    priority: (Number(row.priority ?? 0) as Opportunity['priority']),
    expectedCloseDate: String(row.expected_close_date ?? ''),
    assignedTo: row.assigned_to as string | undefined,
    salesTeam: row.sales_team as string | undefined,
    teamId: row.team_id as string | undefined,
    products: (row.products as Opportunity['products']) ?? [],
    tags: (row.tags as string[]) ?? [],
    notes: row.notes as string | undefined,
    internalNotes: row.internal_notes as string | undefined,
    lostReason: row.lost_reason as string | undefined,
    wonAt: row.won_at as string | undefined,
    lostAt: row.lost_at as string | undefined,
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toOpportunityRow(o: Partial<Opportunity>): ContactRow {
  const row: ContactRow = {};
  if (o.id) row.id = o.id;
  if (o.name !== undefined) row.name = o.name;
  if (o.contactId !== undefined) row.contact_id = o.contactId || null;
  if (o.contactName !== undefined) row.contact_name = o.contactName;
  if (o.companyId !== undefined) row.company_id = o.companyId || null;
  if (o.companyName !== undefined) row.company_name = o.companyName;
  if (o.email !== undefined) row.email = o.email;
  if (o.phone !== undefined) row.phone = o.phone;
  if (o.pipelineId !== undefined) row.pipeline_id = o.pipelineId;
  if (o.stageId !== undefined) row.stage_id = o.stageId;
  if (o.stage !== undefined) row.stage = o.stage;
  if (o.expectedRevenue !== undefined) row.expected_revenue = o.expectedRevenue;
  if (o.probability !== undefined) row.probability = o.probability;
  if (o.priority !== undefined) row.priority = o.priority;
  if (o.expectedCloseDate !== undefined) row.expected_close_date = o.expectedCloseDate || null;
  if (o.assignedTo !== undefined) row.assigned_to = o.assignedTo;
  if (o.salesTeam !== undefined) row.sales_team = o.salesTeam;
  if (o.teamId !== undefined) row.team_id = o.teamId;
  if (o.products !== undefined) row.products = o.products;
  if (o.tags !== undefined) row.tags = o.tags;
  if (o.notes !== undefined) row.notes = o.notes;
  if (o.internalNotes !== undefined) row.internal_notes = o.internalNotes;
  if (o.lostReason !== undefined) row.lost_reason = o.lostReason;
  if (o.wonAt !== undefined) row.won_at = o.wonAt;
  if (o.lostAt !== undefined) row.lost_at = o.lostAt;
  return row;
}

// ---------- mappers: Pipeline (+stages) ----------

function mapStage(row: ContactRow): PipelineStage {
  return {
    id: String(row.id),
    pipelineId: String(row.pipeline_id),
    name: String(row.name ?? ''),
    order: Number(row.order ?? 0),
    probability: Number(row.probability ?? 0),
    color: String(row.color ?? 'hsl(210, 70%, 55%)'),
    description: row.description as string | undefined,
    automationHooks: (row.automation_hooks as string[]) ?? [],
  };
}

function toStageRow(s: Partial<PipelineStage> & { pipelineId: string }): ContactRow {
  const row: ContactRow = { pipeline_id: s.pipelineId };
  if (s.id && isUuid(s.id)) row.id = s.id;
  if (s.name !== undefined) row.name = s.name;
  if (s.order !== undefined) row.order = s.order;
  if (s.probability !== undefined) row.probability = s.probability;
  if (s.color !== undefined) row.color = s.color;
  if (s.description !== undefined) row.description = s.description;
  if (s.automationHooks !== undefined) row.automation_hooks = s.automationHooks;
  return row;
}

function mapPipeline(row: ContactRow, stages: PipelineStage[]): Pipeline {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: row.description as string | undefined,
    isDefault: Boolean(row.is_default),
    stages: stages
      .filter((s) => s.pipelineId === row.id)
      .sort((a, b) => a.order - b.order),
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

// ---------- mappers: Activity ----------

function mapActivity(row: ContactRow): Activity {
  return {
    id: String(row.id),
    type: (row.type as Activity['type']) || 'task',
    subject: String(row.subject ?? ''),
    description: row.description as string | undefined,
    relatedTo: (row.related_to as Activity['relatedTo']) || 'contact',
    relatedId: String(row.related_id ?? ''),
    userId: String(row.user_id ?? ''),
    userName: String(row.user_name ?? ''),
    dueDate: row.due_date as string | undefined,
    completed: Boolean(row.completed),
    completedAt: row.completed_at as string | undefined,
    priority: row.priority as Activity['priority'],
    mentions: (row.mentions as string[]) ?? [],
    attachments: (row.attachments as Activity['attachments']) ?? [],
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toActivityRow(a: Partial<Activity>): ContactRow {
  const row: ContactRow = {};
  if (a.id) row.id = a.id;
  if (a.type !== undefined) row.type = a.type;
  if (a.subject !== undefined) row.subject = a.subject;
  if (a.description !== undefined) row.description = a.description;
  if (a.relatedTo !== undefined) row.related_to = a.relatedTo;
  if (a.relatedId !== undefined) row.related_id = a.relatedId;
  if (a.userId !== undefined) row.user_id = a.userId;
  if (a.userName !== undefined) row.user_name = a.userName;
  if (a.dueDate !== undefined) row.due_date = a.dueDate || null;
  if (a.completed !== undefined) row.completed = a.completed;
  if (a.completedAt !== undefined) row.completed_at = a.completedAt;
  if (a.priority !== undefined) row.priority = a.priority;
  if (a.mentions !== undefined) row.mentions = a.mentions;
  if (a.attachments !== undefined) row.attachments = a.attachments;
  return row;
}

// ---------- mappers: Note ----------

function mapNote(row: ContactRow): Note {
  return {
    id: String(row.id),
    content: String(row.content ?? ''),
    relatedTo: (row.related_to as Note['relatedTo']) || 'contact',
    relatedId: String(row.related_id ?? ''),
    userId: String(row.user_id ?? ''),
    userName: String(row.user_name ?? ''),
    visibility: (row.visibility as Note['visibility']) || 'team',
    mentions: (row.mentions as string[]) ?? [],
    attachments: (row.attachments as Note['attachments']) ?? [],
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function toNoteRow(n: Partial<Note>): ContactRow {
  const row: ContactRow = {};
  if (n.id) row.id = n.id;
  if (n.content !== undefined) row.content = n.content;
  if (n.relatedTo !== undefined) row.related_to = n.relatedTo;
  if (n.relatedId !== undefined) row.related_id = n.relatedId;
  if (n.userId !== undefined) row.user_id = n.userId;
  if (n.userName !== undefined) row.user_name = n.userName;
  if (n.visibility !== undefined) row.visibility = n.visibility;
  if (n.mentions !== undefined) row.mentions = n.mentions;
  if (n.attachments !== undefined) row.attachments = n.attachments;
  return row;
}

// ---------- mappers: Tag ----------

function mapTag(row: ContactRow): CRMTag {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    color: String(row.color ?? 'hsl(var(--muted))'),
    category: row.category as string | undefined,
  };
}

function toTagRow(t: Partial<CRMTag>): ContactRow {
  const row: ContactRow = {};
  if (t.id) row.id = t.id;
  if (t.name !== undefined) row.name = t.name;
  if (t.color !== undefined) row.color = t.color;
  if (t.category !== undefined) row.category = t.category;
  return row;
}

// ===========================================================
//                       CONTACTS
// ===========================================================

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase.from('crm_contacts').select('*').order('created_at', { ascending: false });
  if (error) { logErr('getContacts', error); return []; }
  return (data ?? []).map(mapContact);
}

export async function getContact(id: string): Promise<Contact | undefined> {
  if (!id) return undefined;
  const { data, error } = await supabase.from('crm_contacts').select('*').eq('id', id).maybeSingle();
  if (error) { logErr('getContact', error); return undefined; }
  return data ? mapContact(data) : undefined;
}

export async function saveContact(contact: Partial<Contact> & { id?: string }): Promise<Contact> {
  const isUpdate = isUuid(contact.id);
  const payload = toContactRow(contact);
  if (!isUpdate) {
    delete payload.id;
    const { data, error } = await supabase.from('crm_contacts').insert(payload as never).select('*').single();
    if (error) { logErr('saveContact:insert', error); throw error; }
    return mapContact(data);
  }
  const { data, error } = await supabase
    .from('crm_contacts')
    .update(payload as never)
    .eq('id', contact.id!)
    .select('*')
    .single();
  if (error) { logErr('saveContact:update', error); throw error; }
  return mapContact(data);
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
  if (error) logErr('deleteContact', error);
}

export async function findDuplicateContacts(
  email: string,
  phone?: string,
  excludeId?: string,
): Promise<Contact[]> {
  const all = await getContacts();
  const normalizePhone = (p?: string) => (p || '').replace(/[^\d+]/g, '');
  const targetPhone = normalizePhone(phone);
  const targetEmail = (email || '').toLowerCase().trim();
  return all.filter((c) => {
    if (excludeId && c.id === excludeId) return false;
    if (targetEmail) {
      if (c.email?.toLowerCase() === targetEmail) return true;
      if (c.emails?.some((e) => e.email.toLowerCase() === targetEmail)) return true;
    }
    if (targetPhone) {
      if (normalizePhone(c.phone) === targetPhone) return true;
      if (c.phones?.some((p) => normalizePhone(p.phone) === targetPhone)) return true;
    }
    return false;
  });
}

// ===========================================================
//                       COMPANIES
// ===========================================================

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from('crm_companies').select('*').order('created_at', { ascending: false });
  if (error) { logErr('getCompanies', error); return []; }
  return (data ?? []).map(mapCompany);
}

export async function getCompany(id: string): Promise<Company | undefined> {
  if (!id) return undefined;
  const { data, error } = await supabase.from('crm_companies').select('*').eq('id', id).maybeSingle();
  if (error) { logErr('getCompany', error); return undefined; }
  return data ? mapCompany(data) : undefined;
}

export async function saveCompany(company: Partial<Company> & { id?: string }): Promise<Company> {
  const isUpdate = isUuid(company.id);
  const payload = toCompanyRow(company);
  if (!isUpdate) {
    delete payload.id;
    const { data, error } = await supabase.from('crm_companies').insert(payload as never).select('*').single();
    if (error) { logErr('saveCompany:insert', error); throw error; }
    return mapCompany(data);
  }
  const { data, error } = await supabase
    .from('crm_companies')
    .update(payload as never)
    .eq('id', company.id!)
    .select('*')
    .single();
  if (error) { logErr('saveCompany:update', error); throw error; }
  return mapCompany(data);
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('crm_companies').delete().eq('id', id);
  if (error) logErr('deleteCompany', error);
}

// ===========================================================
//                       PIPELINES
// ===========================================================

export async function getPipelines(): Promise<Pipeline[]> {
  const [pRes, sRes] = await Promise.all([
    supabase.from('crm_pipelines').select('*').order('created_at', { ascending: true }),
    supabase.from('crm_pipeline_stages').select('*').order('order', { ascending: true }),
  ]);
  if (pRes.error) { logErr('getPipelines:p', pRes.error); return []; }
  if (sRes.error) { logErr('getPipelines:s', sRes.error); return []; }
  const stages = (sRes.data ?? []).map(mapStage);
  return (pRes.data ?? []).map((row) => mapPipeline(row, stages));
}

export async function getPipeline(id: string): Promise<Pipeline | undefined> {
  const all = await getPipelines();
  return all.find((p) => p.id === id);
}

export async function getDefaultPipeline(): Promise<Pipeline | undefined> {
  const all = await getPipelines();
  return all.find((p) => p.isDefault) || all[0];
}

export async function savePipeline(pipeline: Partial<Pipeline> & { id?: string }): Promise<Pipeline> {
  const isUpdate = isUuid(pipeline.id);
  const pipelinePayload: ContactRow = {};
  if (pipeline.name !== undefined) pipelinePayload.name = pipeline.name;
  if (pipeline.description !== undefined) pipelinePayload.description = pipeline.description;
  if (pipeline.isDefault !== undefined) pipelinePayload.is_default = pipeline.isDefault;

  let pipelineId: string;
  if (!isUpdate) {
    const { data, error } = await supabase
      .from('crm_pipelines')
      .insert(pipelinePayload as never)
      .select('*')
      .single();
    if (error) { logErr('savePipeline:insert', error); throw error; }
    pipelineId = String(data.id);
  } else {
    pipelineId = pipeline.id!;
    const { error } = await supabase
      .from('crm_pipelines')
      .update(pipelinePayload as never)
      .eq('id', pipelineId);
    if (error) { logErr('savePipeline:update', error); throw error; }
  }

  // Sync stages: replace strategy
  if (pipeline.stages) {
    const { error: delErr } = await supabase
      .from('crm_pipeline_stages')
      .delete()
      .eq('pipeline_id', pipelineId);
    if (delErr) logErr('savePipeline:stages-del', delErr);
    if (pipeline.stages.length > 0) {
      const rows = pipeline.stages.map((s, i) =>
        toStageRow({ ...s, pipelineId, order: s.order ?? i }),
      );
      const { error: insErr } = await supabase.from('crm_pipeline_stages').insert(rows as never);
      if (insErr) logErr('savePipeline:stages-ins', insErr);
    }
  }

  const refreshed = await getPipeline(pipelineId);
  if (!refreshed) throw new Error('Pipeline not found after save');
  return refreshed;
}

export async function deletePipeline(id: string): Promise<{ success: boolean; reason?: string }> {
  const target = await getPipeline(id);
  if (!target) return { success: false, reason: 'Pipeline not found' };
  if (target.isDefault) return { success: false, reason: 'Cannot delete the default pipeline' };
  const { count } = await supabase
    .from('crm_opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_id', id);
  if ((count ?? 0) > 0) {
    return { success: false, reason: `${count} opportunity(ies) still use this pipeline` };
  }
  const { error } = await supabase.from('crm_pipelines').delete().eq('id', id);
  if (error) { logErr('deletePipeline', error); return { success: false, reason: error.message }; }
  return { success: true };
}

export async function setDefaultPipeline(id: string): Promise<void> {
  await supabase.from('crm_pipelines').update({ is_default: false } as never).neq('id', id);
  const { error } = await supabase.from('crm_pipelines').update({ is_default: true } as never).eq('id', id);
  if (error) logErr('setDefaultPipeline', error);
}

// ===========================================================
//                       OPPORTUNITIES
// ===========================================================

export async function getOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('crm_opportunities')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { logErr('getOpportunities', error); return []; }
  return (data ?? []).map(mapOpportunity);
}

export async function getOpportunity(id: string): Promise<Opportunity | undefined> {
  if (!id) return undefined;
  const { data, error } = await supabase.from('crm_opportunities').select('*').eq('id', id).maybeSingle();
  if (error) { logErr('getOpportunity', error); return undefined; }
  return data ? mapOpportunity(data) : undefined;
}

export async function saveOpportunity(opp: Partial<Opportunity> & { id?: string }): Promise<Opportunity> {
  const isUpdate = isUuid(opp.id);
  // Ensure required fields on create
  if (!isUpdate) {
    if (!opp.pipelineId) {
      const def = await getDefaultPipeline();
      if (def) {
        opp.pipelineId = def.id;
        if (!opp.stageId) opp.stageId = def.stages[0]?.id || 'new';
      }
    }
    if (!opp.stage) opp.stage = 'new';
    if (opp.expectedCloseDate === undefined) {
      opp.expectedCloseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }
  const payload = toOpportunityRow(opp);
  if (!isUpdate) {
    delete payload.id;
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(payload as never)
      .select('*')
      .single();
    if (error) { logErr('saveOpportunity:insert', error); throw error; }
    return mapOpportunity(data);
  }
  const { data, error } = await supabase
    .from('crm_opportunities')
    .update(payload as never)
    .eq('id', opp.id!)
    .select('*')
    .single();
  if (error) { logErr('saveOpportunity:update', error); throw error; }
  return mapOpportunity(data);
}

export async function updateOpportunityStage(
  id: string,
  stageId: string,
  stage: OpportunityStage,
): Promise<Opportunity | undefined> {
  const updates: Partial<Opportunity> = { id, stageId, stage };
  if (stage === 'won') {
    updates.wonAt = nowIso();
    updates.probability = 100;
  } else if (stage === 'lost') {
    updates.lostAt = nowIso();
    updates.probability = 0;
  }
  return saveOpportunity(updates);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from('crm_opportunities').delete().eq('id', id);
  if (error) logErr('deleteOpportunity', error);
}

// ===========================================================
//                       ACTIVITIES
// ===========================================================

export async function getActivities(relatedTo?: string, relatedId?: string): Promise<Activity[]> {
  let q = supabase.from('crm_activities').select('*').order('created_at', { ascending: false });
  if (relatedTo) q = q.eq('related_to', relatedTo);
  if (relatedId) q = q.eq('related_id', relatedId);
  const { data, error } = await q;
  if (error) { logErr('getActivities', error); return []; }
  return (data ?? []).map(mapActivity);
}

export async function getActivity(id: string): Promise<Activity | undefined> {
  if (!id) return undefined;
  const { data, error } = await supabase.from('crm_activities').select('*').eq('id', id).maybeSingle();
  if (error) { logErr('getActivity', error); return undefined; }
  return data ? mapActivity(data) : undefined;
}

export async function saveActivity(activity: Partial<Activity> & { id?: string }): Promise<Activity> {
  const isUpdate = isUuid(activity.id);
  const payload = toActivityRow(activity);
  if (!isUpdate) {
    delete payload.id;
    const { data, error } = await supabase.from('crm_activities').insert(payload as never).select('*').single();
    if (error) { logErr('saveActivity:insert', error); throw error; }
    return mapActivity(data);
  }
  const { data, error } = await supabase
    .from('crm_activities')
    .update(payload as never)
    .eq('id', activity.id!)
    .select('*')
    .single();
  if (error) { logErr('saveActivity:update', error); throw error; }
  return mapActivity(data);
}

export async function completeActivity(id: string): Promise<Activity | undefined> {
  const a = await getActivity(id);
  if (!a) return undefined;
  return saveActivity({ ...a, completed: true, completedAt: nowIso() });
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('crm_activities').delete().eq('id', id);
  if (error) logErr('deleteActivity', error);
}

// ===========================================================
//                       NOTES
// ===========================================================

export async function getNotes(relatedTo?: string, relatedId?: string): Promise<Note[]> {
  let q = supabase.from('crm_notes').select('*').order('created_at', { ascending: false });
  if (relatedTo) q = q.eq('related_to', relatedTo);
  if (relatedId) q = q.eq('related_id', relatedId);
  const { data, error } = await q;
  if (error) { logErr('getNotes', error); return []; }
  return (data ?? []).map(mapNote);
}

export async function saveNote(note: Partial<Note> & { id?: string }): Promise<Note> {
  const isUpdate = isUuid(note.id);
  const payload = toNoteRow(note);
  if (!isUpdate) {
    delete payload.id;
    const { data, error } = await supabase.from('crm_notes').insert(payload as never).select('*').single();
    if (error) { logErr('saveNote:insert', error); throw error; }
    return mapNote(data);
  }
  const { data, error } = await supabase
    .from('crm_notes')
    .update(payload as never)
    .eq('id', note.id!)
    .select('*')
    .single();
  if (error) { logErr('saveNote:update', error); throw error; }
  return mapNote(data);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('crm_notes').delete().eq('id', id);
  if (error) logErr('deleteNote', error);
}

// ===========================================================
//                       TAGS
// ===========================================================

export async function getTags(): Promise<CRMTag[]> {
  const { data, error } = await supabase.from('crm_tags').select('*').order('created_at', { ascending: true });
  if (error) { logErr('getTags', error); return []; }
  return (data ?? []).map(mapTag);
}

export async function saveTag(tag: Partial<CRMTag>): Promise<CRMTag> {
  const isUpdate = isUuid(tag.id);
  const payload = toTagRow(tag);
  if (!isUpdate) {
    delete payload.id;
    const { data, error } = await supabase.from('crm_tags').insert(payload as never).select('*').single();
    if (error) { logErr('saveTag:insert', error); throw error; }
    return mapTag(data);
  }
  const { data, error } = await supabase
    .from('crm_tags')
    .update(payload as never)
    .eq('id', tag.id!)
    .select('*')
    .single();
  if (error) { logErr('saveTag:update', error); throw error; }
  return mapTag(data);
}

// ===========================================================
//                       ANALYTICS
// ===========================================================

export async function getCRMStats(): Promise<CRMStats> {
  const [contacts, companies, opportunities, activities] = await Promise.all([
    getContacts(),
    getCompanies(),
    getOpportunities(),
    getActivities(),
  ]);
  const activeOpps = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost');
  const wonOpps = opportunities.filter((o) => o.stage === 'won');
  const lostOpps = opportunities.filter((o) => o.stage === 'lost');
  const closed = wonOpps.length + lostOpps.length;
  return {
    totalContacts: contacts.filter((c) => c.status === 'active').length,
    totalCompanies: companies.filter((c) => c.status === 'active').length,
    totalOpportunities: opportunities.length,
    activeOpportunities: activeOpps.length,
    pipelineValue: activeOpps.reduce((s, o) => s + o.expectedRevenue, 0),
    weightedPipelineValue: activeOpps.reduce((s, o) => s + (o.expectedRevenue * o.probability) / 100, 0),
    wonRevenue: wonOpps.reduce((s, o) => s + o.expectedRevenue, 0),
    lostRevenue: lostOpps.reduce((s, o) => s + o.expectedRevenue, 0),
    winRate: closed > 0 ? Math.round((wonOpps.length / closed) * 100) : 0,
    avgDealSize: wonOpps.length > 0 ? Math.round(wonOpps.reduce((s, o) => s + o.expectedRevenue, 0) / wonOpps.length) : 0,
    activitiesCompleted: activities.filter((a) => a.completed).length,
    activitiesPending: activities.filter((a) => !a.completed).length,
  };
}

export async function getOpportunitiesByStage(): Promise<OpportunitiesByStage[]> {
  const [opps, def] = await Promise.all([getOpportunities(), getDefaultPipeline()]);
  if (!def) return [];
  return def.stages.map((stage) => {
    const stageOpps = opps.filter((o) => o.stageId === stage.id);
    return {
      stage: stage.name,
      stageId: stage.id,
      count: stageOpps.length,
      value: stageOpps.reduce((s, o) => s + o.expectedRevenue, 0),
    };
  });
}

// ===========================================================
//                  IMPORT / EXPORT
// ===========================================================

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export async function importContacts(data: Partial<Contact>[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, duplicates: 0, errors: [] };
  const existing = await getContacts();
  const normalize = (p?: string) => (p || '').replace(/[^\d+]/g, '');
  const byEmail = new Map<string, Contact>();
  const byPhone = new Map<string, Contact>();
  existing.forEach((c) => {
    if (c.email) byEmail.set(c.email.toLowerCase(), c);
    const np = normalize(c.phone);
    if (np) byPhone.set(np, c);
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const email = String(row.email || '').trim().toLowerCase();
      const phone = normalize(row.phone);
      let dup: Contact | undefined;
      if (email) dup = byEmail.get(email);
      if (!dup && phone) dup = byPhone.get(phone);
      if (dup) {
        await saveContact({ ...dup, ...row, id: dup.id });
        result.duplicates++;
        result.success++;
      } else if (row.firstName || row.lastName || row.email || row.phone) {
        const saved = await saveContact(row);
        if (saved.email) byEmail.set(saved.email.toLowerCase(), saved);
        const np = normalize(saved.phone);
        if (np) byPhone.set(np, saved);
        result.success++;
      }
    } catch (e) {
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  return result;
}

export async function importOpportunities(data: Partial<Opportunity>[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, duplicates: 0, errors: [] };
  const existing = await getOpportunities();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      if (!row.name && !row.contactName) {
        result.failed++;
        result.errors.push(`Row ${i + 1}: name or contactName required`);
        continue;
      }
      const dup = existing.find((o) => o.name === row.name && o.contactName === row.contactName);
      if (dup) { result.duplicates++; continue; }
      await saveOpportunity({ ...row, name: row.name || `${row.contactName}'s opportunity` });
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  return result;
}

export async function exportContacts(): Promise<Contact[]> {
  return getContacts();
}

export async function exportOpportunities(): Promise<Opportunity[]> {
  return getOpportunities();
}

// ===========================================================
//              REALTIME SUBSCRIPTION HELPERS
// ===========================================================

export function subscribeToNotes(
  relatedId: string,
  onUpdate: () => void,
) {
  const channel = supabase
    .channel(`crm-notes-${relatedId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'crm_notes', filter: `related_id=eq.${relatedId}` },
      onUpdate,
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToActivities(
  relatedId: string,
  onUpdate: () => void,
) {
  const channel = supabase
    .channel(`crm-activities-${relatedId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'crm_activities', filter: `related_id=eq.${relatedId}` },
      onUpdate,
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}