import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Filter,
  ClipboardList,
  User,
  Shield,
  Database,
  LogIn,
  LogOut,
} from 'lucide-react';
import { getAuditLogs, type AuditLog } from '@/lib/data/rbac';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { SETTINGS_NAV } from '@/lib/navigation/settings';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Database className="h-4 w-4 text-success" />,
  update: <Database className="h-4 w-4 text-warning" />,
  delete: <Database className="h-4 w-4 text-destructive" />,
  login: <LogIn className="h-4 w-4 text-info" />,
  logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
  permission_change: <Shield className="h-4 w-4 text-primary" />,
};

// Demo audit logs
const DEMO_LOGS: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Management',
    action: 'login',
    resource: 'session',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    userId: '1',
    userName: 'Management',
    action: 'create',
    resource: 'product',
    resourceId: '102884',
    details: 'Created new product: Leather Sofa',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    userId: '2',
    userName: 'Sales Manager',
    action: 'update',
    resource: 'lead',
    resourceId: '1',
    details: 'Updated lead status: New → Qualified',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    userId: '1',
    userName: 'Management',
    action: 'permission_change',
    resource: 'role',
    resourceId: 'sales_rep',
    details: 'Modified permissions for Sales Representative role',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5',
    userId: '3',
    userName: 'Warehouse Operator',
    action: 'update',
    resource: 'inventory',
    resourceId: 'GLF/EST/25-26/00670',
    details: 'Updated transfer status: Draft → Waiting',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const logs = useMemo(() => {
    let result = DEMO_LOGS;

    if (search) {
      result = result.filter(
        (log) =>
          log.userName.toLowerCase().includes(search.toLowerCase()) ||
          log.resource.toLowerCase().includes(search.toLowerCase()) ||
          log.details.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      result = result.filter((log) => log.action === actionFilter);
    }

    return result;
  }, [search, actionFilter]);

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-medium text-foreground">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">
                Track all user actions and system changes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="permission_change">Permission Change</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Logs table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[150px]">User</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead className="w-[120px]">Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[120px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ACTION_ICONS[log.action]}
                        <Badge
                          variant={
                            log.action === 'delete'
                              ? 'destructive'
                              : log.action === 'create'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs capitalize"
                        >
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{log.resource}</span>
                      {log.resourceId && (
                        <span className="text-xs text-muted-foreground ml-1">
                          #{log.resourceId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.details}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
