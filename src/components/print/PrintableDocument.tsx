import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { PrintLetterhead } from './PrintLetterhead';
import { useCompanySettings } from '@/hooks/companySettings';

export type PrintableDocumentType =
  | 'sales_order'
  | 'quotation'
  | 'invoice'
  | 'delivery_note'
  | 'internal_transfer'
  | 'vendor_order'
  | 'work_order'
  | 'goods_receipt'
  | 'payment_receipt'
  | 'return_request'
  | 'credit_note'
  | 'refund_voucher'
  | 'exchange'
  | 'payslip'
  | 'correction_order'
  | 'internal_movement'
  | 'stock_count'
  | 'write_off';

const TITLES: Record<PrintableDocumentType, string> = {
  sales_order: 'Sales Order',
  quotation: 'Quotation',
  invoice: 'Tax Invoice',
  delivery_note: 'Delivery Note',
  internal_transfer: 'Internal Transfer',
  vendor_order: 'Vendor Order',
  work_order: 'Work Order',
  goods_receipt: 'Goods Receipt',
  payment_receipt: 'Payment Receipt',
  return_request: 'Return Request',
  credit_note: 'Credit Note',
  refund_voucher: 'Refund Voucher',
  exchange: 'Exchange Record',
  payslip: 'Payslip',
  correction_order: 'Correction Order',
  internal_movement: 'Internal Movement',
  stock_count: 'Stock Count',
  write_off: 'Write-Off',
};

interface PrintableDocumentProps {
  documentType: PrintableDocumentType;
  documentNumber: string;
  documentDate: string;
  isDraft: boolean;
  format?: 'a4' | 'thermal';
  elementId?: string;
  children: ReactNode;
}

export function PrintableDocument({
  documentType,
  documentNumber,
  documentDate,
  isDraft,
  format: fmt = 'a4',
  elementId = 'printable-document',
  children,
}: PrintableDocumentProps) {
  const { data: company } = useCompanySettings();
  const title = TITLES[documentType];

  const dateLabel = (() => {
    try {
      return format && documentDate ? formatDate(documentDate) : documentDate;
    } catch {
      return documentDate;
    }
  })();

  const thermalStyle =
    fmt === 'thermal'
      ? ({ ['--thermal-width' as never]: `${company?.thermal_width_mm ?? 80}mm` } as React.CSSProperties)
      : undefined;

  return (
    <div
      id={elementId}
      className={`printable-root relative mx-auto bg-white text-black ${
        fmt === 'thermal' ? 'printable-thermal' : 'max-w-3xl p-8'
      }`}
      style={thermalStyle}
    >
      {isDraft && <div className="print-watermark" aria-hidden />}

      {fmt === 'a4' && <PrintLetterhead />}

      <div className={`flex items-end justify-between mb-4 ${fmt === 'thermal' ? 'flex-col items-center text-center' : ''}`}>
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500">{title}</div>
          <div className="text-lg font-bold font-mono">{documentNumber}</div>
        </div>
        <div className={fmt === 'thermal' ? '' : 'text-right text-xs text-gray-700'}>
          <div>{dateLabel}</div>
        </div>
      </div>

      <div className="relative z-10">{children}</div>

      {company?.letterhead_footer && (
        <div className="border-t mt-8 pt-3 text-[10px] text-gray-600 text-center italic">
          {company.letterhead_footer}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}