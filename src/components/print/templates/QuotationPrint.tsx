import { PrintableDocument } from '../PrintableDocument';
import { fmtINR } from './_helpers';
import { useCompanySettings } from '@/hooks/companySettings';
import { format, parseISO } from 'date-fns';

interface Props {
  quotation: any;
  lines?: any[];
  isDraft?: boolean;
}

export function QuotationPrint({ quotation, lines = [], isDraft = false }: Props) {
  const { data: company } = useCompanySettings();
  const items = lines.length ? lines : quotation?.quotation_lines ?? [];

  const validUntil = quotation?.valid_until
    ? safeDate(quotation.valid_until)
    : null;

  return (
    <PrintableDocument
      documentType="quotation"
      documentNumber={quotation?.reference ?? '—'}
      documentDate={quotation?.quotation_date ?? quotation?.created_at ?? ''}
      isDraft={isDraft}
    >
      {validUntil && (
        <div className="mb-4 inline-block bg-yellow-100 border border-yellow-400 px-3 py-1 text-xs font-semibold">
          VALID UNTIL: {validUntil}
        </div>
      )}

      <div className="mb-6 text-xs">
        <div className="text-gray-500 uppercase tracking-wide mb-1">To</div>
        <div className="font-semibold">{quotation?.billing_name || quotation?.customer_name || '—'}</div>
        <div className="whitespace-pre-line text-gray-700">{quotation?.billing_address || '—'}</div>
        {quotation?.billing_gstin && <div className="text-gray-700">GSTIN: {quotation.billing_gstin}</div>}
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Unit Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l: any, i: number) => (
            <tr key={l.id ?? i} className="border-b">
              <td className="py-2 align-top">{i + 1}</td>
              <td className="py-2 align-top">{l.product_name || l.description || '—'}</td>
              <td className="py-2 text-right align-top">{Number(l.quantity ?? 0)}</td>
              <td className="py-2 text-right align-top">{fmtINR(l.unit_price)}</td>
              <td className="py-2 text-right align-top font-medium">
                {fmtINR(l.final_amount ?? l.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-full max-w-xs text-xs space-y-1">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{fmtINR(quotation?.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>{fmtINR(quotation?.tax_amount)}</span></div>
          <div className="flex justify-between border-t pt-1 font-bold text-base">
            <span>Total</span><span>{fmtINR(quotation?.total)}</span>
          </div>
        </div>
      </div>

      {company?.standard_terms && (
        <div className="mb-6 page-break-avoid">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Terms &amp; Conditions</div>
          <div className="text-[10px] text-gray-700 whitespace-pre-line">{company.standard_terms}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-12 mt-12 text-xs">
        <div>
          <div className="border-b border-black h-12">&nbsp;</div>
          <div className="text-gray-600 mt-1">Accepted By (Customer)</div>
          <div className="text-[10px] text-gray-500">Name / Date / Signature</div>
        </div>
        <div>
          <div className="border-b border-black h-12">&nbsp;</div>
          <div className="text-gray-600 mt-1">Authorized Signatory</div>
        </div>
      </div>
    </PrintableDocument>
  );
}

function safeDate(v: string) {
  try { return format(parseISO(v), 'MMM d, yyyy'); } catch { return v; }
}