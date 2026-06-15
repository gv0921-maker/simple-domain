import type { ModuleFilterConfig } from '../types';

export const crmContactsFilterConfig: ModuleFilterConfig = {
  moduleKey: 'crm_contacts',
  searchPlaceholder: 'Search contacts…',
  fields: [
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'companyName', label: 'Company', type: 'text' },
    { key: 'jobTitle', label: 'Job Title', type: 'text' },
    { key: 'status', label: 'Status', type: 'choice', options: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ] },
    { key: 'type', label: 'Type', type: 'choice', options: [
      { value: 'individual', label: 'Individual' },
      { value: 'company', label: 'Company' },
    ] },
    { key: 'score', label: 'Score', type: 'numeric' },
    { key: 'createdAt', label: 'Created Date', type: 'date' },
  ],
  groupByFields: ['status', 'companyName', 'type'],
  sortFields: ['firstName', 'lastName', 'companyName', 'score', 'createdAt'],
  predefinedFilters: [
    {
      id: 'my_contacts',
      label: 'My Contacts',
      filters: [
        { id: 'active', label: 'Active',
          group: { id: 'pf_c_active', field: 'status', operator: 'is', value: 'active' } },
        { id: 'archived', label: 'Archived',
          group: { id: 'pf_c_archived', field: 'status', operator: 'is', value: 'archived' } },
      ],
    },
    {
      id: 'type',
      label: 'Type',
      filters: [
        { id: 'individual', label: 'Individual',
          group: { id: 'pf_c_indiv', field: 'type', operator: 'is', value: 'individual' } },
        { id: 'company', label: 'Company',
          group: { id: 'pf_c_company', field: 'type', operator: 'is', value: 'company' } },
      ],
    },
    {
      id: 'reachable',
      label: 'Reachable',
      filters: [
        { id: 'has_email', label: 'Has Email',
          group: { id: 'pf_c_email', field: 'email', operator: 'is_not_empty' } },
        { id: 'has_phone', label: 'Has Phone',
          group: { id: 'pf_c_phone', field: 'phone', operator: 'is_not_empty' } },
      ],
    },
  ],
};
