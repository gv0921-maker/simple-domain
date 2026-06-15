# Settings Module Audit — Batch 1

Date: 2026-06-15
Scope: Every page under `src/pages/settings/`.

Legend: **FUNCTIONAL** | **PARTIAL** | **STUB** | **DEAD**

| # | Page | Status | Notes |
|---|------|--------|-------|
| 1 | CompanySettings.tsx | FUNCTIONAL | Reads/writes `company_settings` via `useCompanySettings` / `useUpdateCompanySettings`. RLS-gated to super_admin on save. |
| 2 | UsersManagement.tsx | FUNCTIONAL | Lists auth users via `list-app-users` edge function, manages role assignments via `setUserRoles`, creates users via `create-employee-with-login`. |
| 3 | RolesManagement.tsx | FUNCTIONAL | Full CRUD on `app_roles` + `app_role_permissions` via `useRoles` / `useSaveRole` / `useDeleteRole`. Inheritance, permission matrix, audit logging all wired. |
| 4 | VendorsSettings.tsx | FUNCTIONAL | CRUD via `useVendors` hooks (Supabase-backed `vendors` table). Search + active/inactive filter work. |
| 5 | WorkSchedulesSettings.tsx | FUNCTIONAL | Reads/writes employee schedules via `useAllEmployeeSchedules` + mutation hooks. Bulk update + history dialog functional. Super-admin gated. |
| 6 | HolidaysSettings.tsx | FUNCTIONAL | CRUD via `useHolidaysList` + `useCreateHolidayX` / `useUpdateHolidayX` / `useDeactivateHoliday` / `useDeleteHolidayX`. Super-admin gated. |
| 7 | PayrollSettings.tsx | FUNCTIONAL | Loads/saves `payroll_settings` via `getPayrollSettings` / `updatePayrollSettingsX`. PF/ESI/PT rates persisted. |
| 8 | NotificationSettings.tsx | FUNCTIONAL | Per-user preferences via `useNotificationPreferences` / `useUpdatePreferences`. Browser-push subscribe/unsubscribe + test notification wired. |
| 9 | CustomizationSettings.tsx | FUNCTIONAL | Module visibility + theme + form registry navigation. Persisted via `CustomizationContext` (localStorage — intentional, per memory). |
| 10 | StudioEditor.tsx | FUNCTIONAL | Odoo-style form editor — reads/writes via `studioStorage` (localStorage). Save/reset/preview all wired. Settings-Admin scoped. |
| 11 | CRMPipelinesSettings.tsx | FUNCTIONAL | Pipeline + stage CRUD via Supabase TanStack hooks (`usePipelines`, `useSavePipeline`, etc.). Drag-and-drop stage editor functional. |
| 12 | CRMDataSchema.tsx | **DEAD** | Static "API docs" page describing the **old localStorage CRM shapes**. CRM has been fully migrated to Supabase; this file describes endpoints that no longer exist. No outbound links from any module reference it except the settings nav. **Safe to delete.** |
| 13 | AccessibilitySettings.tsx | FUNCTIONAL | Reduce-motion toggle via `AccessibilityContext` (localStorage). |
| 14 | PriceApprovalsPage.tsx | FUNCTIONAL | Lists pending invoices via `usePendingPriceApprovals`, approve/reject via `useSetInvoicePriceApproval` + `useUpdateInvoiceLineApproval`. Super-admin gated. |
| 15 | NumberingSettings.tsx | FUNCTIONAL | Reads/writes via `useNumberingSettings` / `useUpdateNumberingSettings`. Preview next number works. Super-admin gated. |
| 16 | PaymentAccountsSettings.tsx | FUNCTIONAL | CRUD via `usePaymentAccounts` + `useSavePaymentAccount` / `useDeletePaymentAccount`. Super-admin gated. |
| 17 | AuditLogs.tsx | FUNCTIONAL | Reads `app_audit_logs` via `useAuditLogs`. Filter + search + CSV export work. Super-admin gated. |
| 18 | BackupsSettings.tsx | **STUB** | Pure "Backups feature is coming soon" placeholder. No service calls, no state. **Recommended action:** keep as visible placeholder (do not delete — communicates roadmap) OR remove from nav until implemented. For this batch we keep it but flag it as not-yet-functional. |
| 19 | GeneralSettings.tsx | **STUB** (landing) | The `/settings` index page. Hard-coded company name/email/phone/website defaults, fake "Save Changes" button that calls nothing, switches with no handlers, hard-coded retention/backup selects, fake Localization fields. The **only real functionality** is the "Sync CRM Contacts to Customers" button (`backfillContactsToCustomers`). **Recommended action:** replace entirely with a categorised Settings hub (Batch 1 Step 2). The CRM sync button is preserved inside a "System utilities" card on the hub. |

## Summary

- **FUNCTIONAL:** 16
- **PARTIAL:** 0
- **STUB:** 2 (GeneralSettings — replaced this batch; BackupsSettings — kept as placeholder)
- **DEAD:** 1 (CRMDataSchema — deleted this batch)

## Cross-references checked before marking DEAD

- `CRMDataSchema.tsx` — only referenced by `src/App.tsx` (route import) and `src/lib/navigation/settings.ts` (Data Schema nav entry). No other module links to `/settings/data-schema`.
