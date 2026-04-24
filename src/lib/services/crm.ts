// CRM service layer — now backed by Supabase.
//
// All CRM functions (getContacts, saveOpportunity, getNotes, etc.)
// are re-exported from the Supabase implementation. They are async
// (return Promises) — components/hooks already wrap CRM access in
// React Query (see src/hooks/crm/useCRMQueries.ts) so the swap is
// transparent at the service boundary.
//
// Types (Contact, Opportunity, Activity, Note, Pipeline, CRMStats,
// Company, CRMTag, Address, OpportunityStage, …) live in
// `@/lib/data/crm` and are re-exported here so any consumer that
// imports a TYPE from `@/lib/services/crm` keeps working.
//
// Excludes: leads (module removed), email-send helpers (none exist).
// Email *fields* on Contact/Opportunity are plain data and pass through.

// Runtime functions → Supabase implementation (async).
export * from '@/lib/data/crm-supabase';

// Type-only re-exports from the original module so existing
// `import type { Contact } from '@/lib/services/crm'` still resolves.
export type {
  Address,
  Company,
  CustomField,
  Contact,
  Pipeline,
  PipelineStage,
  OpportunityProduct,
  Opportunity,
  RichAttachment,
  Activity,
  Note,
  CRMTag,
  CRMStats,
  OpportunitiesByStage,
  ImportResult,
  ContactType,
  ContactStatus,
  OpportunityStage,
  ActivityType,
  NoteVisibility,
} from '@/lib/data/crm';