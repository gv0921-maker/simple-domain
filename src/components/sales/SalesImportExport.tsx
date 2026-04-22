import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Download, AlertTriangle } from 'lucide-react';
import { saveQuotation, saveSalesOrder, getQuotations, getSalesOrders } from '@/lib/data/sales/storage';
import type { Quotation, SalesOrder } from '@/lib/data/sales/types';
import { useToast } from '@/hooks/use-toast';

interface SalesImportExportProps {
  type: 'quotations' | 'orders';
  onImportComplete?: () => void;
}

export function SalesImportExport({ type, onImportComplete }: SalesImportExportProps) {
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<string[][]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    let csv = '';
    let filename = '';
    if (type === 'quotations') {
      const data = getQuotations();
      csv = 'Reference,Customer,Date,Valid Until,Status,Subtotal,Tax,Total\n' +
        data.map(q => `${q.reference},"${q.customerName}",${q.quotationDate},${q.validUntil},${q.status},${q.subtotal},${q.taxAmount},${q.total}`).join('\n');
      filename = 'quotations_export.csv';
    } else {
      const data = getSalesOrders();
      csv = 'Reference,Customer,Date,Status,Delivery,Subtotal,Tax,Total\n' +
        data.map(o => `${o.reference},"${o.customerName}",${o.orderDate},${o.status},${o.deliveryStatus},${o.subtotal},${o.taxAmount},${o.total}`).join('\n');
      filename = 'orders_export.csv';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${type === 'quotations' ? 'Quotations' : 'Orders'} exported` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = text.split('\n').map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
      if (rows.length < 2) {
        setErrors(['File is empty or has no data rows']);
        return;
      }
      setImportData(rows);
      setErrors([]);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const errs: string[] = [];
    const [header, ...rows] = importData;
    let imported = 0;
    rows.forEach((row, i) => {
      if (row.length < 4) { errs.push(`Row ${i + 2}: insufficient columns`); return; }
      try {
        if (type === 'quotations') {
          saveQuotation({
            id: crypto.randomUUID(),
            reference: row[0] || '',
            customerId: '',
            customerName: row[1] || '',
            quotationDate: row[2] || new Date().toISOString().split('T')[0],
            validUntil: row[3] || '',
            status: (row[4] as any) || 'draft',
            currency: 'INR',
            lines: [],
            globalDiscount: 0,
            globalDiscountType: 'percentage',
            subtotal: parseFloat(row[5]) || 0,
            discountAmount: 0,
            taxAmount: parseFloat(row[6]) || 0,
            total: parseFloat(row[7]) || 0,
            createdBy: 'Import',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currentVersion: 1,
            versions: [],
          });
        } else {
          saveSalesOrder({
            id: crypto.randomUUID(),
            reference: row[0] || '',
            customerId: '',
            customerName: row[1] || '',
            orderDate: row[2] || new Date().toISOString().split('T')[0],
            currency: 'INR',
            lines: [],
            subtotal: parseFloat(row[5]) || 0,
            discountAmount: 0,
            taxAmount: parseFloat(row[6]) || 0,
            total: parseFloat(row[7]) || 0,
            status: (row[3] as any) || 'draft',
            deliveryStatus: (row[4] as any) || 'pending',
            invoiceStatus: 'not_invoiced',
            activities: [],
            createdBy: 'Import',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        imported++;
      } catch (e: any) {
        errs.push(`Row ${i + 2}: ${e.message}`);
      }
    });
    setErrors(errs);
    if (imported > 0) {
      toast({ title: `Imported ${imported} ${type}` });
      onImportComplete?.();
      if (errs.length === 0) setImportOpen(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-1" /> Export
      </Button>
      <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
        <Upload className="h-4 w-4 mr-1" /> Import
      </Button>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import {type === 'quotations' ? 'Quotations' : 'Orders'} from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="text-sm" />
            {importData.length > 0 && (
              <p className="text-sm text-muted-foreground">{importData.length - 1} rows detected</p>
            )}
            {errors.length > 0 && (
              <div className="text-sm text-destructive space-y-1">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{e}</div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importData.length < 2}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}