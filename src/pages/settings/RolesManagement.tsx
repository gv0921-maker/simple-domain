import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Plus,
  Shield,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  LayoutGrid,
} from 'lucide-react';
import { 
  getRoles, 
  saveRole,
  MODULES, 
  type Role, 
  type PermissionLevel, 
  type TabPermission,
} from '@/lib/data/rbac';
import { MODULE_TABS, getModuleTabIds } from '@/lib/data/moduleTabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const SETTINGS_NAV = [
  { label: 'General', href: '/settings' },
  { label: 'Users', href: '/settings/users' },
  { label: 'Roles', href: '/settings/roles' },
  { label: 'Audit Logs', href: '/settings/audit' },
  { label: 'Backups', href: '/settings/backups' },
];

const PERMISSION_LEVELS: { id: PermissionLevel; label: string; color: string }[] = [
  { id: 'none', label: 'None', color: 'text-muted-foreground' },
  { id: 'view', label: 'View', color: 'text-info' },
  { id: 'create', label: 'Create', color: 'text-accent' },
  { id: 'edit', label: 'Edit', color: 'text-warning' },
  { id: 'delete', label: 'Delete', color: 'text-destructive' },
  { id: 'admin', label: 'Admin', color: 'text-success' },
];

export default function RolesManagement() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(() => getRoles());
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingTabPermissions, setEditingTabPermissions] = useState<TabPermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const getPermissionLevel = (role: Role, module: string): PermissionLevel => {
    const permission = role.permissions.find((p) => p.module === module);
    return permission?.level || 'none';
  };

  const toggleModuleExpand = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Initialize tab permissions when role is selected
  useEffect(() => {
    if (selectedRole) {
      setEditingTabPermissions(selectedRole.tabPermissions || []);
      setHasChanges(false);
    }
  }, [selectedRole]);

  const getTabPermission = (moduleId: string): TabPermission | undefined => {
    return editingTabPermissions.find((tp) => tp.moduleId === moduleId);
  };

  const isTabAllowed = (moduleId: string, tabId: string): boolean => {
    const perm = getTabPermission(moduleId);
    // If no permission set or empty array, all tabs are allowed
    if (!perm || perm.allowedTabs.length === 0) {
      // Check if module is admin - admin gets all tabs
      const moduleLevel = selectedRole ? getPermissionLevel(selectedRole, moduleId) : 'none';
      return moduleLevel === 'admin' || !perm;
    }
    return perm.allowedTabs.includes(tabId);
  };

  const toggleTabPermission = (moduleId: string, tabId: string) => {
    const allTabs = getModuleTabIds(moduleId);
    let newPermissions = [...editingTabPermissions];
    const existingIdx = newPermissions.findIndex((tp) => tp.moduleId === moduleId);

    if (existingIdx >= 0) {
      const currentPerm = newPermissions[existingIdx];
      let allowedTabs = [...currentPerm.allowedTabs];

      // If currently empty (all allowed), initialize with all except the toggled one
      if (allowedTabs.length === 0) {
        allowedTabs = allTabs.filter((t) => t !== tabId);
      } else if (allowedTabs.includes(tabId)) {
        // Remove tab
        allowedTabs = allowedTabs.filter((t) => t !== tabId);
      } else {
        // Add tab
        allowedTabs.push(tabId);
      }

      // If all tabs are allowed, clear the array (means all allowed)
      if (allowedTabs.length === allTabs.length) {
        allowedTabs = [];
      }

      newPermissions[existingIdx] = { ...currentPerm, allowedTabs };
    } else {
      // Create new permission with all tabs except toggled one
      newPermissions.push({
        moduleId,
        allowedTabs: allTabs.filter((t) => t !== tabId),
      });
    }

    setEditingTabPermissions(newPermissions);
    setHasChanges(true);
  };

  const toggleAllTabs = (moduleId: string, allow: boolean) => {
    const allTabs = getModuleTabIds(moduleId);
    let newPermissions = [...editingTabPermissions];
    const existingIdx = newPermissions.findIndex((tp) => tp.moduleId === moduleId);

    if (allow) {
      // Allow all - set empty array or remove permission
      if (existingIdx >= 0) {
        newPermissions[existingIdx] = { moduleId, allowedTabs: [] };
      }
    } else {
      // Deny all
      if (existingIdx >= 0) {
        newPermissions[existingIdx] = { moduleId, allowedTabs: [] }; // Empty = admin only
      } else {
        newPermissions.push({ moduleId, allowedTabs: [] });
      }
    }

    setEditingTabPermissions(newPermissions);
    setHasChanges(true);
  };

  const saveTabPermissions = () => {
    if (!selectedRole) return;

    const updatedRole: Role = {
      ...selectedRole,
      tabPermissions: editingTabPermissions,
    };

    saveRole(updatedRole);
    setRoles(getRoles());
    setSelectedRole(updatedRole);
    setHasChanges(false);
    toast({ title: 'Tab permissions saved' });
  };

  const getModulesWithAccess = () => {
    if (!selectedRole) return [];
    return MODULES.filter((m) => getPermissionLevel(selectedRole, m) !== 'none');
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-medium text-foreground">Roles & Permissions</h1>
              <p className="text-sm text-muted-foreground">
                Manage access control for your organization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles list */}
          <div className="lg:col-span-1 space-y-2">
            {filteredRoles.map((role, index) => (
              <Card
                key={role.id}
                className={cn(
                  'p-4 cursor-pointer transition-all duration-150 animate-fade-in',
                  selectedRole?.id === role.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{role.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs">System</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {role.permissions.filter((p) => p.level !== 'none').length} modules
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Permission matrix */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <Card className="animate-fade-in">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-foreground">{selectedRole.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button variant="outline" size="sm" className="gap-1 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="modules" className="w-full">
                  <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="modules">Module Permissions</TabsTrigger>
                      <TabsTrigger value="tabs">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Tab Access
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="modules" className="p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Permission Matrix</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Module</TableHead>
                            <TableHead className="text-center">View</TableHead>
                            <TableHead className="text-center">Create</TableHead>
                            <TableHead className="text-center">Edit</TableHead>
                            <TableHead className="text-center">Delete</TableHead>
                            <TableHead className="text-center">Admin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {MODULES.map((module) => {
                            const level = getPermissionLevel(selectedRole, module);
                            const levelWeight = PERMISSION_LEVELS.findIndex((p) => p.id === level);

                            return (
                              <TableRow key={module}>
                                <TableCell className="font-medium capitalize">{module}</TableCell>
                                {['view', 'create', 'edit', 'delete', 'admin'].map((perm, idx) => (
                                  <TableCell key={perm} className="text-center">
                                    {levelWeight >= idx + 1 ? (
                                      <Check className="h-4 w-4 text-success mx-auto" />
                                    ) : (
                                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="tabs" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Tab Access Control</h3>
                        <p className="text-xs text-muted-foreground">
                          Control which tabs are visible within each module
                        </p>
                      </div>
                      {hasChanges && (
                        <Button size="sm" onClick={saveTabPermissions}>
                          Save Changes
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {getModulesWithAccess().length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          This role has no module access. Enable module permissions first.
                        </p>
                      ) : (
                        MODULE_TABS.filter((m) => 
                          getPermissionLevel(selectedRole, m.moduleId) !== 'none'
                        ).map((moduleConfig) => {
                          const isExpanded = expandedModules.has(moduleConfig.moduleId);
                          const moduleLevel = getPermissionLevel(selectedRole, moduleConfig.moduleId);
                          const isAdmin = moduleLevel === 'admin';
                          const tabPerm = getTabPermission(moduleConfig.moduleId);
                          const allowedCount = tabPerm?.allowedTabs.length || 0;
                          const totalTabs = moduleConfig.tabs.length;
                          const allAllowed = !tabPerm || tabPerm.allowedTabs.length === 0;

                          return (
                            <Collapsible
                              key={moduleConfig.moduleId}
                              open={isExpanded}
                              onOpenChange={() => toggleModuleExpand(moduleConfig.moduleId)}
                            >
                              <Card className="overflow-hidden">
                                <CollapsibleTrigger className="w-full">
                                  <div className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="font-medium">{moduleConfig.moduleName}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {moduleLevel}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isAdmin ? (
                                        <Badge className="bg-success/20 text-success text-xs">
                                          All tabs (Admin)
                                        </Badge>
                                      ) : allAllowed ? (
                                        <Badge variant="outline" className="text-xs">
                                          {totalTabs}/{totalTabs} tabs
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          {allowedCount}/{totalTabs} tabs
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-3 pt-0 border-t border-border">
                                    {isAdmin ? (
                                      <p className="text-xs text-muted-foreground py-2">
                                        Admin roles have access to all tabs automatically.
                                      </p>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2 mb-3 pt-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleAllTabs(moduleConfig.moduleId, true);
                                            }}
                                          >
                                            Allow All
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleAllTabs(moduleConfig.moduleId, false);
                                            }}
                                          >
                                            Deny All
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                          {moduleConfig.tabs.map((tab) => {
                                            const allowed = isTabAllowed(moduleConfig.moduleId, tab.id);
                                            return (
                                              <div
                                                key={tab.id}
                                                className={cn(
                                                  'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                                                  allowed
                                                    ? 'bg-success/5 border-success/30'
                                                    : 'bg-muted/50 border-border'
                                                )}
                                                onClick={() => toggleTabPermission(moduleConfig.moduleId, tab.id)}
                                              >
                                                <Checkbox
                                                  checked={allowed}
                                                  onCheckedChange={() => toggleTabPermission(moduleConfig.moduleId, tab.id)}
                                                />
                                                <span className="text-sm">{tab.label}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">Select a Role</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on a role to view and edit its permissions
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
