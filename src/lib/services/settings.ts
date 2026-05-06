// Settings service layer — RBAC, audit logs, module tabs.
// Auth flows are intentionally NOT routed through this layer.
export * from '@/lib/data/rbac';
export * from '@/lib/data/moduleTabs';

// Company-level settings used by Sales (GST origin state, etc.).
export { getCompanySettings, saveCompanySettings } from '@/lib/sales/companySettings';
export type { CompanySettings } from '@/lib/sales/companySettings';