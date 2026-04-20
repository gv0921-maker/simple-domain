// Field-level masking based on user role / permission level
// Sensitive fields (email, phone, expectedRevenue) are masked for users with view-only or restricted access.
import { getUserPermissions, isSuperAdminUser } from '@/lib/data/rbac';

export type SensitiveField = 'email' | 'phone' | 'revenue';

/**
 * Returns true if the given user can SEE the unmasked value of a sensitive field
 * for the given module. Rules:
 *  - Super admins always see everything.
 *  - Users with edit/delete/admin level on the module see everything.
 *  - Users with view/create level get masked values.
 */
export function canViewSensitive(userId: string | undefined, module: string, _field: SensitiveField): boolean {
  if (!userId) return false;
  if (isSuperAdminUser(userId)) return true;
  const perms = getUserPermissions(userId);
  const mp = perms.find(p => p.module === module);
  if (!mp) return false;
  // edit, delete, admin = full visibility
  return mp.level === 'edit' || mp.level === 'delete' || mp.level === 'admin';
}

export function maskEmail(email?: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '••••••';
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  return `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function maskRevenue(value?: number): string {
  if (value === undefined || value === null) return '—';
  // Show order of magnitude only
  if (value === 0) return '₹0';
  if (value < 1000) return '< ₹1k';
  if (value < 100000) return `~ ₹${Math.round(value / 1000)}k`;
  if (value < 10000000) return `~ ₹${(value / 100000).toFixed(1)} L`;
  return `~ ₹${(value / 10000000).toFixed(1)} Cr`;
}

/**
 * Apply masking to a CRM-like object based on the current user's permission.
 */
export function maskRecord<T extends { email?: string; phone?: string; expectedRevenue?: number }>(
  record: T,
  userId: string | undefined,
  module: string = 'crm'
): T & { _masked?: boolean } {
  const showEmail = canViewSensitive(userId, module, 'email');
  const showPhone = canViewSensitive(userId, module, 'phone');
  const showRevenue = canViewSensitive(userId, module, 'revenue');
  if (showEmail && showPhone && showRevenue) return record;
  return {
    ...record,
    email: showEmail ? record.email : (record.email ? maskEmail(record.email) : record.email),
    phone: showPhone ? record.phone : (record.phone ? maskPhone(record.phone) : record.phone),
    // Revenue stays numeric but flagged; UI can use displayRevenue helper if needed
    _masked: !showRevenue,
  } as T & { _masked?: boolean };
}

export function displayRevenue(value: number | undefined, userId: string | undefined, module: string = 'crm'): string {
  if (canViewSensitive(userId, module, 'revenue')) {
    return value !== undefined ? `₹${value.toLocaleString('en-IN')}` : '—';
  }
  return maskRevenue(value);
}
