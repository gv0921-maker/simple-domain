import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, XCircle, Zap, Plug, ListChecks, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/data/rbac';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type ModelKey = 'warehouses' | 'products' | 'stock' | 'serials' | 'customers' | 'vendors';

const MODELS: Array<{ key: ModelKey; label: string }> = [
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'products', label: 'Products' },
  { key: 'stock', label: 'Stock levels' },
  { key: 'serials', label: 'Serial numbers' },
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors' },
];

interface ImportResult {
  model: ModelKey;
  imported_count: number;
  skipped_count: number;
  errors: string[];
}

export default function OdooImport() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [odooUrl, setOdooUrl] = useState('');
  const [db, setDb] = useState('');
  const [login, setLogin] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<ModelKey, boolean>>({
    warehouses: true, products: true, stock: true, serials: true, customers: true, vendors: true,
  });
  const [progress, setProgress] = useState(0);
  const [currentModel, setCurrentModel] = useState<ModelKey | null>(null);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user || !isSuperAdminUser(user.id)) return <Navigate to="/" replace />;

  const callFn = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('odoo-import', { body: payload });
    if (error) {
      const ctx = (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>))
        ? ` — ${(data as Record<string, unknown>).error}`
        : '';
      throw new Error(`${error.message}${ctx}`);
    }
    if (data && (data as Record<string, unknown>).success === false) {
      const d = data as Record<string, unknown>;
      const extra = d.odoo_status ? ` [HTTP ${d.odoo_status}]` : '';
      const body = d.odoo_body ? `\n${String(d.odoo_body).slice(0, 500)}` : '';
      throw new Error(`${d.error ?? 'Odoo error'}${extra}${body}`);
    }
    return data as Record<string, unknown>;
  };

  const handleTest = async () => {
    setTesting(true);
    setTestError(null);
    setCounts(null);
    try {
      const res = await callFn({ odoo_url: odooUrl, db, login, api_key: apiKey, action: 'test', model: 'test' });
      setCounts((res.counts as Record<string, number>) ?? {});
      toast({ title: 'Connection successful', description: 'Connected to Odoo instance.' });
      setStep(2);
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setDone(false);
    setResults([]);
    const chosen = MODELS.filter((m) => selected[m.key]);
    const out: ImportResult[] = [];
    for (let i = 0; i < chosen.length; i++) {
      const m = chosen[i];
      setCurrentModel(m.key);
      try {
        const res = await callFn({ odoo_url: odooUrl, db, login, api_key: apiKey, action: 'import', model: m.key });
        out.push({
          model: m.key,
          imported_count: Number(res.imported_count) || 0,
          skipped_count: Number(res.skipped_count) || 0,
          errors: (res.errors as string[]) || [],
        });
      } catch (e) {
        out.push({ model: m.key, imported_count: 0, skipped_count: 0, errors: [e instanceof Error ? e.message : 'Failed'] });
      }
      setResults([...out]);
      setProgress(Math.round(((i + 1) / chosen.length) * 100));
    }
    setCurrentModel(null);
    setImporting(false);
    setDone(true);
  };

  const totalImported = results.reduce((s, r) => s + r.imported_count, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped_count, 0);
  const allErrors = results.flatMap((r) => r.errors.map((e) => `[${r.model}] ${e}`));

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-foreground">Odoo Data Import</h1>
          <p className="text-sm text-muted-foreground">Import existing data from an Odoo cloud instance into GLF.</p>
        </div>

        <Alert className="mb-6 border-amber-500/50 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Upsert mode</AlertTitle>
          <AlertDescription>
            This will upsert data — existing records with matching SKU/email/code will be updated, not duplicated.
          </AlertDescription>
        </Alert>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {[
            { n: 1 as const, label: 'Connection', icon: Plug },
            { n: 2 as const, label: 'Select data', icon: ListChecks },
            { n: 3 as const, label: 'Import', icon: Play },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${step === s.n ? 'bg-primary text-primary-foreground' : step > s.n ? 'bg-muted text-foreground' : 'bg-muted/40 text-muted-foreground'}`}>
                <s.icon className="h-3.5 w-3.5" />
                <span>{s.n}. {s.label}</span>
              </div>
              {i < 2 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-6 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odoo-url">Odoo URL</Label>
                <Input id="odoo-url" value={odooUrl} onChange={(e) => setOdooUrl(e.target.value)} placeholder="" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odoo-db">Database name</Label>
                <Input id="odoo-db" value={db} onChange={(e) => setDb(e.target.value)} placeholder="" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odoo-login">Login (email)</Label>
                <Input id="odoo-login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odoo-key">API Key</Label>
                <Input id="odoo-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleTest} disabled={!odooUrl || !apiKey || !db || !login || testing} className="gap-1">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Test Connection
              </Button>
              {counts && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </span>
              )}
              {testError && (
                <span className="flex items-center gap-1.5 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> {testError}
                </span>
              )}
            </div>
            {counts && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {MODELS.map((m) => (
                  <div key={m.key} className="flex items-center justify-between px-3 py-2 rounded-md border bg-muted/30 text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{counts[m.key] ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 space-y-4 animate-fade-in">
            <h2 className="text-base font-medium">Select data to import</h2>
            <div className="space-y-3">
              {MODELS.map((m) => (
                <label key={m.key} className="flex items-center justify-between px-3 py-2 rounded-md border hover:bg-muted/40 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selected[m.key]}
                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [m.key]: Boolean(v) }))}
                    />
                    <span className="text-sm font-medium">{m.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{counts?.[m.key] ?? 0} records</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!Object.values(selected).some(Boolean)}>Continue</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Run import</h2>
              {!importing && !done && (
                <Button onClick={handleImport} className="gap-1">
                  <Play className="h-4 w-4" /> Start Import
                </Button>
              )}
            </div>

            {(importing || done) && (
              <>
                <Progress value={progress} />
                <div className="space-y-2">
                  {MODELS.filter((m) => selected[m.key]).map((m) => {
                    const r = results.find((x) => x.model === m.key);
                    const isCurrent = currentModel === m.key;
                    return (
                      <div key={m.key} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                          {r ? (
                            r.errors.length > 0 && r.imported_count === 0 ? (
                              <XCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border" />
                          )}
                          <span>{m.label}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {r
                            ? `${r.imported_count} imported, ${r.skipped_count} skipped`
                            : isCurrent
                              ? 'Importing…'
                              : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {done && (
              <div className="pt-2 space-y-3">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Import complete</AlertTitle>
                  <AlertDescription>
                    {totalImported} records imported, {totalSkipped} skipped across {results.length} models.
                  </AlertDescription>
                </Alert>
                {allErrors.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <ChevronDown className="h-4 w-4" /> View Errors ({allErrors.length})
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="max-h-64 overflow-auto border rounded-md p-3 text-xs font-mono space-y-1 bg-muted/30">
                        {allErrors.map((e, i) => (<div key={i}>{e}</div>))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {!importing && (
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                {done && <Button variant="outline" onClick={() => { setDone(false); setResults([]); setProgress(0); }}>Run another import</Button>}
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}