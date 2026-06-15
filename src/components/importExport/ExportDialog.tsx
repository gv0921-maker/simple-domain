import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getSchema } from '@/lib/importExport/registry';
import { exportRecords } from '@/lib/importExport/generateTemplate';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  schemaKey: string;
  currentRecords: Record<string, unknown>[];
  allRecords: Record<string, unknown>[];
}

export function ExportDialog({ open, onOpenChange, schemaKey, currentRecords, allRecords }: Props) {
  const schema = getSchema(schemaKey);
  const { toast } = useToast();
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [fileName, setFileName] = useState(`${schemaKey}_export`);
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [includeArchived, setIncludeArchived] = useState(false);

  if (!schema) return null;

  const submit = () => {
    let rows = scope === 'all' ? allRecords : currentRecords;
    if (!includeArchived) {
      rows = rows.filter((r) => (r.status ?? r['status']) !== 'archived');
    }
    if (!rows.length) {
      toast({ title: 'Nothing to export', description: 'No records match.' });
      return;
    }
    exportRecords(schema, rows, { format, fileName });
    toast({ title: 'Export started', description: `${rows.length} records exported.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Export {schema.displayName}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">File name</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} className="h-9" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'xlsx' | 'csv')} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="xlsx" /> Excel (.xlsx)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="csv" /> CSV
              </label>
            </RadioGroup>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Scope</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'current' | 'all')} className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="current" /> Current view ({currentRecords.length} records)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="all" /> All records ({allRecords.length})
              </label>
            </RadioGroup>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={includeArchived} onCheckedChange={(c) => setIncludeArchived(!!c)} />
            Include archived
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}