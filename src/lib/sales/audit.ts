import { addAuditLog, getAuditLogs } from '@/lib/data/rbac';
import { getAuthState } from '@/lib/storage';

export type SalesResource = 'quotation' | 'order' | 'subscription' | 'pricelist' | 'tax_rule';

function currentUser() {
  const auth = getAuthState();
  return { userId: auth.user?.id || 'system', userName: auth.user?.name || 'System' };
}

export function logSales(action: 'create' | 'update' | 'delete', resource: SalesResource, resourceId: string, details: string) {
  const { userId, userName } = currentUser();
  addAuditLog({ userId, userName, action, resource: `sales.${resource}`, resourceId, details });
}

export { getAuditLogs };

export function getSalesAuditLogs() {
  return getAuditLogs().filter((l) => l.resource.startsWith('sales.'));
}