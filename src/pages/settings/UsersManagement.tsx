import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search, Plus, MoreHorizontal, Shield, Key, Mail, UserCog, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { setUserRoles, type Role } from '@/lib/services/settings';
import { useRoles } from '@/hooks/settings';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { toast } from 'sonner';

interface AppUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until?: string | null;
  roles: { id: string; name: string }[];
}

async function fetchAppUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase.functions.invoke('list-app-users', { method: 'GET' });
  if (error) throw error;
  const list = (data as any)?.users;
  if (!Array.isArray(list)) throw new Error('Unexpected response from list-app-users');
  return list as AppUser[];
}

export default function UsersManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: rolesData } = useRoles();
  const roles: Role[] = rolesData ?? [];

  const usersQuery = useQuery({
    queryKey: ['settings', 'app-users'],
    queryFn: fetchAppUsers,
  });

  useEffect(() => {
    if (usersQuery.error) {
      toast.error('Failed to load users', {
        description: (usersQuery.error as Error).message,
      });
    }
  }, [usersQuery.error]);

  const users = usersQuery.data ?? [];
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleManageRoles = (user: AppUser) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles.map((r) => r.id));
    setIsRoleDialogOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    setSavingRoles(true);
    try {
      await setUserRoles(selectedUser.user_id, selectedRoleIds);
      toast.success(`Roles updated for ${selectedUser.email}`);
      setIsRoleDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ['settings', 'app-users'] });
      await qc.invalidateQueries({ queryKey: ['settings', 'user-role-assignments'] });
    } catch (e: any) {
      toast.error('Failed to save roles', {
        description: e?.message ?? 'Unknown error',
      });
    } finally {
      setSavingRoles(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const createUser = useMutation({
    mutationFn: async (vars: { email: string; full_name: string }) => {
      const { data, error } = await supabase.functions.invoke('create-employee-with-login', {
        body: {
          employee_data: { email: vars.email, full_name: vars.full_name },
        },
      });
      if (error) throw error;
      return data as { login_email: string; temporary_password: string };
    },
    onSuccess: async (res) => {
      toast.success(`User created: ${res.login_email}`, {
        description: `Temporary password: ${res.temporary_password}`,
      });
      setIsAddDialogOpen(false);
      setNewEmail('');
      setNewName('');
      await qc.invalidateQueries({ queryKey: ['settings', 'app-users'] });
    },
    onError: (e: any) =>
      toast.error('Failed to create user', { description: e?.message ?? 'Unknown error' }),
  });

  const handleCreate = async () => {
    const email = newEmail.trim();
    const name = newName.trim();
    if (!email || !name) {
      toast.error('Email and name are required');
      return;
    }
    setCreating(true);
    try {
      await createUser.mutateAsync({ email, full_name: name });
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (user: AppUser) => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      toast.error('Failed to send reset email', { description: error.message });
    } else {
      toast.success(`Reset email sent to ${user.email}`);
    }
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h1 className="text-lg font-medium text-foreground">Users</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Manage user accounts and role assignments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder=""
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1 shrink-0">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add User</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Creates an auth login + employee record. A temporary password will be shown once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Full Name</Label>
                    <Input
                      id="new-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? 'Creating…' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Last Sign-in</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Loading users…
                  </TableCell>
                </TableRow>
              )}
              {!usersQuery.isLoading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map((user, index) => (
                <TableRow
                  key={user.user_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.email[0] ?? '?').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.email.split('@')[0]}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-xs">
                          {r.name}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleManageRoles(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <Key className="mr-2 h-4 w-4" />
                          Send Reset Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            toast.info('Deactivation must be done from Supabase dashboard for now')
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Manage Roles — {selectedUser?.email}</DialogTitle>
              <DialogDescription>
                Select the roles to assign. Permissions are the union of all assigned roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4 max-h-64 overflow-y-auto">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`assign-role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`assign-role-${role.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {role.name}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  </div>
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs shrink-0">System</Badge>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoles} disabled={savingRoles}>
                {savingRoles ? 'Saving…' : 'Save Roles'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}