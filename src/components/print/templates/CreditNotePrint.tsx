import { PrintableDocument } from '../PrintableDocument';
import type { CreditNote } from '@/lib/services/creditNotes';
import { format, parseISO } from 'date-fns';

interface Props { cn: CreditNote; isDraft?: boolean }

export function CreditNotePrint({ cn, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="credit_note"
      documentNumber={cn.cn_number}
      documentDate={cn.issue_date}
      isDraft={isDraft}
    >
      <div className="mb-4 text-center">
        <div className="text-lg font-bold uppercase tracking-wider">Credit Note</div>
        <div className="text-xs text-gray-500">{cn.cn_number}</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Customer</div>
          <div className="font-semibold">{cn.customer_name_snapshot ?? cn.customer?.name ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Source</div>
          <div className="font-semibold">Return: {cn.source_return?.rt_number ?? cn.source_return_request_id}</div>
          <div className="text-gray-500">Invoice: {cn.source_invoice?.reference ?? cn.source_invoice_id}</div>
        </div>
      </div>

      <div className="border-y-2 border-black py-3 my-6 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs uppercase text-gray-500">Amount</div>
          <div className="text-2xl font-bold">₹{Number(cn.amount).toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Issued</div>
          <div className="font-semibold">{format(parseISO(cn.issue_date), 'd MMM yyyy')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Expires</div>
          <div className="font-semibold">{format(parseISO(cn.expiry_date), 'd MMM yyyy')}</div>
        </div>
      </div>

      {cn.notes && (
        <div className="text-xs mb-4">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Notes</div>
          <div>{cn.notes}</div>
        </div>
      )}

      <div className="text-xs mb-6 p-3 border rounded">
        <div className="font-semibold mb-1">Terms</div>
        <div className="text-gray-700">
          Redeemable within 6 months of issue date for any GLF purchase.
          Not exchangeable for cash. Non-transferable.
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="border-t border-black pt-1">Customer Acknowledgement</div>
        </div>
        <div className="text-right">
          <div className="border-t border-black pt-1">Authorised Signatory (GLF)</div>
        </div>
      </div>
    </PrintableDocument>
  );
}
