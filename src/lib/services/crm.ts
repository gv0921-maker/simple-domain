// CRM service layer — thin re-export of the CRM data module.
// Components must import CRM data through this file so the
// underlying implementation can be swapped (Supabase, etc.)
// without touching component code.
//
// Excludes: leads (module removed), email-send helpers (none exist).
// Email *fields* on Contact/Opportunity are plain data and pass through.
export * from '@/lib/data/crm';