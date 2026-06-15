// CRM service layer — type-only re-export.
// Runtime data access lives in @/lib/data/crm-supabase and is consumed
// through the React Query hooks in @/hooks/crm/useCRMQueries.
// This file exists so legacy imports keep resolving while the codebase
// migrates to importing types directly from @/lib/crm/types.
export * from '@/lib/crm/types';