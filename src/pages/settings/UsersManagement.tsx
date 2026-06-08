import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Key,
  Mail,
  UserCog,
} from 'lucide-react';
import { DEMO_USERS, type User } from '@/lib/storage';
import { getRoles, getUserRole, setUserRoles, type Role } from '@/lib/services/settings';
import { useRoles, useUserRoleAssignments } from '@/hooks/settings';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { useToast } from '@/hooks/use-toast';

export default function UsersManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [inactiveUserIds, setInactiveUserIds] = useState<string[]>([]);
  const { data: fetchedRoles } = useRoles();
  const { data: fetchedAssignments } = useUserRoleAssignments();
  const [roles, setRoles] = useState<Role[]>(() => getRoles());

  useEffect(() => {
    if (fetchedRoles) setRoles(fetchedRoles);
  }, [fetchedRoles]);
  // The fetchedAssignments query keeps the rbac cache in sync via the hook layer,
  // so getUserRole(...) below reads up-to-date data.
  useEffect(() => { /* assignments side-effect — cache hydration handled by bootstrap */ }, [fetchedAssignments]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getUserRoleNames = (userId: string): string[] => {
    const userRole = getUserRole(userId);
    if (!userRole) return [];
    return userRole.roleIds
      .map((id) => roles.find((r) => r.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    const existingRole = getUserRole(user.id);
    setSelectedRoleIds(existingRole?.roleIds || []);
    setIsRoleDialogOpen(true);
  };

  const handleSaveRoles = () => {
    if (!selectedUser) return;
    setUserRoles(selectedUser.id, selectedRoleIds);
    setRoles(getRoles()); // refresh
    setIsRoleDialogOpen(false);
    toast({ title: `Roles updated for ${selectedUser.name}` });
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleEditUser = (user: User) => {
    setActionUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!actionUser) return;

    const name = editName.trim();
    const email = editEmail.trim();

    if (!name || !email) {
      toast({
        title: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === actionUser.id
          ? {
              ...user,
              name,
              email,
            }
          : user
      )
    );

    if (selectedUser?.id === actionUser.id) {
      setSelectedUser({
        ...selectedUser,
        name,
        email,
      });
    }

    setIsEditDialogOpen(false);
    toast({ title: `Updated ${name}` });
  };

  const handleResetPassword = (user: User) => {
    setActionUser(user);
    setIsResetDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (!actionUser) return;

    setIsResetDialogOpen(false);
    toast({ title: `Password reset for ${actionUser.name}` });
  };

  const handleDeactivateUser = (user: User) => {
    setActionUser(user);
    setIsDeactivateDialogOpen(true);
  };

  const confirmDeactivateUser = () => {
    if (!actionUser) return;

    setInactiveUserIds((prev) =>
      prev.includes(actionUser.id) ? prev : [...prev, actionUser.id]
    );
    setIsDeactivateDialogOpen(false);
    toast({ title: `${actionUser.name} has been deactivated` });
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h1 className="text-lg font-medium text-foreground">Users</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Manage user accounts and their role assignments
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
                    Create a new user account and assign roles.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="" />
                  </div>
                  <div className="space-y-2">
                    <Label>Roles</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center gap-2">
                          <Checkbox id={`role-${role.id}`} />
                          <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                            {role.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(false)}>
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users table */}
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => {
                const userRoles = getUserRoleNames(user.id);
                const isInactive = inactiveUserIds.includes(user.id);

                return (
                  <TableRow
                    key={user.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
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
                        {userRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {userRoles.length === 0 && (
                          <span className="text-sm text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isInactive
                            ? 'text-muted-foreground border-border'
                            : 'text-success border-success/30'
                        }
                      >
                        {isInactive ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageRoles(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeactivateUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Manage Roles Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Manage Roles — {selectedUser?.name}</DialogTitle>
              <DialogDescription>
                Select the roles to assign to this user. Permissions are determined by the assigned roles.
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
                    <Label htmlFor={`assign-role-${role.id}`} className="text-sm font-medium cursor-pointer">
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
              <Button onClick={handleSaveRoles}>
                Save Roles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user account details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Full Name</Label>
                <Input
                  id="edit-user-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Confirm password reset for {actionUser?.name}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmResetPassword}>Confirm Reset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate User Dialog */}
        <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Deactivate User</DialogTitle>
              <DialogDescription>
                This will set {actionUser?.name} to inactive status.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeactivateUser}>
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
