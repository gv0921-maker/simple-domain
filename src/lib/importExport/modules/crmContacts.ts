import { registerImportExport, type ImportExportSchema } from '../registry';

export const crmContactsImportSchema: ImportExportSchema = {
  moduleKey: 'crm_contacts',
  displayName: 'CRM Contacts',
  table: 'crm_contacts',
  upsertKey: 'email',
  permissions: { import: ['admin', 'super_admin'], export: ['user', 'admin', 'super_admin'] },
  columns: [
    { key: 'first_name', label: 'First Name', type: 'text', required: true, exampleValue: 'Aarav' },
    { key: 'last_name', label: 'Last Name', type: 'text', exampleValue: 'Sharma' },
    { key: 'email', label: 'Email', type: 'text', required: true, exampleValue: 'aarav@example.com' },
    { key: 'phone', label: 'Phone', type: 'text', exampleValue: '+91 98765 43210' },
    { key: 'mobile', label: 'Mobile', type: 'text' },
    { key: 'job_title', label: 'Job Title', type: 'text' },
    { key: 'company_name', label: 'Company', type: 'text', exampleValue: 'Acme Pvt Ltd' },
    { key: 'type', label: 'Type', type: 'enum', enumOptions: ['individual', 'company'], exampleValue: 'individual' },
    { key: 'status', label: 'Status', type: 'enum', enumOptions: ['active', 'archived'], exampleValue: 'active' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'street', label: 'Street', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'postal_code', label: 'Postal Code', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'score', label: 'Score', type: 'number' },
  ],
};

registerImportExport(crmContactsImportSchema);