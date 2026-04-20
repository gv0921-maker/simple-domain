// CRM-specific audit helper - wraps addAuditLog with current user context
import { addAuditLog, getAuditLogs } from '@/lib/data/rbac';
import { getAuthState } from '@/lib/storage';

export type CRMAuditAction = 'create' | 'update' | 'delete';
export type CRMResource = 'contact' | 'company' | 'lead' | 'opportunity' | 'activity' | 'note' | 'pipeline';

function currentUser() {
  const auth = getAuthState();
  return {
    userId: auth.user?.id || 'system',
    userName: auth.user?.name || 'System',
  };
}

export function logCRM(action: CRMAuditAction, resource: CRMResource, resourceId: string, details: string) {
  const { userId, userName } = currentUser();
  addAuditLog({
    userId,
    userName,
    action,
    resource: `crm.${resource}`,
    resourceId,
    details,
  });
}

// Re-export for convenience
export { getAuditLogs };

// Get only CRM audit logs
export function getCRMAuditLogs() {
  return getAuditLogs().filter(l => l.resource.startsWith('crm.'));
}
