// Sales service layer — thin re-export of all sales data modules.
// Note: legacy `Lead` exports from data/sales are preserved for
// SalesPipeline / LeadDetail (sales-side leads, distinct from the
// removed CRM Leads module).
export * from '@/lib/data/sales';
export * from '@/lib/data/sales/storage';
export type * from '@/lib/data/sales/types';