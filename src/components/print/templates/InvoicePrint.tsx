import { PrintableDocument } from '../PrintableDocument';
import { fmtINR, numberToIndianWords } from './_helpers';

interface Props {
  invoice: any;
  isDraft?: boolean;
}

export function InvoicePrint({ invoice, isDraft = false }: Props) {
  const lines = invoice?.invoice_lines ?? [];
  const totalCGST = lines.reduce((s: number, l: any) => s + Number(l.cgst_amount ?? 0), 0);
  const totalSGST = lines.reduce((s: number, l: any) => s + Number(l.sgst_amount ?? 0), 0);
  const totalIGST = lines.reduce((s: number, l: any) => s + Number(l.igst_amount ?? 0), 0);
  const hasIGST = totalIGST > 0 && totalCGST === 0 && totalSGST === 0;

  return (
    <PrintableDocument
      documentType="invoice"
      documentNumber={invoice?.reference ?? '—'}
      documentDate={invoice?.issue_date ?? invoice?.created_at ?? ''}
      isDraft={isDraft}
    >
      <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Bill To</div>
          <div className="font-semibold">{invoice?.bill_to_name || '—'}</div>
          <div className="whitespace-pre-line text-gray-700">{invoice?.bill_to_address || '—'}</div>
          {invoice?.bill_to_gstin && <div className="text-gray-700">GSTIN: {invoice.bill_to_gstin}</div>}
        </div>
        <div className="text-right">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Invoice Details</div>
          {invoice?.due_date && <div>Due: {invoice.due_date}</div>}
          {invoice?.po_number && <div>PO: {invoice.po_number}</div>}
        </div>
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Description</th>
            <th className="text-left py-2">HSN</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Rate</th>
            <th className="text-right py-2">Subtotal</th>
            {hasIGST
              ? <th className="text-right py-2">IGST</th>
              : <><th className="text-right py-2">CGST</th><th className="text-right py-2">SGST</th></>}
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l: any, i: number) => (
            <tr key={l.id ?? i} className="border-b">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{l.description}</td>
              <td className="py-2 font-mono">{l.hsn_code ?? '—'}</td>
              <td className="py-2 text-right">{Number(l.quantity ?? 0)}</td>
              <td className="py-2 text-right">{fmtINR(l.unit_price)}</td>
              <td className="py-2 text-right">{fmtINR(l.subtotal)}</td>
              {hasIGST ? (
                <td className="py-2 text-right">{fmtINR(l.igst_amount)}</td>
              ) : (
                <>
                  <td className="py-2 text-right">{fmtINR(l.cgst_amount)}</td>
                  <td className="py-2 text-right">{fmtINR(l.sgst_amount)}</td>
                </>
              )}
              <td className="py-2 text-right font-medium">{fmtINR(l.final_amount ?? l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-4">
        <div className="w-full max-w-xs text-xs space-y-1">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{fmtINR(invoice?.subtotal)}</span></div>
          {hasIGST
            ? <div className="flex justify-between"><span className="text-gray-600">IGST</span><span>{fmtINR(totalIGST)}</span></div>
            : <>
                <div className="flex justify-between"><span className="text-gray-600">CGST</span><span>{fmtINR(totalCGST)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">SGST</span><span>{fmtINR(totalSGST)}</span></div>
              </>}
          <div className="flex justify-between border-t pt-1 font-bold text-base">
            <span>Grand Total</span><span>{fmtINR(invoice?.total)}</span>
          </div>
          <div className="flex justify-between text-success"><span>Paid</span><span>{fmtINR(invoice?.paid_amount)}</span></div>
        </div>
      </div>

      <div className="text-xs italic border-t pt-2 mb-8">
        <span className="font-semibold">Amount in words:</span> {numberToIndianWords(Number(invoice?.total ?? 0))}
      </div>

      <div className="grid grid-cols-2 gap-12 mt-12 text-xs">
        <div>
          <div className="text-gray-600 mb-12">Customer Acknowledgement</div>
          <div className="border-b border-black">&nbsp;</div>
        </div>
        <div className="text-right">
          <div className="text-gray-600 mb-12">For {invoice?.company_name ?? 'GLF'}</div>
          <div className="border-b border-black">&nbsp;</div>
          <div className="text-gray-600 mt-1">Authorized Signatory</div>
        </div>
      </div>
    </PrintableDocument>
  );
}