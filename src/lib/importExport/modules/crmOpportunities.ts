import { registerImportExport, type ImportExportSchema } from '../registry';

export const crmOpportunitiesImportSchema: ImportExportSchema = {
  moduleKey: 'crm_opportunities',
  displayName: 'CRM Opportunities',
  table: 'crm_opportunities',
  upsertKey: 'id', // optional; rows without id are inserted
  permissions: { import: ['admin', 'super_admin'], export: ['user', 'admin', 'super_admin'] },
  columns: [
    { key: 'name', label: 'Opportunity Name', type: 'text', required: true, exampleValue: 'New Website Build' },
    { key: 'contact_name', label: 'Contact', type: 'text', exampleValue: 'Aarav Sharma' },
    { key: 'company_name', label: 'Company', type: 'text', exampleValue: 'Acme Pvt Ltd' },
    { key: 'email', label: 'Email', type: 'text', exampleValue: 'aarav@example.com' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'stage', label: 'Stage', type: 'enum',
      enumOptions: ['new', 'qualified', 'proposition', 'won', 'lost'], exampleValue: 'new' },
    { key: 'expected_revenue', label: 'Expected Revenue', type: 'number', exampleValue: 50000 },
    { key: 'probability', label: 'Probability (%)', type: 'number', exampleValue: 30 },
    { key: 'priority', label: 'Priority (0-3)', type: 'number', exampleValue: 1 },
    { key: 'sales_team', label: 'Sales Team', type: 'text' },
    { key: 'expected_close_date', label: 'Expected Close Date', type: 'date', exampleValue: '2026-12-31' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
};

registerImportExport(crmOpportunitiesImportSchema);