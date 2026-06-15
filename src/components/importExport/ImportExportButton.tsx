import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, Download, FileSpreadsheet, FileDown, ChevronDown } from 'lucide-react';
import { getSchema } from '@/lib/importExport/registry';
import { downloadTemplate, exportRecords } from '@/lib/importExport/generateTemplate';
import { ImportDialog } from './ImportDialog';
import { ExportDialog } from './ExportDialog';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';
import { useToast } from '@/hooks/use-toast';

interface Props {
  schema: string;
  /** Records currently visible after filters — used for "export current view". */
  currentRecords?: Record<string, unknown>[];
  /** All records — used for "export all". Falls back to currentRecords. */
  allRecords?: Record<string, unknown>[];
  onImported?: () => void;
}

export function ImportExportButton({
  schema: schemaKey, currentRecords = [], allRecords, onImported,
}: Props) {
  const schema = getSchema(schemaKey);
  const { roles, isSuperAdmin } = useRoleCheck();
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  if (!schema) return null;

  const userRoles = new Set([...(roles ?? []), isSuperAdmin ? 'super_admin' : '']);
  const canImport = isSuperAdmin || schema.permissions.import.some((r) => userRoles.has(r));
  const canExport = isSuperAdmin || schema.permissions.export.some((r) => userRoles.has(r));

  if (!canImport && !canExport) return null;

  const quickExport = (format: 'xlsx' | 'csv', scope: 'current' | 'all') => {
    const rows = scope === 'all' ? (allRecords ?? currentRecords) : currentRecords;
    if (!rows.length) {
      toast({ title: 'Nothing to export', description: 'No records available.' });
      return;
    }
    exportRecords(schema, rows, { format });
    toast({ title: 'Export started', description: `${rows.length} records → ${format.toUpperCase()}` });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Import / Export
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canExport && (
            <>
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Export current view…
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickExport('xlsx', 'all')}>
                <Download className="h-3.5 w-3.5 mr-2" /> Export all (XLSX)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {canImport && (
            <>
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-2" /> Import from file…
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadTemplate(schema)}>
                <FileDown className="h-3.5 w-3.5 mr-2" /> Download template
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canImport && (
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          schemaKey={schemaKey}
          onImported={onImported}
        />
      )}
      {canExport && (
        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          schemaKey={schemaKey}
          currentRecords={currentRecords}
          allRecords={allRecords ?? currentRecords}
        />
      )}
    </>
  );
}