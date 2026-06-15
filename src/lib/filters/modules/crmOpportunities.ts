import type { ModuleFilterConfig } from '../types';

export const crmOpportunitiesFilterConfig: ModuleFilterConfig = {
  moduleKey: 'crm_opportunities',
  searchPlaceholder: 'Search pipeline…',
  fields: [
    { key: 'name', label: 'Opportunity Name', type: 'text' },
    { key: 'stage', label: 'Stage', type: 'choice', options: [
      { value: 'new', label: 'New' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'proposition', label: 'Proposition' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' },
    ] },
    { key: 'assignedTo', label: 'Salesperson', type: 'text' },
    { key: 'salesTeam', label: 'Sales Team', type: 'text' },
    { key: 'expectedRevenue', label: 'Expected Revenue', type: 'numeric' },
    { key: 'expectedCloseDate', label: 'Expected Closing', type: 'date' },
    { key: 'contactName', label: 'Contact', type: 'text' },
    { key: 'companyName', label: 'Company', type: 'text' },
    { key: 'priority', label: 'Priority', type: 'choice', options: [
      { value: '0', label: 'No stars' }, { value: '1', label: '★' },
      { value: '2', label: '★★' }, { value: '3', label: '★★★' },
    ] },
    { key: 'createdAt', label: 'Created Date', type: 'date' },
    { key: 'updatedAt', label: 'Last Activity', type: 'date' },
  ],
  groupByFields: ['stage', 'assignedTo', 'salesTeam', 'priority', 'expected_closing_month'],
  sortFields: ['name', 'expectedRevenue', 'expectedCloseDate', 'createdAt', 'updatedAt'],
  predefinedFilters: [
    {
      id: 'my_pipeline',
      label: 'My Pipeline',
      multiSelect: false,
      filters: [
        { id: 'my_opps', label: 'My Opportunities',
          group: { id: 'pf_my_opps', field: 'assignedTo', operator: 'is', value: '__current_user__' } },
        { id: 'unassigned', label: 'Unassigned',
          group: { id: 'pf_unassigned', field: 'assignedTo', operator: 'is_empty' } },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      filters: [
        { id: 'open', label: 'Open',
          group: { id: 'pf_open', field: 'stage', operator: 'not_in', value: ['won', 'lost'] } },
        { id: 'won', label: 'Won',
          group: { id: 'pf_won', field: 'stage', operator: 'is', value: 'won' } },
        { id: 'lost', label: 'Lost',
          group: { id: 'pf_lost', field: 'stage', operator: 'is', value: 'lost' } },
      ],
    },
    {
      id: 'expected_closing',
      label: 'Expected Closing',
      multiSelect: false,
      filters: [
        { id: 'today', label: 'Today',
          group: { id: 'pf_today', field: 'expectedCloseDate', operator: 'today' } },
        { id: 'this_week', label: 'This Week',
          group: { id: 'pf_week', field: 'expectedCloseDate', operator: 'this_week' } },
        { id: 'this_month', label: 'This Month',
          group: { id: 'pf_month', field: 'expectedCloseDate', operator: 'this_month' } },
        { id: 'overdue', label: 'Overdue',
          group: { id: 'pf_overdue', field: 'expectedCloseDate', operator: 'before', value: '__today__' } },
      ],
    },
    {
      id: 'priority',
      label: 'Priority',
      filters: [
        { id: 'high', label: 'High (★★★)',
          group: { id: 'pf_p_high', field: 'priority', operator: 'is', value: '3' } },
        { id: 'medium', label: 'Medium (★★)',
          group: { id: 'pf_p_med', field: 'priority', operator: 'is', value: '2' } },
        { id: 'low', label: 'Low (★)',
          group: { id: 'pf_p_low', field: 'priority', operator: 'is', value: '1' } },
      ],
    },
  ],
};
