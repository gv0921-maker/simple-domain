// CRM Permission Hook - Demo RBAC for CRM module
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  hasPermission,
  hasModulePermission,
  getModuleRecordScope,
  type RecordScope,
} from '@/lib/data/rbac';

export type CRMAction = 
  | 'view_crm'
  | 'create_contacts'
  | 'edit_contacts'
  | 'delete_contacts'
  | 'create_leads'
  | 'edit_leads'
  | 'delete_leads'
  | 'convert_leads'
  | 'create_opportunities'
  | 'edit_opportunities'
  | 'delete_opportunities'
  | 'modify_pipeline'
  | 'view_analytics'
  | 'export_data'
  | 'import_data';

interface CRMPermissions {
  canViewCRM: boolean;
  canCreateContacts: boolean;
  canEditContacts: boolean;
  canDeleteContacts: boolean;
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canConvertLeads: boolean;
  canCreateOpportunities: boolean;
  canEditOpportunities: boolean;
  canDeleteOpportunities: boolean;
  canModifyPipeline: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canImportData: boolean;
  recordScope: RecordScope | 'none';
  can: (action: CRMAction) => boolean;
  filterByScope: <T extends { assignedTo?: string; createdBy?: string }>(records: T[]) => T[];
}

export function useCRMPermissions(): CRMPermissions {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    if (!user) {
      return {
        canViewCRM: false,
        canCreateContacts: false,
        canEditContacts: false,
        canDeleteContacts: false,
        canCreateLeads: false,
        canEditLeads: false,
        canDeleteLeads: false,
        canConvertLeads: false,
        canCreateOpportunities: false,
        canEditOpportunities: false,
        canDeleteOpportunities: false,
        canModifyPipeline: false,
        canViewAnalytics: false,
        canExportData: false,
        canImportData: false,
        recordScope: 'none' as const,
        can: () => false,
        filterByScope: <T,>() => [] as T[],
      };
    }
    
    const canView = hasPermission(user.id, 'crm', 'view');
    const canCreate = hasPermission(user.id, 'crm', 'create');
    const canEdit = hasPermission(user.id, 'crm', 'edit');
    const canDelete = hasPermission(user.id, 'crm', 'delete');
    const isAdmin = hasPermission(user.id, 'crm', 'admin');
    const canExport = hasModulePermission(user.id, 'crm', 'export');
    const canImport = hasModulePermission(user.id, 'crm', 'import');
    
    const recordScope = getModuleRecordScope(user.id, 'crm');
    
    const can = (action: CRMAction): boolean => {
      switch (action) {
        case 'view_crm':
          return canView;
        case 'create_contacts':
        case 'create_leads':
        case 'create_opportunities':
          return canCreate;
        case 'edit_contacts':
        case 'edit_leads':
        case 'edit_opportunities':
          return canEdit;
        case 'delete_contacts':
        case 'delete_leads':
        case 'delete_opportunities':
          return canDelete;
        case 'convert_leads':
          return canEdit;
        case 'modify_pipeline':
          return isAdmin;
        case 'view_analytics':
          return canView;
        case 'export_data':
          return canExport;
        case 'import_data':
          return canImport;
        default:
          return false;
      }
    };

    const filterByScope = <T extends { assignedTo?: string; createdBy?: string }>(records: T[]): T[] => {
      if (recordScope === 'none') return [];
      if (recordScope === 'all') return records;
      // 'own' — filter to records assigned to or created by current user
      return records.filter(r => 
        r.assignedTo === user.name || 
        r.createdBy === user.name || 
        r.assignedTo === user.id ||
        r.createdBy === user.id
      );
    };
    
    return {
      canViewCRM: canView,
      canCreateContacts: canCreate,
      canEditContacts: canEdit,
      canDeleteContacts: canDelete,
      canCreateLeads: canCreate,
      canEditLeads: canEdit,
      canDeleteLeads: canDelete,
      canConvertLeads: canEdit,
      canCreateOpportunities: canCreate,
      canEditOpportunities: canEdit,
      canDeleteOpportunities: canDelete,
      canModifyPipeline: isAdmin,
      canViewAnalytics: canView,
      canExportData: canExport,
      canImportData: canImport,
      recordScope,
      can,
      filterByScope,
    };
  }, [user]);
  
  return permissions;
}

// Helper to check if user can access a specific record
export function useCanAccessRecord(
  ownerId?: string,
  teamId?: string
): boolean {
  const { user } = useAuth();
  const { recordScope } = useCRMPermissions();
  
  if (!user) return false;
  
  switch (recordScope) {
    case 'all':
      return true;
    case 'department':
      return true;
    case 'own':
      return ownerId === user.id || ownerId === user.name || !ownerId;
    case 'none':
      return false;
    default:
      return false;
  }
}
