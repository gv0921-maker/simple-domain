// Odoo Studio-style form customization types

export type FieldWidgetType =
  | 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime'
  | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'currency'
  | 'url' | 'tags' | 'priority' | 'status' | 'color' | 'image';

export interface StudioFieldOption {
  label: string;
  value: string;
}

export interface StudioField {
  id: string;
  label: string;
  technicalName: string;
  widget: FieldWidgetType;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  readOnly: boolean;
  defaultValue?: string;
  tooltip?: string;
  colSpan: 1 | 2; // 1 = half width, 2 = full width
  options?: StudioFieldOption[]; // for select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface StudioSmartButton {
  id: string;
  label: string;
  icon: string; // lucide icon name
  targetModule: string; // module id to link to
  targetRoute: string; // route path
  countField?: string; // field name to show count from
  visible: boolean;
  color?: string;
}

export interface StudioActionButton {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger' | 'status';
  action: 'navigate' | 'status_change' | 'print' | 'email' | 'custom';
  targetRoute?: string;
  targetStatus?: string;
  visible: boolean;
  position: 'header' | 'footer';
  order: number;
}

export interface StudioTab {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  fields: string[]; // field ids in this tab
}

export interface StudioSection {
  id: string;
  label?: string;
  columns: 1 | 2;
  visible: boolean;
  order: number;
  fieldIds: string[]; // ordered field ids in this section
}

export interface StudioFormConfig {
  id: string; // "moduleId:formName"
  moduleId: string;
  formName: string;
  // Layout
  headerFields: string[]; // field ids shown in form header area
  sections: StudioSection[];
  tabs: StudioTab[];
  // Components
  fields: StudioField[];
  smartButtons: StudioSmartButton[];
  actionButtons: StudioActionButton[];
  // Metadata
  lastModified: string;
}

// Module and route registry for linking
export const MODULE_REGISTRY = [
  { id: 'crm', name: 'CRM', routes: [
    { path: '/crm', label: 'Pipeline' },
    { path: '/crm/contacts', label: 'Contacts' },
  ]},
  { id: 'sales', name: 'Sales', routes: [
    { path: '/sales', label: 'Overview' },
    { path: '/sales/quotations', label: 'Quotations' },
    { path: '/sales/orders', label: 'Orders' },
    { path: '/sales/customers', label: 'Customers' },
  ]},
  { id: 'inventory', name: 'Inventory', routes: [
    { path: '/inventory', label: 'Overview' },
    { path: '/inventory/products', label: 'Products' },
    { path: '/inventory/warehouses', label: 'Warehouses' },
    { path: '/inventory/operations', label: 'Operations' },
  ]},
  { id: 'manufacturing', name: 'Manufacturing', routes: [
    { path: '/manufacturing', label: 'Overview' },
    { path: '/manufacturing/work-orders', label: 'Work Orders' },
    { path: '/manufacturing/bom', label: 'Bill of Materials' },
  ]},
  { id: 'accounting', name: 'Accounting', routes: [
    { path: '/accounting', label: 'Overview' },
    { path: '/invoicing', label: 'Invoices' },
    { path: '/accounting/payments', label: 'Payments' },
  ]},
];

export const WIDGET_OPTIONS: { value: FieldWidgetType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'currency', label: 'Currency' },
  { value: 'url', label: 'URL' },
  { value: 'tags', label: 'Tags' },
  { value: 'priority', label: 'Priority Stars' },
  { value: 'status', label: 'Status Badge' },
  { value: 'image', label: 'Image' },
];

export const SMART_BUTTON_ICONS = [
  'FileText', 'ShoppingCart', 'Package', 'DollarSign', 'Users',
  'Mail', 'Phone', 'Calendar', 'ClipboardList', 'Truck',
  'Factory', 'Building', 'Globe', 'Star', 'Heart',
  'MessageSquare', 'Bell', 'Flag', 'Tag', 'Bookmark',
];
