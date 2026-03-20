// Module tabs configuration for RBAC
// Defines all available tabs per module for permission control

export interface ModuleTab {
  id: string;
  label: string;
  href: string;
}

export interface ModuleTabsConfig {
  moduleId: string;
  moduleName: string;
  tabs: ModuleTab[];
}

// All module tabs configuration
export const MODULE_TABS: ModuleTabsConfig[] = [
  {
    moduleId: 'crm',
    moduleName: 'CRM',
    tabs: [
      { id: 'leads', label: 'Leads', href: '/crm' },
      { id: 'pipeline', label: 'Pipeline', href: '/crm/pipeline' },
      { id: 'contacts', label: 'Contacts', href: '/crm/contacts' },
      { id: 'opportunities', label: 'Opportunities', href: '/crm/opportunities' },
    ],
  },
  {
    moduleId: 'sales',
    moduleName: 'Sales',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/sales' },
      { id: 'quotations', label: 'Quotations', href: '/sales/quotations' },
      { id: 'orders', label: 'Orders', href: '/sales/orders' },
      { id: 'customers', label: 'Customers', href: '/sales/customers' },
      { id: 'subscriptions', label: 'Subscriptions', href: '/sales/subscriptions' },
      { id: 'pricelists', label: 'Pricelists', href: '/sales/pricelists' },
      { id: 'reports', label: 'Reports', href: '/sales/reports' },
    ],
  },
  {
    moduleId: 'inventory',
    moduleName: 'Inventory',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/inventory' },
      { id: 'stock-dashboard', label: 'Stock Dashboard', href: '/inventory/stock-dashboard' },
      { id: 'operations', label: 'Operations', href: '/inventory/operations' },
      { id: 'products', label: 'Products', href: '/inventory/products' },
      { id: 'stock-moves', label: 'Stock Moves', href: '/inventory/stock-moves' },
      { id: 'warehouses', label: 'Warehouses', href: '/inventory/warehouses' },
      { id: 'locations', label: 'Locations', href: '/inventory/locations' },
      { id: 'adjustments', label: 'Adjustments', href: '/inventory/adjustments' },
      { id: 'reorder-rules', label: 'Reorder Rules', href: '/inventory/reorder-rules' },
      { id: 'reporting', label: 'Reporting', href: '/inventory/reporting' },
      { id: 'configuration', label: 'Configuration', href: '/inventory/configuration' },
    ],
  },
  {
    moduleId: 'manufacturing',
    moduleName: 'Manufacturing',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/manufacturing' },
      { id: 'work-orders', label: 'Work Orders', href: '/manufacturing/work-orders' },
      { id: 'bom', label: 'BOM', href: '/manufacturing/bom' },
      { id: 'work-centers', label: 'Work Centers', href: '/manufacturing/work-centers' },
      { id: 'planning', label: 'Planning', href: '/manufacturing/planning' },
      { id: 'shop-floor', label: 'Shop Floor', href: '/shop-floor' },
    ],
  },
  {
    moduleId: 'accounting',
    moduleName: 'Accounting',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/accounting' },
      { id: 'journal', label: 'Journal Entries', href: '/accounting/journal' },
      { id: 'chart', label: 'Chart of Accounts', href: '/accounting/chart' },
      { id: 'invoices', label: 'Invoices', href: '/invoicing' },
      { id: 'bills', label: 'Bills', href: '/accounting/bills' },
      { id: 'payments', label: 'Payments', href: '/accounting/payments' },
      { id: 'reports', label: 'Reports', href: '/accounting/reports' },
    ],
  },
  {
    moduleId: 'hr',
    moduleName: 'HR',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/employees' },
      { id: 'directory', label: 'Directory', href: '/employees/directory' },
      { id: 'departments', label: 'Departments', href: '/employees/departments' },
      { id: 'attendance', label: 'Attendance', href: '/employees/attendance' },
      { id: 'leave', label: 'Leave', href: '/employees/leave' },
      { id: 'contracts', label: 'Contracts', href: '/employees/contracts' },
    ],
  },
  {
    moduleId: 'projects',
    moduleName: 'Projects',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/projects' },
      { id: 'tasks', label: 'Tasks', href: '/projects/tasks' },
      { id: 'timesheets', label: 'Timesheets', href: '/projects/timesheets' },
      { id: 'milestones', label: 'Milestones', href: '/projects/milestones' },
    ],
  },
  {
    moduleId: 'helpdesk',
    moduleName: 'Helpdesk',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/helpdesk' },
      { id: 'tickets', label: 'Tickets', href: '/helpdesk/tickets' },
      { id: 'knowledge', label: 'Knowledge Base', href: '/helpdesk/knowledge' },
      { id: 'sla', label: 'SLA', href: '/helpdesk/sla' },
    ],
  },
  {
    moduleId: 'pos',
    moduleName: 'POS',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/pos' },
      { id: 'session', label: 'Session', href: '/pos/session' },
      { id: 'orders', label: 'Orders', href: '/pos/orders' },
      { id: 'configuration', label: 'Configuration', href: '/pos/configuration' },
    ],
  },
  {
    moduleId: 'website',
    moduleName: 'Website',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/website' },
      { id: 'pages', label: 'Pages', href: '/website/pages' },
      { id: 'blog', label: 'Blog', href: '/website/blog' },
      { id: 'analytics', label: 'Analytics', href: '/website/analytics' },
    ],
  },
  {
    moduleId: 'settings',
    moduleName: 'Settings',
    tabs: [
      { id: 'general', label: 'General', href: '/settings' },
      { id: 'users', label: 'Users', href: '/settings/users' },
      { id: 'roles', label: 'Roles', href: '/settings/roles' },
      { id: 'customization', label: 'Customization', href: '/settings/customization' },
      { id: 'audit', label: 'Audit Logs', href: '/settings/audit' },
      { id: 'backups', label: 'Backups', href: '/settings/backups' },
    ],
  },
  {
    moduleId: 'reports',
    moduleName: 'Reports',
    tabs: [
      { id: 'overview', label: 'Overview', href: '/reports' },
      { id: 'sales-reports', label: 'Sales', href: '/reports/sales' },
      { id: 'inventory-reports', label: 'Inventory', href: '/reports/inventory' },
      { id: 'financial-reports', label: 'Financial', href: '/reports/financial' },
    ],
  },
];

// Helper to get tabs for a module
export function getModuleTabs(moduleId: string): ModuleTab[] {
  return MODULE_TABS.find((m) => m.moduleId === moduleId)?.tabs || [];
}

// Helper to get all tab IDs for a module
export function getModuleTabIds(moduleId: string): string[] {
  return getModuleTabs(moduleId).map((t) => t.id);
}
