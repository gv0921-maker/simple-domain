// Hook for checking tab-level permissions
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasTabAccess, getAccessibleTabs } from '@/lib/data/rbac';
import { getModuleTabs, type ModuleTab } from '@/lib/data/moduleTabs';

interface TabPermissions {
  hasAccess: (tabId: string) => boolean;
  accessibleTabs: string[];
  getFilteredNav: () => ModuleTab[];
}

export function useTabPermissions(moduleId: string): TabPermissions {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        hasAccess: () => false,
        accessibleTabs: [],
        getFilteredNav: () => [],
      };
    }

    const accessibleTabs = getAccessibleTabs(user.id, moduleId);
    const allTabs = getModuleTabs(moduleId);

    return {
      hasAccess: (tabId: string) => hasTabAccess(user.id, moduleId, tabId),
      accessibleTabs,
      getFilteredNav: () => allTabs.filter((tab) => accessibleTabs.includes(tab.id)),
    };
  }, [user, moduleId]);

  return permissions;
}

// Helper to convert module tabs to navigation format
export function useModuleNav(moduleId: string): { label: string; href: string }[] {
  const { getFilteredNav } = useTabPermissions(moduleId);
  
  return useMemo(() => {
    return getFilteredNav().map((tab) => ({
      label: tab.label,
      href: tab.href,
    }));
  }, [getFilteredNav]);
}
