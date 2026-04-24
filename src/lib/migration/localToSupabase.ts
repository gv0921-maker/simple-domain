// One-time migration utility: localStorage -> Supabase.
// Maps the CRM datasets stored in localStorage (erp_crm_*) into the
// corresponding Supabase tables, then optionally wipes localStorage.
import { supabase } from '@/integrations/supabase/client';
import { getItem } from '@/lib/storage';
import type {
  Company,
  Contact,
  Opportunity,
  Pipeline,
  Activity,
  Note,
  CRMTag,
} from '@/lib/data/crm';

export type MigrationStatus = 'pending' | 'running' | 'success' | 'partial' | 'error' | 'skipped';

export interface TableResult {
  table: string;
  localKey: string;
  totalLocal: number;
  inserted: number;
  failed: number;
  status: MigrationStatus;
  error?: string;
}

// Minimal UUID check — Supabase id columns are uuid, localStorage often uses
// short ids like 't1', 'default', etc. For those we let Postgres assign a new id.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** Count rows in every known local CRM bucket. */
export function getLocalCounts() {
  return {
    companies: getItem<Company[]>('crm_companies', []).length,
    contacts: getItem<Contact[]>('crm_contacts', []).length,
    opportunities: getItem<Opportunity[]>('crm_opportunities', []).length,
    pipelines: getItem<Pipeline[]>('crm_pipelines', []).length,
    activities: getItem<Activity[]>('crm_activities', []).length,
    notes: getItem<Note[]>('crm_notes', []).length,
    tags: getItem<CRMTag[]>('crm_tags', []).length,
  };
}

/** All erp_* keys currently present in localStorage. */
export function listAllLocalKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('erp_')) keys.push(k);
  }
  return keys;
}

async function batchInsert(table: string, rows: Record<string, unknown>[]): Promise<{ inserted: number; failed: number; error?: string }> {
  if (rows.length === 0) return { inserted: 0, failed: 0 };
  const BATCH = 200;
  let inserted = 0;
  let failed = 0;
  let firstError: string | undefined;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    // Cast to any: dynamic table name with dynamic shape. Migration is admin-only.
    const { error, count } = await (supabase as any)
      .from(table)
      .insert(slice, { count: 'exact' });
    if (error) {
      failed += slice.length;
      if (!firstError) firstError = error.message;
    } else {
      inserted += count ?? slice.length;
    }
  }
  return { inserted, failed, error: firstError };
}

function mapCompany(c: Company) {
  return {
    ...(isUuid(c.id) ? { id: c.id } : {}),
    name: c.name,
    website: c.website ?? null,
    industry: c.industry ?? null,
    employee_count: c.employeeCount ?? null,
    annual_revenue: c.annualRevenue ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
    addresses: c.addresses ?? [],
    parent_company_id: isUuid(c.parentCompanyId) ? c.parentCompanyId : null,
    tags: c.tags ?? [],
    notes: c.notes ?? null,
    assigned_to: c.assignedTo ?? null,
    status: c.status ?? 'active',
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function mapContact(c: Contact) {
  return {
    ...(isUuid(c.id) ? { id: c.id } : {}),
    type: c.type,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email ?? '',
    emails: c.emails ?? [],
    phone: c.phone ?? null,
    phones: c.phones ?? [],
    company_id: isUuid(c.companyId) ? c.companyId : null,
    company_name: c.companyName ?? null,
    job_title: c.jobTitle ?? null,
    department: c.department ?? null,
    website: c.website ?? null,
    gstin: c.gstin ?? null,
    addresses: c.addresses ?? [],
    tags: c.tags ?? [],
    notes: c.notes ?? null,
    assigned_to: c.assignedTo ?? null,
    status: c.status ?? 'active',
    score: c.score ?? 0,
    parent_contact_id: isUuid(c.parentContactId) ? c.parentContactId : null,
    custom_fields: c.customFields ?? [],
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function mapOpportunity(o: Opportunity, defaultPipelineId: string | null) {
  const pipelineId = isUuid(o.pipelineId) ? o.pipelineId : defaultPipelineId;
  if (!pipelineId) return null;
  return {
    ...(isUuid(o.id) ? { id: o.id } : {}),
    name: o.name,
    contact_id: isUuid(o.contactId) ? o.contactId : null,
    contact_name: o.contactName ?? '',
    company_id: isUuid(o.companyId) ? o.companyId : null,
    company_name: o.companyName ?? null,
    email: o.email ?? null,
    phone: o.phone ?? null,
    pipeline_id: pipelineId,
    stage_id: o.stageId ?? 'new',
    stage: o.stage,
    expected_revenue: o.expectedRevenue ?? 0,
    probability: o.probability ?? 10,
    priority: o.priority ?? 0,
    expected_close_date: o.expectedCloseDate || null,
    assigned_to: o.assignedTo ?? null,
    sales_team: o.salesTeam ?? null,
    team_id: o.teamId ?? null,
    products: o.products ?? [],
    tags: o.tags ?? [],
    notes: o.notes ?? null,
    internal_notes: o.internalNotes ?? null,
    lost_reason: o.lostReason ?? null,
    won_at: o.wonAt ?? null,
    lost_at: o.lostAt ?? null,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  };
}

function mapActivity(a: Activity) {
  if (!isUuid(a.relatedId)) return null; // crm_activities.related_id is uuid NOT NULL
  return {
    ...(isUuid(a.id) ? { id: a.id } : {}),
    type: a.type,
    subject: a.subject ?? '',
    description: a.description ?? null,
    related_to: a.relatedTo,
    related_id: a.relatedId,
    user_id: a.userId ?? '',
    user_name: a.userName ?? '',
    due_date: a.dueDate ?? null,
    completed: a.completed ?? false,
    completed_at: a.completedAt ?? null,
    priority: a.priority ?? null,
    mentions: a.mentions ?? [],
    attachments: a.attachments ?? [],
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

function mapNote(n: Note) {
  if (!isUuid(n.relatedId)) return null;
  return {
    ...(isUuid(n.id) ? { id: n.id } : {}),
    content: n.content ?? '',
    related_to: n.relatedTo,
    related_id: n.relatedId,
    user_id: n.userId ?? '',
    user_name: n.userName ?? '',
    visibility: n.visibility ?? 'team',
    mentions: n.mentions ?? [],
    attachments: n.attachments ?? [],
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

function mapTag(t: CRMTag) {
  return {
    ...(isUuid(t.id) ? { id: t.id } : {}),
    name: t.name,
    color: t.color ?? null,
    category: t.category ?? null,
  };
}

/**
 * Run the full migration. CRM data is uploaded in dependency order so
 * foreign keys (companies -> contacts -> opportunities, pipelines -> stages
 * -> opportunities) resolve cleanly.
 */
export async function runMigration(
  onProgress?: (r: TableResult) => void
): Promise<TableResult[]> {
  const results: TableResult[] = [];

  // 1. Companies
  const companies = getItem<Company[]>('crm_companies', []);
  {
    const rows = companies.map(mapCompany);
    const { inserted, failed, error } = await batchInsert('crm_companies', rows);
    const r: TableResult = {
      table: 'crm_companies', localKey: 'erp_crm_companies',
      totalLocal: companies.length, inserted, failed,
      status: failed === 0 && !error ? 'success' : (inserted > 0 ? 'partial' : 'error'),
      error,
    };
    results.push(r); onProgress?.(r);
  }

  // 2. Contacts
  const contacts = getItem<Contact[]>('crm_contacts', []);
  {
    const rows = contacts.map(mapContact);
    const { inserted, failed, error } = await batchInsert('crm_contacts', rows);
    const r: TableResult = {
      table: 'crm_contacts', localKey: 'erp_crm_contacts',
      totalLocal: contacts.length, inserted, failed,
      status: failed === 0 && !error ? 'success' : (inserted > 0 ? 'partial' : 'error'),
      error,
    };
    results.push(r); onProgress?.(r);
  }

  // 3. Pipelines + stages (need a real uuid for the FK on opportunities)
  const pipelines = getItem<Pipeline[]>('crm_pipelines', []);
  let defaultPipelineUuid: string | null = null;
  {
    const pipeRows = pipelines.map(p => ({
      ...(isUuid(p.id) ? { id: p.id } : {}),
      name: p.name,
      description: p.description ?? null,
      is_default: p.isDefault ?? false,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));
    let inserted = 0, failed = 0;
    let firstError: string | undefined;
    if (pipeRows.length > 0) {
      const { data, error } = await (supabase as any)
        .from('crm_pipelines')
        .insert(pipeRows)
        .select('id, is_default');
      if (error) {
        failed = pipeRows.length;
        firstError = error.message;
      } else {
        inserted = data?.length ?? 0;
        const def = data?.find((p: { is_default: boolean }) => p.is_default);
        defaultPipelineUuid = def?.id ?? data?.[0]?.id ?? null;

        // Insert stages for each pipeline using returned uuids
        const stageRows: Record<string, unknown>[] = [];
        pipelines.forEach((local, idx) => {
          const newPipelineId = data?.[idx]?.id;
          if (!newPipelineId) return;
          (local.stages ?? []).forEach(s => {
            stageRows.push({
              name: s.name,
              order: s.order ?? 0,
              probability: s.probability ?? 0,
              color: s.color ?? null,
              description: s.description ?? null,
              automation_hooks: s.automationHooks ?? [],
              pipeline_id: newPipelineId,
            });
          });
        });
        if (stageRows.length > 0) {
          const stageRes = await batchInsert('crm_pipeline_stages', stageRows);
          if (stageRes.error && !firstError) firstError = `stages: ${stageRes.error}`;
        }
      }
    }
    const r: TableResult = {
      table: 'crm_pipelines', localKey: 'erp_crm_pipelines',
      totalLocal: pipelines.length, inserted, failed,
      status: failed === 0 && !firstError ? 'success' : (inserted > 0 ? 'partial' : 'error'),
      error: firstError,
    };
    results.push(r); onProgress?.(r);
  }

  // 4. Opportunities
  const opportunities = getItem<Opportunity[]>('crm_opportunities', []);
  {
    const mapped = opportunities.map(o => mapOpportunity(o, defaultPipelineUuid));
    const skipped = mapped.filter(x => x === null).length;
    const rows = mapped.filter((x): x is NonNullable<typeof x> => x !== null);
    const { inserted, failed, error } = await batchInsert('crm_opportunities', rows);
    const r: TableResult = {
      table: 'crm_opportunities', localKey: 'erp_crm_opportunities',
      totalLocal: opportunities.length, inserted, failed: failed + skipped,
      status: (failed + skipped) === 0 && !error
        ? 'success'
        : (inserted > 0 ? 'partial' : 'error'),
      error: error ?? (skipped > 0 ? `${skipped} skipped (no valid pipeline)` : undefined),
    };
    results.push(r); onProgress?.(r);
  }

  // 5. Activities
  const activities = getItem<Activity[]>('crm_activities', []);
  {
    const mapped = activities.map(mapActivity);
    const skipped = mapped.filter(x => x === null).length;
    const rows = mapped.filter((x): x is NonNullable<typeof x> => x !== null);
    const { inserted, failed, error } = await batchInsert('crm_activities', rows);
    const r: TableResult = {
      table: 'crm_activities', localKey: 'erp_crm_activities',
      totalLocal: activities.length, inserted, failed: failed + skipped,
      status: (failed + skipped) === 0 && !error
        ? 'success'
        : (inserted > 0 ? 'partial' : 'error'),
      error: error ?? (skipped > 0 ? `${skipped} skipped (related_id is not a valid uuid)` : undefined),
    };
    results.push(r); onProgress?.(r);
  }

  // 6. Notes
  const notes = getItem<Note[]>('crm_notes', []);
  {
    const mapped = notes.map(mapNote);
    const skipped = mapped.filter(x => x === null).length;
    const rows = mapped.filter((x): x is NonNullable<typeof x> => x !== null);
    const { inserted, failed, error } = await batchInsert('crm_notes', rows);
    const r: TableResult = {
      table: 'crm_notes', localKey: 'erp_crm_notes',
      totalLocal: notes.length, inserted, failed: failed + skipped,
      status: (failed + skipped) === 0 && !error
        ? 'success'
        : (inserted > 0 ? 'partial' : 'error'),
      error: error ?? (skipped > 0 ? `${skipped} skipped (related_id is not a valid uuid)` : undefined),
    };
    results.push(r); onProgress?.(r);
  }

  // 7. Tags
  const tags = getItem<CRMTag[]>('crm_tags', []);
  {
    const rows = tags.map(mapTag);
    const { inserted, failed, error } = await batchInsert('crm_tags', rows);
    const r: TableResult = {
      table: 'crm_tags', localKey: 'erp_crm_tags',
      totalLocal: tags.length, inserted, failed,
      status: failed === 0 && !error ? 'success' : (inserted > 0 ? 'partial' : 'error'),
      error,
    };
    results.push(r); onProgress?.(r);
  }

  return results;
}

/**
 * Wipe every localStorage key produced by the app. Optionally preserves
 * the auth session so the user is not logged out mid-migration.
 */
export function clearAllLocalData(opts?: { preserveAuth?: boolean }): string[] {
  const removed: string[] = [];
  const keys = listAllLocalKeys();
  for (const k of keys) {
    if (opts?.preserveAuth && k === 'erp_auth') continue;
    localStorage.removeItem(k);
    removed.push(k);
  }
  return removed;
}