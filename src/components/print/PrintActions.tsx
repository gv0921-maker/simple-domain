import { Button } from '@/components/ui/button';
import { Printer, Download, Mail } from 'lucide-react';
import { generatePDF, buildPrintFilename, type PrintFormat } from '@/lib/print/pdfGenerator';
import { toast } from 'sonner';
import { useState } from 'react';
import { useCompanySettings } from '@/hooks/companySettings';

interface PrintActionsProps {
  elementId: string;
  documentType: string;
  documentNumber: string;
  format?: PrintFormat;
  emailTo?: string;
}

export function PrintActions({
  elementId,
  documentType,
  documentNumber,
  format = 'a4',
  emailTo,
}: PrintActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const { data: company } = useCompanySettings();

  const filename = buildPrintFilename(documentType, documentNumber);

  async function handleDownload() {
    try {
      setDownloading(true);
      await generatePDF(elementId, filename, format, company?.thermal_width_mm ?? 80);
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  }

  function handleEmail() {
    const subject = encodeURIComponent(`${documentType.replace(/_/g, ' ')} ${documentNumber}`);
    const body = encodeURIComponent(
      `Please find ${documentType.replace(/_/g, ' ')} ${documentNumber} attached.\n\n— ${company?.company_name ?? ''}`,
    );
    const to = emailTo ? encodeURIComponent(emailTo) : '';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    toast.info('Attach the downloaded PDF to your email manually.');
  }

  return (
    <div className="no-print flex justify-end gap-2 p-4 border-b bg-background sticky top-0 z-10">
      <Button variant="outline" onClick={handleEmail}>
        <Mail className="h-4 w-4 mr-2" /> Email
      </Button>
      <Button variant="outline" onClick={handleDownload} disabled={downloading}>
        <Download className="h-4 w-4 mr-2" />
        {downloading ? 'Generating…' : 'Download PDF'}
      </Button>
      <Button onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-2" /> Print
      </Button>
    </div>
  );
}