import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Database,
  FileArchive,
  Settings2,
} from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Backup {
  id: string;
  name: string;
  createdAt: string;
  size: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'failed' | 'in_progress';
}

const DEMO_BACKUPS: Backup[] = [
  {
    id: '1',
    name: 'backup_2026-01-31_auto',
    createdAt: new Date().toISOString(),
    size: '24.5 MB',
    type: 'automatic',
    status: 'completed',
  },
  {
    id: '2',
    name: 'backup_2026-01-30_auto',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    size: '24.3 MB',
    type: 'automatic',
    status: 'completed',
  },
  {
    id: '3',
    name: 'backup_2026-01-28_manual',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    size: '24.1 MB',
    type: 'manual',
    status: 'completed',
  },
  {
    id: '4',
    name: 'backup_2026-01-25_auto',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    size: '23.8 MB',
    type: 'automatic',
    status: 'completed',
  },
  {
    id: '5',
    name: 'backup_2026-01-20_auto',
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    size: '23.2 MB',
    type: 'automatic',
    status: 'failed',
  },
];

export default function BackupsSettings() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>(DEMO_BACKUPS);
  const [isCreating, setIsCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [retentionDays, setRetentionDays] = useState('30');

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setCreateProgress(0);

    // Simulate backup progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setCreateProgress(i);
    }

    const newBackup: Backup = {
      id: crypto.randomUUID(),
      name: `backup_${format(new Date(), 'yyyy-MM-dd')}_manual`,
      createdAt: new Date().toISOString(),
      size: '24.6 MB',
      type: 'manual',
      status: 'completed',
    };

    setBackups([newBackup, ...backups]);
    setIsCreating(false);
    setCreateProgress(0);
    toast({ title: 'Backup created successfully' });
  };

  const handleDownload = (backup: Backup) => {
    toast({ title: `Downloading ${backup.name}...` });
    // In a real app, this would trigger a file download
  };

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };

  const confirmRestore = () => {
    if (selectedBackup) {
      toast({ 
        title: 'Restore initiated',
        description: `Restoring from ${selectedBackup.name}. This may take a few minutes.`,
      });
    }
    setIsRestoreDialogOpen(false);
    setSelectedBackup(null);
  };

  const handleDelete = (backup: Backup) => {
    setBackups(backups.filter((b) => b.id !== backup.id));
    toast({ title: 'Backup deleted' });
  };

  const getStatusIcon = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-info animate-spin" />;
    }
  };

  const getStatusBadge = (status: Backup['status']) => {
    const variants: Record<Backup['status'], string> = {
      completed: 'bg-success/10 text-success border-success/30',
      failed: 'bg-destructive/10 text-destructive border-destructive/30',
      in_progress: 'bg-info/10 text-info border-info/30',
    };

    return (
      <Badge variant="outline" className={cn('capitalize', variants[status])}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const storageUsed = backups.reduce((sum, b) => {
    const size = parseFloat(b.size);
    return sum + size;
  }, 0);

  const storageLimit = 500; // MB

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HardDrive className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-medium text-foreground">Backups</h1>
              <p className="text-sm text-muted-foreground">
                Manage system backups and restore points
              </p>
            </div>
          </div>
          <Button onClick={handleCreateBackup} disabled={isCreating} className="gap-2">
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Create Backup
              </>
            )}
          </Button>
        </div>

        {/* Progress bar when creating */}
        {isCreating && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileArchive className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Creating backup...</p>
                  <Progress value={createProgress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">{createProgress}% complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Storage Overview */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">{storageUsed.toFixed(1)} MB / {storageLimit} MB</span>
                  </div>
                  <Progress value={(storageUsed / storageLimit) * 100} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{backups.length}</p>
                    <p className="text-xs text-muted-foreground">Total Backups</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {backups.filter((b) => b.status === 'completed').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto Backup Settings */}
          <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Backup Settings
              </CardTitle>
              <CardDescription>Configure automatic backup schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between md:flex-col md:items-start gap-2">
                  <div>
                    <Label className="font-medium">Auto Backup</Label>
                    <p className="text-xs text-muted-foreground">Enable automatic backups</p>
                  </div>
                  <Switch
                    checked={autoBackupEnabled}
                    onCheckedChange={setAutoBackupEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={backupFrequency}
                    onValueChange={setBackupFrequency}
                    disabled={!autoBackupEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Retention Period</Label>
                  <Select
                    value={retentionDays}
                    onValueChange={setRetentionDays}
                    disabled={!autoBackupEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup List */}
        <Card className="mt-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-base">Backup History</CardTitle>
            <CardDescription>View and manage your backup files</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No backups yet</p>
                      <Button variant="link" onClick={handleCreateBackup}>
                        Create your first backup
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup, index) => (
                    <TableRow
                      key={backup.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileArchive className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{backup.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(backup.createdAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{backup.size}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(backup.status)}
                          {getStatusBadge(backup.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(backup)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRestore(backup)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(backup)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Restore Confirmation Dialog */}
        <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Backup</DialogTitle>
              <DialogDescription>
                Are you sure you want to restore from this backup? This will replace all current data.
              </DialogDescription>
            </DialogHeader>
            {selectedBackup && (
              <div className="py-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Backup:</span>
                    <span className="font-mono">{selectedBackup.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(selectedBackup.createdAt), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{selectedBackup.size}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm text-warning font-medium">⚠️ Warning</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This action cannot be undone. All current data will be replaced with the backup data.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRestore}>
                Restore Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
