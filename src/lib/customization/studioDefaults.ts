// Default Studio form configurations for all modules
import { StudioFormConfig } from './studioTypes';

export function getDefaultStudioForm(moduleId: string, formName: string): StudioFormConfig {
  const key = `${moduleId}:${formName}`;
  const defaults = DEFAULT_STUDIO_FORMS[key];
  if (defaults) return { ...defaults, id: key, moduleId, formName, lastModified: new Date().toISOString() };
  
  // Fallback empty form
  return {
    id: key,
    moduleId,
    formName,
    headerFields: [],
    sections: [{ id: 'main', columns: 2, visible: true, order: 0, fieldIds: [] }],
    tabs: [],
    fields: [],
    smartButtons: [],
    actionButtons: [],
    lastModified: new Date().toISOString(),
  };
}

const DEFAULT_STUDIO_FORMS: Record<string, Omit<StudioFormConfig, 'id' | 'moduleId' | 'formName' | 'lastModified'>> = {
  'crm:New Opportunity': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'General Information', columns: 2, visible: true, order: 0, fieldIds: ['contact', 'company', 'expectedRevenue', 'expectedCloseDate', 'priority', 'salesTeam'] },
      { id: 'extra', label: 'Additional Details', columns: 2, visible: true, order: 1, fieldIds: ['email', 'phone', 'tags', 'source'] },
    ],
    tabs: [
      { id: 'notes', label: 'Internal Notes', visible: true, order: 0, fields: ['internalNotes'] },
    ],
    fields: [
      { id: 'name', label: 'Opportunity Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2, placeholder: 'e.g., Office Design Project' },
      { id: 'contact', label: 'Contact', technicalName: 'contactId', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'company', label: 'Company', technicalName: 'companyId', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'expectedRevenue', label: 'Expected Revenue', technicalName: 'expectedRevenue', widget: 'currency', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'expectedCloseDate', label: 'Expected Closing', technicalName: 'expectedCloseDate', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'priority', label: 'Priority', technicalName: 'priority', widget: 'priority', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'salesTeam', label: 'Sales Team', technicalName: 'salesTeam', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'email', label: 'Email', technicalName: 'email', widget: 'email', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'phone', label: 'Phone', technicalName: 'phone', widget: 'phone', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'tags', label: 'Tags', technicalName: 'tags', widget: 'tags', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'source', label: 'Source', technicalName: 'source', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Website', value: 'website' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Referral', value: 'referral' }] },
      { id: 'internalNotes', label: 'Internal Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_quotations', label: 'Quotations', icon: 'FileText', targetModule: 'sales', targetRoute: '/sales/quotations', visible: true },
      { id: 'sb_orders', label: 'Orders', icon: 'ShoppingCart', targetModule: 'sales', targetRoute: '/sales/orders', visible: true },
      { id: 'sb_invoices', label: 'Invoices', icon: 'DollarSign', targetModule: 'accounting', targetRoute: '/invoicing', visible: true },
    ],
    actionButtons: [
      { id: 'ab_won', label: 'Won', type: 'primary', action: 'status_change', targetStatus: 'won', visible: true, position: 'header', order: 0 },
      { id: 'ab_lost', label: 'Lost', type: 'danger', action: 'status_change', targetStatus: 'lost', visible: true, position: 'header', order: 1 },
      { id: 'ab_quotation', label: 'New Quotation', type: 'secondary', action: 'navigate', targetRoute: '/sales/quotations/new', visible: true, position: 'header', order: 2 },
    ],
  },
  'crm:New Lead': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'Lead Information', columns: 2, visible: true, order: 0, fieldIds: ['contactName', 'email', 'phone', 'company'] },
      { id: 'extra', label: 'Qualification', columns: 2, visible: true, order: 1, fieldIds: ['source', 'campaign', 'medium', 'priority'] },
    ],
    tabs: [
      { id: 'notes', label: 'Notes', visible: true, order: 0, fields: ['notes'] },
    ],
    fields: [
      { id: 'name', label: 'Lead Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'contactName', label: 'Contact Name', technicalName: 'contactName', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'email', label: 'Email', technicalName: 'email', widget: 'email', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'phone', label: 'Phone', technicalName: 'phone', widget: 'phone', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'company', label: 'Company', technicalName: 'company', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'source', label: 'Source', technicalName: 'source', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Website', value: 'website' }, { label: 'Email Campaign', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Referral', value: 'referral' }, { label: 'Social Media', value: 'social' }] },
      { id: 'campaign', label: 'Campaign', technicalName: 'campaign', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'medium', label: 'Medium', technicalName: 'medium', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Email', value: 'email' }, { label: 'Banner', value: 'banner' }, { label: 'Direct', value: 'direct' }] },
      { id: 'priority', label: 'Priority', technicalName: 'priority', widget: 'priority', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'notes', label: 'Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_opportunity', label: 'Convert to Opportunity', icon: 'Target', targetModule: 'crm', targetRoute: '/crm', visible: true },
    ],
    actionButtons: [
      { id: 'ab_convert', label: 'Convert to Opportunity', type: 'primary', action: 'navigate', targetRoute: '/crm', visible: true, position: 'header', order: 0 },
    ],
  },
  'crm:New Contact': {
    headerFields: ['firstName', 'lastName'],
    sections: [
      { id: 'main', label: 'Contact Details', columns: 2, visible: true, order: 0, fieldIds: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'jobTitle'] },
      { id: 'company', label: 'Company Information', columns: 2, visible: true, order: 1, fieldIds: ['company', 'website'] },
      { id: 'address', label: 'Address', columns: 2, visible: true, order: 2, fieldIds: ['street', 'city', 'state', 'zip', 'country'] },
    ],
    tabs: [
      { id: 'notes', label: 'Notes & Tags', visible: true, order: 0, fields: ['tags', 'notes'] },
    ],
    fields: [
      { id: 'firstName', label: 'First Name', technicalName: 'firstName', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'lastName', label: 'Last Name', technicalName: 'lastName', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'email', label: 'Email', technicalName: 'email', widget: 'email', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'phone', label: 'Phone', technicalName: 'phone', widget: 'phone', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'mobile', label: 'Mobile', technicalName: 'mobile', widget: 'phone', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'jobTitle', label: 'Job Title', technicalName: 'jobTitle', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'company', label: 'Company', technicalName: 'companyId', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'website', label: 'Website', technicalName: 'website', widget: 'url', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'street', label: 'Street', technicalName: 'street', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 2 },
      { id: 'city', label: 'City', technicalName: 'city', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'state', label: 'State', technicalName: 'state', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'zip', label: 'ZIP', technicalName: 'zip', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'country', label: 'Country', technicalName: 'country', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'tags', label: 'Tags', technicalName: 'tags', widget: 'tags', required: false, visible: true, readOnly: false, colSpan: 2 },
      { id: 'notes', label: 'Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_opportunities', label: 'Opportunities', icon: 'Target', targetModule: 'crm', targetRoute: '/crm', visible: true },
      { id: 'sb_quotations', label: 'Quotations', icon: 'FileText', targetModule: 'sales', targetRoute: '/sales/quotations', visible: true },
    ],
    actionButtons: [],
  },
  'crm:New Company': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'Company Details', columns: 2, visible: true, order: 0, fieldIds: ['name', 'industry', 'website', 'phone', 'email', 'employees'] },
      { id: 'address', label: 'Address', columns: 2, visible: true, order: 1, fieldIds: ['street', 'city', 'state', 'zip', 'country'] },
    ],
    tabs: [
      { id: 'contacts', label: 'Contacts', visible: true, order: 0, fields: [] },
      { id: 'notes', label: 'Notes', visible: true, order: 1, fields: ['notes'] },
    ],
    fields: [
      { id: 'name', label: 'Company Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'industry', label: 'Industry', technicalName: 'industry', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Technology', value: 'tech' }, { label: 'Finance', value: 'finance' }, { label: 'Healthcare', value: 'healthcare' }, { label: 'Retail', value: 'retail' }, { label: 'Manufacturing', value: 'manufacturing' }] },
      { id: 'website', label: 'Website', technicalName: 'website', widget: 'url', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'phone', label: 'Phone', technicalName: 'phone', widget: 'phone', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'email', label: 'Email', technicalName: 'email', widget: 'email', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'employees', label: 'Employees', technicalName: 'employees', widget: 'number', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'street', label: 'Street', technicalName: 'street', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 2 },
      { id: 'city', label: 'City', technicalName: 'city', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'state', label: 'State', technicalName: 'state', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'zip', label: 'ZIP', technicalName: 'zip', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'country', label: 'Country', technicalName: 'country', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'notes', label: 'Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_contacts', label: 'Contacts', icon: 'Users', targetModule: 'crm', targetRoute: '/crm/contacts', visible: true },
      { id: 'sb_opportunities', label: 'Opportunities', icon: 'Target', targetModule: 'crm', targetRoute: '/crm', visible: true },
    ],
    actionButtons: [],
  },
  'sales:Quotation': {
    headerFields: ['customer'],
    sections: [
      { id: 'main', label: 'Quotation Details', columns: 2, visible: true, order: 0, fieldIds: ['customer', 'expirationDate', 'paymentTerms', 'pricelist'] },
    ],
    tabs: [
      { id: 'lines', label: 'Order Lines', visible: true, order: 0, fields: ['orderLines'] },
      { id: 'notes', label: 'Terms & Conditions', visible: true, order: 1, fields: ['notes'] },
    ],
    fields: [
      { id: 'customer', label: 'Customer', technicalName: 'customerId', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'expirationDate', label: 'Expiration Date', technicalName: 'expirationDate', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'paymentTerms', label: 'Payment Terms', technicalName: 'paymentTerms', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Immediate', value: 'immediate' }, { label: 'Net 15', value: 'net15' }, { label: 'Net 30', value: 'net30' }, { label: 'Net 60', value: 'net60' }] },
      { id: 'pricelist', label: 'Pricelist', technicalName: 'pricelist', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'orderLines', label: 'Order Lines', technicalName: 'lines', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'notes', label: 'Terms & Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_order', label: 'Sales Order', icon: 'ShoppingCart', targetModule: 'sales', targetRoute: '/sales/orders', visible: true },
      { id: 'sb_invoice', label: 'Invoice', icon: 'DollarSign', targetModule: 'accounting', targetRoute: '/invoicing', visible: true },
      { id: 'sb_delivery', label: 'Delivery', icon: 'Truck', targetModule: 'inventory', targetRoute: '/inventory/operations', visible: true },
    ],
    actionButtons: [
      { id: 'ab_confirm', label: 'Confirm', type: 'primary', action: 'status_change', targetStatus: 'confirmed', visible: true, position: 'header', order: 0 },
      { id: 'ab_send', label: 'Send by Email', type: 'secondary', action: 'email', visible: true, position: 'header', order: 1 },
    ],
  },
  'sales:Sales Order': {
    headerFields: ['customer'],
    sections: [
      { id: 'main', label: 'Order Details', columns: 2, visible: true, order: 0, fieldIds: ['customer', 'orderDate', 'deliveryDate', 'paymentTerms'] },
    ],
    tabs: [
      { id: 'lines', label: 'Order Lines', visible: true, order: 0, fields: ['orderLines'] },
      { id: 'notes', label: 'Notes', visible: true, order: 1, fields: ['notes'] },
    ],
    fields: [
      { id: 'customer', label: 'Customer', technicalName: 'customerId', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'orderDate', label: 'Order Date', technicalName: 'orderDate', widget: 'date', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'deliveryDate', label: 'Delivery Date', technicalName: 'deliveryDate', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'paymentTerms', label: 'Payment Terms', technicalName: 'paymentTerms', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'orderLines', label: 'Order Lines', technicalName: 'lines', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'notes', label: 'Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_invoice', label: 'Invoice', icon: 'DollarSign', targetModule: 'accounting', targetRoute: '/invoicing', visible: true },
      { id: 'sb_delivery', label: 'Delivery', icon: 'Truck', targetModule: 'inventory', targetRoute: '/inventory/operations', visible: true },
    ],
    actionButtons: [
      { id: 'ab_invoice', label: 'Create Invoice', type: 'primary', action: 'navigate', targetRoute: '/invoicing', visible: true, position: 'header', order: 0 },
      { id: 'ab_deliver', label: 'Deliver', type: 'secondary', action: 'navigate', targetRoute: '/inventory/operations', visible: true, position: 'header', order: 1 },
    ],
  },
  'sales:Customer': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'Customer Details', columns: 2, visible: true, order: 0, fieldIds: ['name', 'email', 'phone', 'website'] },
      { id: 'address', label: 'Address', columns: 2, visible: true, order: 1, fieldIds: ['street', 'city', 'state', 'zip', 'country'] },
      { id: 'billing', label: 'Billing', columns: 2, visible: true, order: 2, fieldIds: ['taxId', 'paymentTerms'] },
    ],
    tabs: [],
    fields: [
      { id: 'name', label: 'Customer Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'email', label: 'Email', technicalName: 'email', widget: 'email', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'phone', label: 'Phone', technicalName: 'phone', widget: 'phone', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'website', label: 'Website', technicalName: 'website', widget: 'url', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'street', label: 'Street', technicalName: 'street', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 2 },
      { id: 'city', label: 'City', technicalName: 'city', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'state', label: 'State', technicalName: 'state', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'zip', label: 'ZIP', technicalName: 'zip', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'country', label: 'Country', technicalName: 'country', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'taxId', label: 'Tax ID', technicalName: 'taxId', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'paymentTerms', label: 'Payment Terms', technicalName: 'paymentTerms', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [
      { id: 'sb_quotations', label: 'Quotations', icon: 'FileText', targetModule: 'sales', targetRoute: '/sales/quotations', visible: true },
      { id: 'sb_orders', label: 'Sales Orders', icon: 'ShoppingCart', targetModule: 'sales', targetRoute: '/sales/orders', visible: true },
      { id: 'sb_invoices', label: 'Invoices', icon: 'DollarSign', targetModule: 'accounting', targetRoute: '/invoicing', visible: true },
    ],
    actionButtons: [],
  },
  'inventory:Product': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'Product Information', columns: 2, visible: true, order: 0, fieldIds: ['name', 'sku', 'category', 'productType'] },
      { id: 'pricing', label: 'Pricing', columns: 2, visible: true, order: 1, fieldIds: ['cost', 'price'] },
      { id: 'physical', label: 'Physical Details', columns: 2, visible: true, order: 2, fieldIds: ['weight', 'volume'] },
    ],
    tabs: [
      { id: 'description', label: 'Description', visible: true, order: 0, fields: ['description'] },
      { id: 'inventory', label: 'Inventory', visible: true, order: 1, fields: ['trackInventory', 'reorderPoint'] },
    ],
    fields: [
      { id: 'name', label: 'Product Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'sku', label: 'SKU / Barcode', technicalName: 'sku', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'category', label: 'Category', technicalName: 'category', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'productType', label: 'Product Type', technicalName: 'productType', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Storable', value: 'storable' }, { label: 'Consumable', value: 'consumable' }, { label: 'Service', value: 'service' }] },
      { id: 'cost', label: 'Cost', technicalName: 'cost', widget: 'currency', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'price', label: 'Sales Price', technicalName: 'price', widget: 'currency', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'weight', label: 'Weight (kg)', technicalName: 'weight', widget: 'number', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'volume', label: 'Volume (m³)', technicalName: 'volume', widget: 'number', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'description', label: 'Description', technicalName: 'description', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
      { id: 'trackInventory', label: 'Track Inventory', technicalName: 'trackInventory', widget: 'checkbox', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'reorderPoint', label: 'Reorder Point', technicalName: 'reorderPoint', widget: 'number', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [
      { id: 'sb_stock', label: 'On Hand', icon: 'Package', targetModule: 'inventory', targetRoute: '/inventory/stock-dashboard', visible: true },
      { id: 'sb_moves', label: 'Stock Moves', icon: 'Truck', targetModule: 'inventory', targetRoute: '/inventory/stock-moves', visible: true },
      { id: 'sb_bom', label: 'Bill of Materials', icon: 'ClipboardList', targetModule: 'manufacturing', targetRoute: '/manufacturing/bom', visible: true },
    ],
    actionButtons: [
      { id: 'ab_reorder', label: 'Replenish', type: 'primary', action: 'navigate', targetRoute: '/inventory/reorder-rules', visible: true, position: 'header', order: 0 },
    ],
  },
  'inventory:Transfer': {
    headerFields: [],
    sections: [
      { id: 'main', label: 'Transfer Details', columns: 2, visible: true, order: 0, fieldIds: ['sourceWarehouse', 'destWarehouse', 'scheduledDate', 'operationType'] },
    ],
    tabs: [
      { id: 'products', label: 'Products', visible: true, order: 0, fields: ['products'] },
      { id: 'notes', label: 'Notes', visible: true, order: 1, fields: ['notes'] },
    ],
    fields: [
      { id: 'sourceWarehouse', label: 'Source Location', technicalName: 'sourceWarehouse', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'destWarehouse', label: 'Destination Location', technicalName: 'destWarehouse', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'scheduledDate', label: 'Scheduled Date', technicalName: 'scheduledDate', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'operationType', label: 'Operation Type', technicalName: 'operationType', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Receipt', value: 'receipt' }, { label: 'Delivery', value: 'delivery' }, { label: 'Internal', value: 'internal' }] },
      { id: 'products', label: 'Products', technicalName: 'products', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'notes', label: 'Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [],
    actionButtons: [
      { id: 'ab_validate', label: 'Validate', type: 'primary', action: 'status_change', targetStatus: 'done', visible: true, position: 'header', order: 0 },
    ],
  },
  'inventory:Inventory Adjustment': {
    headerFields: [],
    sections: [
      { id: 'main', label: 'Adjustment Details', columns: 2, visible: true, order: 0, fieldIds: ['warehouse', 'product', 'quantity', 'reason'] },
    ],
    tabs: [],
    fields: [
      { id: 'warehouse', label: 'Warehouse', technicalName: 'warehouse', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'product', label: 'Product', technicalName: 'product', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'quantity', label: 'New Quantity', technicalName: 'quantity', widget: 'number', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'reason', label: 'Reason', technicalName: 'reason', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [],
    actionButtons: [
      { id: 'ab_apply', label: 'Apply', type: 'primary', action: 'status_change', targetStatus: 'applied', visible: true, position: 'header', order: 0 },
    ],
  },
  'inventory:Warehouse': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'Warehouse Details', columns: 2, visible: true, order: 0, fieldIds: ['name', 'code', 'address', 'manager'] },
    ],
    tabs: [],
    fields: [
      { id: 'name', label: 'Warehouse Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'code', label: 'Short Code', technicalName: 'code', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'address', label: 'Address', technicalName: 'address', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 2 },
      { id: 'manager', label: 'Manager', technicalName: 'manager', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [
      { id: 'sb_products', label: 'Products', icon: 'Package', targetModule: 'inventory', targetRoute: '/inventory/products', visible: true },
    ],
    actionButtons: [],
  },
  'manufacturing:Work Order': {
    headerFields: ['product'],
    sections: [
      { id: 'main', label: 'Work Order Details', columns: 2, visible: true, order: 0, fieldIds: ['product', 'bom', 'quantity', 'workCenter', 'startDate', 'deadline'] },
    ],
    tabs: [
      { id: 'operations', label: 'Operations', visible: true, order: 0, fields: [] },
    ],
    fields: [
      { id: 'product', label: 'Product', technicalName: 'product', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'bom', label: 'Bill of Materials', technicalName: 'bom', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'quantity', label: 'Quantity', technicalName: 'quantity', widget: 'number', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'workCenter', label: 'Work Center', technicalName: 'workCenter', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'startDate', label: 'Start Date', technicalName: 'startDate', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'deadline', label: 'Deadline', technicalName: 'deadline', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [
      { id: 'sb_bom', label: 'BoM', icon: 'ClipboardList', targetModule: 'manufacturing', targetRoute: '/manufacturing/bom', visible: true },
    ],
    actionButtons: [
      { id: 'ab_start', label: 'Start Production', type: 'primary', action: 'status_change', targetStatus: 'in_progress', visible: true, position: 'header', order: 0 },
      { id: 'ab_done', label: 'Mark as Done', type: 'secondary', action: 'status_change', targetStatus: 'done', visible: true, position: 'header', order: 1 },
    ],
  },
  'manufacturing:Bill of Materials': {
    headerFields: ['product'],
    sections: [
      { id: 'main', label: 'BOM Details', columns: 2, visible: true, order: 0, fieldIds: ['product', 'quantity', 'bomType'] },
    ],
    tabs: [
      { id: 'components', label: 'Components', visible: true, order: 0, fields: ['components'] },
      { id: 'operations', label: 'Operations', visible: true, order: 1, fields: ['operations'] },
    ],
    fields: [
      { id: 'product', label: 'Product', technicalName: 'product', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'quantity', label: 'Quantity', technicalName: 'quantity', widget: 'number', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'bomType', label: 'BOM Type', technicalName: 'bomType', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Manufacture', value: 'manufacture' }, { label: 'Kit', value: 'kit' }, { label: 'Subcontracting', value: 'subcontracting' }] },
      { id: 'components', label: 'Components', technicalName: 'components', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'operations', label: 'Operations', technicalName: 'operations', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_wo', label: 'Work Orders', icon: 'Factory', targetModule: 'manufacturing', targetRoute: '/manufacturing/work-orders', visible: true },
    ],
    actionButtons: [],
  },
  'manufacturing:Work Center': {
    headerFields: ['name'],
    sections: [
      { id: 'main', label: 'Work Center Details', columns: 2, visible: true, order: 0, fieldIds: ['name', 'code', 'capacity', 'costPerHour'] },
    ],
    tabs: [],
    fields: [
      { id: 'name', label: 'Work Center Name', technicalName: 'name', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'code', label: 'Code', technicalName: 'code', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'capacity', label: 'Capacity', technicalName: 'capacity', widget: 'number', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'costPerHour', label: 'Cost per Hour', technicalName: 'costPerHour', widget: 'currency', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [],
    actionButtons: [],
  },
  'accounting:Invoice': {
    headerFields: ['customer'],
    sections: [
      { id: 'main', label: 'Invoice Details', columns: 2, visible: true, order: 0, fieldIds: ['customer', 'invoiceDate', 'dueDate', 'paymentTerms'] },
    ],
    tabs: [
      { id: 'lines', label: 'Invoice Lines', visible: true, order: 0, fields: ['lines'] },
      { id: 'notes', label: 'Notes', visible: true, order: 1, fields: ['notes'] },
    ],
    fields: [
      { id: 'customer', label: 'Customer', technicalName: 'customerId', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'invoiceDate', label: 'Invoice Date', technicalName: 'invoiceDate', widget: 'date', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'dueDate', label: 'Due Date', technicalName: 'dueDate', widget: 'date', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'paymentTerms', label: 'Payment Terms', technicalName: 'paymentTerms', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'lines', label: 'Invoice Lines', technicalName: 'lines', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
      { id: 'notes', label: 'Notes', technicalName: 'notes', widget: 'textarea', required: false, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [
      { id: 'sb_payment', label: 'Payments', icon: 'DollarSign', targetModule: 'accounting', targetRoute: '/accounting/payments', visible: true },
      { id: 'sb_order', label: 'Sales Order', icon: 'ShoppingCart', targetModule: 'sales', targetRoute: '/sales/orders', visible: true },
    ],
    actionButtons: [
      { id: 'ab_confirm', label: 'Confirm', type: 'primary', action: 'status_change', targetStatus: 'posted', visible: true, position: 'header', order: 0 },
      { id: 'ab_payment', label: 'Register Payment', type: 'secondary', action: 'navigate', targetRoute: '/accounting/payments', visible: true, position: 'header', order: 1 },
    ],
  },
  'accounting:Payment': {
    headerFields: [],
    sections: [
      { id: 'main', label: 'Payment Details', columns: 2, visible: true, order: 0, fieldIds: ['partner', 'amount', 'date', 'method', 'reference'] },
    ],
    tabs: [],
    fields: [
      { id: 'partner', label: 'Partner', technicalName: 'partner', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'amount', label: 'Amount', technicalName: 'amount', widget: 'currency', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'date', label: 'Payment Date', technicalName: 'date', widget: 'date', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'method', label: 'Payment Method', technicalName: 'method', widget: 'select', required: false, visible: true, readOnly: false, colSpan: 1, options: [{ label: 'Bank Transfer', value: 'bank' }, { label: 'Cash', value: 'cash' }, { label: 'Check', value: 'check' }, { label: 'Credit Card', value: 'card' }] },
      { id: 'reference', label: 'Reference', technicalName: 'reference', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
    ],
    smartButtons: [
      { id: 'sb_invoice', label: 'Invoice', icon: 'FileText', targetModule: 'accounting', targetRoute: '/invoicing', visible: true },
    ],
    actionButtons: [
      { id: 'ab_confirm', label: 'Confirm', type: 'primary', action: 'status_change', targetStatus: 'posted', visible: true, position: 'header', order: 0 },
    ],
  },
  'accounting:Journal Entry': {
    headerFields: [],
    sections: [
      { id: 'main', label: 'Entry Details', columns: 2, visible: true, order: 0, fieldIds: ['date', 'journal', 'reference'] },
    ],
    tabs: [
      { id: 'lines', label: 'Journal Items', visible: true, order: 0, fields: ['lines'] },
    ],
    fields: [
      { id: 'date', label: 'Date', technicalName: 'date', widget: 'date', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'journal', label: 'Journal', technicalName: 'journal', widget: 'select', required: true, visible: true, readOnly: false, colSpan: 1 },
      { id: 'reference', label: 'Reference', technicalName: 'reference', widget: 'text', required: false, visible: true, readOnly: false, colSpan: 1 },
      { id: 'lines', label: 'Journal Items', technicalName: 'lines', widget: 'text', required: true, visible: true, readOnly: false, colSpan: 2 },
    ],
    smartButtons: [],
    actionButtons: [
      { id: 'ab_post', label: 'Post', type: 'primary', action: 'status_change', targetStatus: 'posted', visible: true, position: 'header', order: 0 },
    ],
  },
};
