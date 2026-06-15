import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, FileSpreadsheet, AlertTriangle, Check, X, Download, Loader2,
} from 'lucide-react';
import { getSchema } from '@/lib/importExport/registry';
import {
  parseFile, autoMapHeaders, mapRowsToSchema, validateRows,
} from '@/lib/importExport/parseFile';
import { downloadErrorCsv, downloadTemplate } from '@/lib/importExport/generateTemplate';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  schemaKey: string;
  onImported?: () => void;
}

type Step = 'upload' | 'preview' | 'validate' | 'confirm' | 'result';

interface ImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: { row: number; message: string }[];
  job_id?: string | null;
}

export function ImportDialog({ open, onOpenChange, schemaKey, onImported }: Props) {
  const schema = getSchema(schemaKey);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  const [clientErrors, setClientErrors] = useState<{ row: number; message: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('upload'); setFile(null); setHeaders([]); setRawRows([]);
      setHeaderMap({}); setClientErrors([]); setResult(null); setBusy(false);
    }
  }, [open]);

  if (!schema) return null;

  const mappedRows = useMemo(
    () => mapRowsToSchema(rawRows, headerMap, schema),
    [rawRows, headerMap, schema],
  );

  const handleFile = async (f: File) => {
    setFile(f); setBusy(true);
    try {
      const parsed = await parseFile(f);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setHeaderMap(autoMapHeaders(parsed.headers, schema));
      setStep('preview');
    } catch (err) {
      toast({ title: 'Parse failed', description: String(err), variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const runValidate = () => {
    const errs = validateRows(mappedRows, schema);
    setClientErrors(errs);
    setStep('validate');
  };

  const runImport = async (dryRun = false) => {
    setBusy(true);
    try {
      const requiredFields = schema.columns.filter((c) => c.required).map((c) => c.key);
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          module: schema.moduleKey,
          table: schema.table,
          upsertKey: schema.upsertKey,
          rows: mappedRows,
          fileName: file?.name,
          requiredFields,
          options: { dryRun },
        },
      });
      if (error) throw error;
      const r = data as ImportResult;
      setResult(r);
      if (!dryRun) {
        toast({
          title: 'Import complete',
          description: `${r.succeeded} succeeded, ${r.failed} failed of ${r.total}`,
        });
        onImported?.();
        setStep('result');
      }
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally { setBusy(false); }
  };

  const mappedCount = Object.keys(headerMap).length;
  const requiredKeys = schema.columns.filter((c) => c.required).map((c) => c.key);
  const missingRequired = requiredKeys.filter((k) => !Object.values(headerMap).includes(k));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import {schema.displayName}</DialogTitle>
        </DialogHeader>

        <Stepper step={step} />

        <div className="flex-1 overflow-y-auto py-2">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/40"
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Drag &amp; drop a file, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx or .csv up to 5 MB</p>
                <input
                  ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
              <div className="text-center">
                <Button variant="link" size="sm" onClick={() => downloadTemplate(schema)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download template
                </Button>
              </div>
              {busy && <div className="text-center text-sm"><Loader2 className="h-4 w-4 inline animate-spin mr-2" /> Parsing…</div>}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-medium">{file?.name}</span>
                  <Badge variant="secondary">{rawRows.length} rows</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{mappedCount}/{headers.length} columns mapped</span>
              </div>

              {missingRequired.length > 0 && (
                <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                  Required field(s) unmapped: {missingRequired.map((k) => schema.columns.find((c) => c.key === k)?.label).join(', ')}
                </div>
              )}

              <div className="border rounded max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {headers.map((h) => (
                        <TableHead key={h} className="min-w-[140px]">
                          <div className="font-medium">{h}</div>
                          <Select
                            value={headerMap[h] ?? '__skip__'}
                            onValueChange={(v) => setHeaderMap((m) => {
                              const next = { ...m };
                              if (v === '__skip__') delete next[h];
                              else next[h] = v;
                              return next;
                            })}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__skip__">— Skip —</SelectItem>
                              {schema.columns.map((c) => (
                                <SelectItem key={c.key} value={c.key}>
                                  {c.label}{c.required && ' *'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawRows.slice(0, 10).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-muted-foreground">{i + 2}</TableCell>
                        {headers.map((h) => (
                          <TableCell key={h} className="text-xs">{String(r[h] ?? '')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'validate' && (
            <div className="space-y-3">
              {clientErrors.length === 0 ? (
                <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
                  <Check className="h-4 w-4 inline mr-1" />
                  All {mappedRows.length} rows passed validation. Ready to import.
                </div>
              ) : (
                <>
                  <div className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1 text-destructive" />
                    {clientErrors.length} error(s) found.{' '}
                    {mappedRows.length - new Set(clientErrors.map((e) => e.row)).size} row(s) will be imported.
                  </div>
                  <div className="border rounded max-h-[280px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientErrors.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{e.row}</TableCell>
                            <TableCell className="text-xs text-destructive">{e.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-3 text-sm">
              <p>Ready to import <strong>{mappedRows.length}</strong> rows into <strong>{schema.displayName}</strong>.</p>
              <p className="text-muted-foreground text-xs">
                {schema.upsertKey
                  ? `Existing rows matching "${schema.upsertKey}" will be updated; new rows inserted.`
                  : 'All rows will be inserted as new records.'}
              </p>
              {busy && <Progress value={undefined} className="h-1.5" />}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <ResultCard label="Total" value={result.total} />
                <ResultCard label="Succeeded" value={result.succeeded} tone="success" />
                <ResultCard label="Failed" value={result.failed} tone={result.failed > 0 ? 'error' : 'default'} />
              </div>
              {result.errors.length > 0 && (
                <>
                  <div className="border rounded max-h-[240px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{e.row}</TableCell>
                            <TableCell className="text-xs text-destructive">{e.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => downloadErrorCsv(result.errors, `${schema.moduleKey}_errors`)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download error CSV
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={runValidate} disabled={missingRequired.length > 0}>
                Validate
              </Button>
            </>
          )}
          {step === 'validate' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={() => setStep('confirm')}>
                Continue ({mappedRows.length - new Set(clientErrors.map((e) => e.row)).size} rows)
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('validate')} disabled={busy}>Back</Button>
              <Button onClick={() => runImport(false)} disabled={busy}>
                {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Import {mappedRows.length} rows
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'preview', label: 'Map' },
    { id: 'validate', label: 'Validate' },
    { id: 'confirm', label: 'Confirm' },
    { id: 'result', label: 'Result' },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-2 text-xs border-b pb-3">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <div className={`h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px] ${
            i <= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>{i + 1}</div>
          <span className={i === idx ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
          {i < steps.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
        </div>
      ))}
    </div>
  );
}

function ResultCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'error' }) {
  const cls = tone === 'success' ? 'border-green-300 bg-green-50' :
              tone === 'error' ? 'border-destructive/40 bg-destructive/5' :
              'border-border bg-muted/30';
  return (
    <div className={`rounded border px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}