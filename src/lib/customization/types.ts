// Customization types for admin settings panel

import { LucideIcon } from 'lucide-react';

// Available Lucide icons for module customization
export const AVAILABLE_ICONS = [
  'MessageSquare', 'LayoutDashboard', 'Package', 'Factory', 'Smartphone',
  'Barcode', 'Layers', 'Users', 'Grid3X3', 'Settings', 'ShoppingCart',
  'FileText', 'DollarSign', 'Wrench', 'CalendarDays', 'HelpCircle',
  'Mail', 'Globe', 'Home', 'Heart', 'Star', 'Zap', 'Shield', 'Briefcase',
  'Building', 'Truck', 'Box', 'Archive', 'Database', 'Server', 'Cloud',
  'Cpu', 'Monitor', 'Printer', 'Phone', 'Tablet', 'Watch', 'Camera',
  'Video', 'Music', 'Image', 'File', 'Folder', 'Clipboard', 'Book',
  'Bookmark', 'Flag', 'Tag', 'Award', 'Trophy', 'Target', 'Activity',
] as const;

export type IconName = typeof AVAILABLE_ICONS[number];

// Preset color palettes
export const COLOR_PRESETS = [
  { name: 'Orange', bg: '#fff5eb', color: '#f97316' },
  { name: 'Green', bg: '#f0fdf4', color: '#22c55e' },
  { name: 'Yellow', bg: '#fef3c7', color: '#f59e0b' },
  { name: 'Purple', bg: '#fae8ff', color: '#a855f7' },
  { name: 'Sky', bg: '#e0f2fe', color: '#0ea5e9' },
  { name: 'Pink', bg: '#fce7f3', color: '#ec4899' },
  { name: 'Blue', bg: '#dbeafe', color: '#3b82f6' },
  { name: 'Amber', bg: '#fef9c3', color: '#eab308' },
  { name: 'Cyan', bg: '#ecfeff', color: '#06b6d4' },
  { name: 'Rose', bg: '#fee2e2', color: '#dc2626' },
  { name: 'Indigo', bg: '#e0e7ff', color: '#6366f1' },
  { name: 'Teal', bg: '#ccfbf1', color: '#14b8a6' },
] as const;

// Module customization
export interface ModuleConfig {
  id: string;
  name: string;
  description?: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  href: string;
  visible: boolean;
  order: number;
}

// Form field customization
export interface FieldConfig {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  order: number;
}

// Form customization (grouped by module/form)
export interface FormConfig {
  id: string;
  moduleId: string;
  formName: string;
  fields: FieldConfig[];
}

// Theme customization (extends the existing theme)
export interface ThemeConfig {
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  accentHue: number;
  accentSaturation: number;
  accentLightness: number;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontFamily: 'system' | 'inter' | 'roboto' | 'poppins';
}

// Complete customization state
export interface CustomizationState {
  modules: ModuleConfig[];
  forms: FormConfig[];
  theme: ThemeConfig;
}

// Default module configurations
export const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'crm', name: 'CRM', description: 'Track leads and close opportunities', icon: 'Target', iconBg: '#e8f5e9', iconColor: '#00897b', href: '/crm', visible: true, order: 0 },
  { id: 'sales', name: 'Sales', description: 'From quotations to invoices', icon: 'ShoppingCart', iconBg: '#fff3e0', iconColor: '#ff7043', href: '/sales', visible: true, order: 1 },
  { id: 'inventory', name: 'Inventory', description: 'Manage your stock and logistics', icon: 'Package', iconBg: '#fce4ec', iconColor: '#ad1457', href: '/inventory', visible: true, order: 2 },
  { id: 'manufacturing', name: 'Manufacturing', description: 'Manufacturing Orders & BOMs', icon: 'Factory', iconBg: '#e3f2fd', iconColor: '#1976d2', href: '/manufacturing', visible: true, order: 3 },
  { id: 'plm', name: 'PLM', description: 'Product Lifecycle Management', icon: 'Layers', iconBg: '#f3e5f5', iconColor: '#7b1fa2', href: '/plm', visible: true, order: 4 },
  { id: 'accounting', name: 'Accounting', description: 'Manage financial and analytic accounting', icon: 'DollarSign', iconBg: '#e0f7fa', iconColor: '#00838f', href: '/accounting', visible: true, order: 5 },
  { id: 'employees', name: 'Employees', description: 'Centralize employee information', icon: 'Users', iconBg: '#fff8e1', iconColor: '#ff8f00', href: '/employees', visible: true, order: 6 },
  { id: 'discuss', name: 'Discuss', description: 'Chat and private channels', icon: 'MessageSquare', iconBg: '#fff5eb', iconColor: '#f97316', href: '/discuss', visible: true, order: 7 },
  { id: 'dashboards', name: 'Dashboards', description: 'View reports and analytics', icon: 'LayoutDashboard', iconBg: '#f0fdf4', iconColor: '#22c55e', href: '/dashboards', visible: true, order: 8 },
  { id: 'settings', name: 'Settings', description: 'Configure your system', icon: 'Settings', iconBg: '#f5f5f5', iconColor: '#616161', href: '/settings', visible: true, order: 9 },
  { id: 'shop-floor', name: 'Shop Floor', description: 'Track shop floor operations', icon: 'Smartphone', iconBg: '#e0f2fe', iconColor: '#0ea5e9', href: '/shop-floor', visible: true, order: 10 },
  { id: 'barcode', name: 'Barcode', description: 'Scan and manage products', icon: 'Barcode', iconBg: '#fce7f3', iconColor: '#ec4899', href: '/barcode', visible: true, order: 11 },
  { id: 'apps', name: 'Apps', description: 'Browse available applications', icon: 'Grid3X3', iconBg: '#ecfeff', iconColor: '#06b6d4', href: '/apps', visible: true, order: 12 },
  { id: 'invoicing', name: 'Invoicing', description: 'Invoices & Payments', icon: 'FileText', iconBg: '#e0e7ff', iconColor: '#6366f1', href: '/invoicing', visible: true, order: 13 },
  { id: 'maintenance', name: 'Maintenance', description: 'Track equipment and requests', icon: 'Wrench', iconBg: '#fee2e2', iconColor: '#dc2626', href: '/maintenance', visible: true, order: 14 },
  { id: 'calendar', name: 'Calendar', description: 'Manage your schedule', icon: 'CalendarDays', iconBg: '#f3e8ff', iconColor: '#9333ea', href: '/calendar', visible: true, order: 15 },
  { id: 'helpdesk', name: 'Helpdesk', description: 'Track and solve customer tickets', icon: 'HelpCircle', iconBg: '#cffafe', iconColor: '#0891b2', href: '/helpdesk', visible: true, order: 16 },
  { id: 'email-marketing', name: 'Email Marketing', description: 'Design, send and track emails', icon: 'Mail', iconBg: '#fce7f3', iconColor: '#db2777', href: '/email-marketing', visible: true, order: 17 },
  { id: 'website', name: 'Website', description: 'Enterprise website builder', icon: 'Globe', iconBg: '#dbeafe', iconColor: '#2563eb', href: '/website', visible: true, order: 18 },
];

// Default theme configuration
export const DEFAULT_THEME: ThemeConfig = {
  primaryHue: 340,
  primarySaturation: 25,
  primaryLightness: 40,
  accentHue: 174,
  accentSaturation: 60,
  accentLightness: 45,
  borderRadius: 'md',
  fontFamily: 'system',
};

// Default customization state
export const DEFAULT_CUSTOMIZATION: CustomizationState = {
  modules: DEFAULT_MODULES,
  forms: [],
  theme: DEFAULT_THEME,
};
