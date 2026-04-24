// CRM Import/Export Component - Supports Odoo-format XLSX/CSV
// Async via TanStack Query hooks (Supabase-backed).
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Check,
  X,
  AlertTriangle,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import type { ImportResult } from '@/lib/services/crm';
import {
  useImportContacts,
  useImportOpportunities,
  useExportContacts,
  useExportOpportunities,
} from '@/hooks/crm/useCRMQueries';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import * as XLSX from 'xlsx';

// ===================== Field Mapping Configs =====================

type RecordType = 'contacts' | 'opportunities';

interface FieldDef {
  value: string;
  label: string;
}

const CONTACT_FIELDS: FieldDef[] = [
  { value: 'id', label: 'Unique ID' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'companyName', label: 'Company' },
  { value: 'companyType', label: 'Company Type' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'department', label: 'Department' },
  { value: 'website', label: 'Website' },
  { value: 'gstin', label: 'GSTIN' },
  { value: 'type', label: 'Contact Type' },
  { value: 'street', label: 'Street' },
  { value: 'street2', label: 'Street 2' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'postalCode', label: 'Zip Code' },
  { value: 'country', label: 'Country' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Notes' },
  { value: 'assignedTo', label: 'Salesperson' },
  { value: 'score', label: 'Score' },
  { value: 'status', label: 'Status' },
  { value: 'skip', label: '-- Skip --' },
];

const OPPORTUNITY_FIELDS: FieldDef[] = [
  { value: 'name', label: 'Opportunity Name' },
  { value: 'contactName', label: 'Contact Name' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'stageId', label: 'Stage' },
  { value: 'expectedRevenue', label: 'Expected Revenue' },
  { value: 'probability', label: 'Probability (%)' },
  { value: 'priority', label: 'Priority' },
  { value: 'salesTeam', label: 'Sales Team' },
  { value: 'assignedTo', label: 'Salesperson' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Notes' },
  { value: 'expectedCloseDate', label: 'Expected Close Date' },
  { value: 'skip', label: '-- Skip --' },
];

const FIELDS_MAP: Record<RecordType, FieldDef[]> = {
  contacts: CONTACT_FIELDS,
  opportunities: OPPORTUNITY_FIELDS,
};

// Auto-guess mapping based on Odoo-style column headers
function guessFieldMapping(header: string, recordType: RecordType): string {
  const h = header.toLowerCase().trim();

  // Opportunity-specific mappings (Odoo format)
  if (recordType === 'opportunities') {
    if (h === 'opportunity' || h === 'opportunity name') return 'name';
    if (h === 'contact name' || h === 'contact') return 'contactName';
    if (h === 'company name' || h === 'company') return 'companyName';
    if (h === 'expected revenue' || h === 'revenue') return 'expectedRevenue';
    if (h === 'probability' || h === 'probability (%)') return 'probability';
    if (h === 'stage' || h === 'stage name') return 'stageId';
    if (h === 'priority' || h === 'stars') return 'priority';
    if (h === 'sales team' || h === 'team') return 'salesTeam';
    if (h === 'salesperson' || h === 'assigned to') return 'assignedTo';
    if (h === 'tags') return 'tags';
    if (h === 'expected closing' || h === 'close date' || h === 'expected close date') return 'expectedCloseDate';
    if (h.includes('email')) return 'email';
    if (h.includes('phone')) return 'phone';
    if (h.includes('note')) return 'notes';
  }

  // Contact-specific
  if (recordType === 'contacts') {
    if (h === 'id' || h === 'contact id' || h === 'contact_id' || h === 'external id' || h === 'external_id' || h === 'unique id' || h === 'record id') return 'id';
    if (h.includes('first') && h.includes('name')) return 'firstName';
    if (h.includes('last') && h.includes('name')) return 'lastName';
    if (h === 'name' || h === 'full name' || h === 'contact name') return 'firstName';
    if (h.includes('email')) return 'email';
    if (h === 'mobile' || h.includes('mobile')) return 'mobile';
    if (h.includes('phone') || h.includes('tel')) return 'phone';
    if (h === 'company_type' || h === 'company type') return 'companyType';
    if (h === 'company_name' || h.includes('company') || h.includes('organization')) return 'companyName';
    if (h.includes('title') || h.includes('position') || h === 'job position') return 'jobTitle';
    if (h.includes('department') || h.includes('dept')) return 'department';
    if (h.includes('website') || h.includes('url')) return 'website';
    if (h.includes('gstin') || h.includes('gst') || h.includes('tax id')) return 'gstin';
    if (h === 'type' || h === 'contact type') return 'type';
    if (h === 'street' || h === 'address' || h === 'street1') return 'street';
    if (h === 'street2' || h === 'address 2' || h === 'address2') return 'street2';
    if (h === 'city') return 'city';
    if (h === 'state' || h === 'province' || h === 'region') return 'state';
    if (h === 'zip' || h === 'zip code' || h === 'postal code' || h === 'postalcode' || h === 'postal_code') return 'postalCode';
    if (h === 'country') return 'country';
    if (h.includes('tag')) return 'tags';
    if (h.includes('note') || h === 'internal notes' || h === 'comment') return 'notes';
    if (h === 'salesperson' || h === 'assigned to' || h === 'assigned_to') return 'assignedTo';
    if (h === 'score') return 'score';
    if (h === 'status') return 'status';
  }

  return 'skip';
}

// Parse priority text to numeric
function parsePriority(val: string): number {
  const v = val?.toLowerCase().trim();
  if (v === 'very high' || v === 'urgent') return 3;
  if (v === 'high') return 2;
  if (v === 'medium' || v === 'normal') return 1;
  return 0;
}

// Parse priority text to lead priority
function parseLeadPriority(val: string): 'low' | 'medium' | 'high' | 'urgent' {
  const v = val?.toLowerCase().trim();
  if (v === 'very high' || v === 'urgent') return 'urgent';
  if (v === 'high') return 'high';
  if (v === 'medium' || v === 'normal') return 'medium';
  return 'low';
}

function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

// ===================== Import Dialog =====================

interface CRMImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
  defaultRecordType?: RecordType;
}

interface FieldMapping {
  csvField: string;
  crmField: string;
}

export function CRMImportDialog({ open, onOpenChange, onImportComplete, defaultRecordType = 'opportunities' }: CRMImportDialogProps) {
  const { toast } = useToast();
  const { canImportData } = useCRMPermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importContactsMut = useImportContacts();
  const importOpportunitiesMut = useImportOpportunities();
  const isImporting = importContactsMut.isPending || importOpportunitiesMut.isPending;

  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'result'>('upload');
  const [recordType, setRecordType] = useState<RecordType>(defaultRecordType);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      // Parse Excel using xlsx library
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length > 1) {
          const fileHeaders = (jsonData[0] as string[]).map(h => String(h || '').trim());
          const fileRows = jsonData.slice(1).filter((row: any[]) =>
            row.some(cell => cell !== null && cell !== undefined && cell !== '')
          );
          setHeaders(fileHeaders);
          setRows(fileRows);
          setFieldMappings(
            fileHeaders.map((header) => ({
              csvField: header,
              crmField: guessFieldMapping(header, recordType),
            }))
          );
          setStep('mapping');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV parsing
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        const parsed = lines.map((line) => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        });

        if (parsed.length > 1) {
          setHeaders(parsed[0]);
          setRows(parsed.slice(1));
          setFieldMappings(
            parsed[0].map((header) => ({
              csvField: header,
              crmField: guessFieldMapping(header, recordType),
            }))
          );
          setStep('mapping');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);

    // Build records from mapped fields
    const records = rows.map((row) => {
      const record: Record<string, any> = {};
      fieldMappings.forEach((mapping, index) => {
        if (mapping.crmField !== 'skip' && row[index] != null && row[index] !== '') {
          const val = row[index];
          if (mapping.crmField === 'expectedRevenue' || mapping.crmField === 'probability' || mapping.crmField === 'score') {
            record[mapping.crmField] = parseNumber(val);
          } else if (mapping.crmField === 'priority' && recordType === 'opportunities') {
            record[mapping.crmField] = parsePriority(String(val));
          } else if (mapping.crmField === 'tags') {
            record[mapping.crmField] = String(val).split(',').map(t => t.trim()).filter(Boolean);
          } else {
            record[mapping.crmField] = String(val);
          }
        }
      });
      return record;
    });

    // Process in batches for large datasets (10000+) to keep UI responsive
    const BATCH_SIZE = 2000;
    const totalRecords = records.length;
    const combinedResult: ImportResult = { success: 0, failed: 0, duplicates: 0, errors: [] };

    if (totalRecords <= BATCH_SIZE) {
      setImportProgress(50);
      await new Promise((r) => setTimeout(r, 0));

      let result: ImportResult;
      switch (recordType) {
        case 'contacts': result = await importContactsMut.mutateAsync(records); break;
        case 'opportunities': result = await importOpportunitiesMut.mutateAsync(records); break;
      }
      Object.assign(combinedResult, result);
    } else {
      for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const progress = Math.round(((i + batch.length) / totalRecords) * 95);
        setImportProgress(progress);
        // Yield to UI thread between batches
        await new Promise((r) => setTimeout(r, 0));

        let result: ImportResult;
        switch (recordType) {
          case 'contacts': result = await importContactsMut.mutateAsync(batch); break;
          case 'opportunities': result = await importOpportunitiesMut.mutateAsync(batch); break;
        }
        combinedResult.success += result.success;
        combinedResult.failed += result.failed;
        combinedResult.duplicates += result.duplicates;
        combinedResult.errors.push(...result.errors.slice(0, 50));
      }
    }

    setImportProgress(100);
    setImportResult(combinedResult);
    setStep('result');

    if (combinedResult.success > 0) {
      onImportComplete?.();
    }
  };

  const handleClose = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setFieldMappings([]);
    setImportResult(null);
    onOpenChange(false);
  };

  if (!canImportData) return null;

  const fields = FIELDS_MAP[recordType];
  const recordLabel = recordType === 'contacts' ? 'Contacts' : 'Opportunities';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {recordLabel}</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file to import {recordLabel.toLowerCase()} into your CRM
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Import as:</span>
              <Select value={recordType} onValueChange={(v) => setRecordType(v as RecordType)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opportunities">Opportunities</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports .xlsx, .xls, and .csv files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Tip: Odoo export format supported</p>
              <p>Column headers like "Opportunity", "Expected Revenue", "Contact Name", "Stage", "Salesperson" will be auto-mapped.</p>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Found <strong>{rows.length}</strong> records. Map columns to CRM fields:
              </span>
              <Select value={recordType} onValueChange={(v) => {
                const newType = v as RecordType;
                setRecordType(newType);
                setFieldMappings(headers.map((header) => ({
                  csvField: header,
                  crmField: guessFieldMapping(header, newType),
                })));
              }}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opportunities">Opportunities</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">File Column</TableHead>
                    <TableHead className="sticky top-0 bg-background">Sample</TableHead>
                    <TableHead className="sticky top-0 bg-background">Map To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-sm">{mapping.csvField}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                        {rows[0]?.[index] != null ? String(rows[0][index]) : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.crmField}
                          onValueChange={(v) => {
                            const newMappings = [...fieldMappings];
                            newMappings[index].crmField = v;
                            setFieldMappings(newMappings);
                          }}
                        >
                          <SelectTrigger className="w-44 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleImport}>
                Import {rows.length} {recordLabel}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="font-medium mb-4">Importing {recordLabel.toLowerCase()}...</p>
            <Progress value={importProgress} className="w-full max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">{importProgress}%</p>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Check className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.success}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.duplicates}</p>
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <X className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            {importResult.errors.length > 0 && (
              <div className="p-4 bg-destructive/10 rounded-lg max-h-32 overflow-y-auto">
                <p className="font-medium text-destructive mb-2">Errors:</p>
                <ul className="text-sm space-y-1">
                  {importResult.errors.slice(0, 10).map((error, i) => (
                    <li key={i} className="text-muted-foreground">{error}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li className="text-muted-foreground italic">...and {importResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===================== Export Button =====================

interface CRMExportButtonProps {
  type: RecordType;
  variant?: 'default' | 'outline' | 'ghost';
  format?: 'xlsx' | 'csv';
}

export function CRMExportButton({ type, variant = 'outline', format = 'xlsx' }: CRMExportButtonProps) {
  const { toast } = useToast();
  const { canExportData } = useCRMPermissions();
  const exportContactsMut = useExportContacts();
  const exportOpportunitiesMut = useExportOpportunities();
  const isExporting = exportContactsMut.isPending || exportOpportunitiesMut.isPending;

  const handleExport = async () => {
    let exportData: Record<string, any>[];
    let filename: string;

    switch (type) {
      case 'contacts': {
        const contacts = await exportContactsMut.mutateAsync();
        filename = `crm_contacts.${format}`;
        exportData = contacts.map(c => ({
          'First Name': c.firstName,
          'Last Name': c.lastName,
          'Email': c.email,
          'Phone': c.phone || '',
          'Company': c.companyName || '',
          'Job Title': c.jobTitle || '',
          'Department': c.department || '',
          'Status': c.status,
          'Tags': c.tags.join(', '),
        }));
        break;
      }
      case 'opportunities': {
        const opps = await exportOpportunitiesMut.mutateAsync();
        filename = `crm_opportunities.${format}`;
        exportData = opps.map(o => ({
          'Stage': o.stageId,
          'Probability': o.probability,
          'Opportunity': o.name,
          'Expected Revenue': o.expectedRevenue,
          'Contact Name': o.contactName,
          'Company Name': o.companyName || '',
          'Email': o.email || '',
          'Phone': o.phone || '',
          'Tags': o.tags.join(', '),
          'Priority': o.priority === 3 ? 'Very High' : o.priority === 2 ? 'High' : o.priority === 1 ? 'Medium' : 'Low',
          'Sales Team': o.salesTeam || '',
          'Salesperson': o.assignedTo || '',
          'Expected Close Date': o.expectedCloseDate,
        }));
        break;
      }
    }

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...exportData.map(row => String(row[key] || '').length)) + 2,
      }));
      ws['!cols'] = colWidths;
      XLSX.writeFile(wb, filename);
    } else {
      // CSV fallback
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [headers.join(',')];
      exportData.forEach(row => {
        csvRows.push(headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Export Complete',
      description: `Exported ${exportData.length} ${type} as ${format.toUpperCase()}`,
    });
  };

  if (!canExportData) return null;

  return (
    <Button variant={variant} onClick={handleExport} className="gap-2" disabled={isExporting}>
      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export
    </Button>
  );
}
