import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  Trash2,
} from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { useToast } from '@/hooks/use-toast';
import {
  getLocalCounts,
  listAllLocalKeys,
  runMigration,
  clearAllLocalData,
  type TableResult,
} from '@/lib/migration/localToSupabase';
import { cn } from '@/lib/utils';

export default function DataMigration() {
  const { toast } = useToast();
  const [counts, setCounts] = useState(() => getLocalCounts());
  const [allKeys, setAllKeys] = useState<string[]>(() => listAllLocalKeys());
  const [results, setResults] = useState<TableResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearAll, setClearAll] = useState(true);
  const [preserveAuth, setPreserveAuth] = useState(true);

  useEffect(() => {
    if (!running) {
      setCounts(getLocalCounts());
      setAllKeys(listAllLocalKeys());
    }
  }, [running]);

  const totalCRMRecords = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const nonCRMKeys = useMemo(
    () => allKeys.filter(k => !k.startsWith('erp_crm_')),
    [allKeys]
  );

  const startMigration = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setResults([]);
    setDone(false);
    try {
      const out = await runMigration(r =>
        setResults(prev => [...prev, r])
      );
      const totalFailed = out.reduce((a, r) => a + r.failed, 0);
      const totalInserted = out.reduce((a, r) => a + r.inserted, 0);

      if (totalFailed === 0) {
        toast({
          title: 'Migration complete',
          description: `Transferred ${totalInserted} records to Supabase.`,
        });
        if (clearAll) {
          const removed = clearAllLocalData({ preserveAuth });
          toast({
            title: 'Local storage cleared',
            description: `Removed ${removed.length} localStorage keys.`,
          });
        }
      } else {
        toast({
          title: 'Migration finished with issues',
          description: `${totalInserted} inserted, ${totalFailed} failed/skipped. Local data was NOT cleared.`,
          variant: 'destructive',
        });
      }
      setDone(true);
    } catch (e) {
      toast({
        title: 'Migration failed',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  const clearOnly = () => {
    const removed = clearAllLocalData({ preserveAuth });
    setCounts(getLocalCounts());
    setAllKeys(listAllLocalKeys());
    toast({
      title: 'Local storage cleared',
      description: `Removed ${removed.length} localStorage keys.`,
    });
  };

  const statusBadge = (s: TableResult['status']) => {
    const map: Record<TableResult['status'], string> = {
      pending: 'bg-muted text-muted-foreground',
      running: 'bg-info/10 text-info border-info/30',
      success: 'bg-success/10 text-success border-success/30',
      partial: 'bg-warning/10 text-warning border-warning/30',
      error: 'bg-destructive/10 text-destructive border-destructive/30',
      skipped: 'bg-muted text-muted-foreground',
    };
    return <Badge variant="outline" className={cn('capitalize text-xs', map[s])}>{s}</Badge>;
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Cloud className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-medium text-foreground">Data Migration</h1>
            <p className="text-sm text-muted-foreground">
              Transfer CRM data from local browser storage to Supabase, then clear local data.
            </p>
          </div>
        </div>

        {/* Local data summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Local Data
            </CardTitle>
            <CardDescription>
              {totalCRMRecords} CRM record{totalCRMRecords === 1 ? '' : 's'} found in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {([
                ['Companies', counts.companies],
                ['Contacts', counts.contacts],
                ['Pipelines', counts.pipelines],
                ['Opportunities', counts.opportunities],
                ['Activities', counts.activities],
                ['Notes', counts.notes],
                ['Tags', counts.tags],
              ] as const).map(([label, n]) => (
                <div key={label} className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{n}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {nonCRMKeys.length > 0 && (
              <div className="mt-4 p-3 rounded-md border border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{nonCRMKeys.length}</span> additional
                  localStorage key{nonCRMKeys.length === 1 ? '' : 's'} (sales, inventory, settings, etc.)
                  have no Supabase destination yet. They will only be cleared if you check
                  &quot;Also clear non-CRM keys&quot; below.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options + actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="clear-all"
                checked={clearAll}
                onCheckedChange={v => setClearAll(v === true)}
                disabled={running}
              />
              <div className="flex-1">
                <Label htmlFor="clear-all" className="font-medium cursor-pointer">
                  Clear localStorage after successful transfer
                </Label>
                <p className="text-xs text-muted-foreground">
                  Removes every <code className="text-foreground">erp_*</code> key (CRM data, sales,
                  inventory, settings, audit logs). Only runs if every CRM table inserts cleanly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="preserve-auth"
                checked={preserveAuth}
                onCheckedChange={v => setPreserveAuth(v === true)}
                disabled={running || !clearAll}
              />
              <div className="flex-1">
                <Label htmlFor="preserve-auth" className="font-medium cursor-pointer">
                  Keep me logged in
                </Label>
                <p className="text-xs text-muted-foreground">
                  Preserves <code className="text-foreground">erp_auth</code> so you stay signed in.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={running || totalCRMRecords === 0}
                className="gap-2"
              >
                {running ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
                ) : (
                  <><Cloud className="h-4 w-4" /> Transfer to Supabase{clearAll ? ' & clear' : ''}</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearOnly}
                disabled={running || allKeys.length === 0}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Clear local storage only
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {(results.length > 0 || running) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Local</TableHead>
                    <TableHead className="text-right">Inserted</TableHead>
                    <TableHead className="text-right">Failed/Skipped</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(r => (
                    <TableRow key={r.table}>
                      <TableCell className="font-mono text-xs">{r.table}</TableCell>
                      <TableCell className="text-right">{r.totalLocal}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1">
                          {r.status === 'success' && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          )}
                          {r.inserted}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.failed > 0 ? (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" /> {r.failed}
                          </span>
                        ) : (
                          r.failed
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate">
                        {r.error ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {running && results.length < 7 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Migrating…
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {done && (
                <div className="p-4 border-t border-border text-sm">
                  Migration finished. Refresh the app or navigate to a CRM page to verify Supabase data.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run migration now?</AlertDialogTitle>
              <AlertDialogDescription>
                This will insert {totalCRMRecords} record{totalCRMRecords === 1 ? '' : 's'} into your
                Supabase project. {clearAll
                  ? 'After every table inserts cleanly, all erp_* keys in this browser will be removed'
                  + (preserveAuth ? ' (your sign-in is preserved)' : '') + '.'
                  : 'Local storage will NOT be cleared.'}
                {' '}If a table fails, local data is kept so you can retry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startMigration}>Start migration</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}