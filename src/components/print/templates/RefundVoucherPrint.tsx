import { PrintableDocument } from '../PrintableDocument';
import type { Refund } from '@/lib/services/refunds';
import { REFUND_MODE_LABEL } from '@/lib/services/refunds';
import { format, parseISO } from 'date-fns';

interface Props { refund: Refund; isDraft?: boolean }

export function RefundVoucherPrint({ refund, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="refund_voucher"
      documentNumber={refund.refund_number}
      documentDate={refund.refund_date}
      isDraft={isDraft}
    >
      <div className="mb-4 text-center">
        <div className="text-lg font-bold uppercase tracking-wider">Refund Voucher</div>
        <div className="text-xs text-gray-500">{refund.refund_number}</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Paid To</div>
          <div className="font-semibold">{refund.customer_name_snapshot ?? refund.customer?.name ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Source</div>
          <div className="font-semibold">Return: {refund.source_return?.rt_number ?? refund.source_return_request_id}</div>
          <div className="text-gray-500">Invoice: {refund.source_invoice?.reference ?? refund.source_invoice_id}</div>
        </div>
      </div>

      <div className="border-y-2 border-black py-3 my-6 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs uppercase text-gray-500">Amount Refunded</div>
          <div className="text-2xl font-bold">₹{Number(refund.amount).toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Date</div>
          <div className="font-semibold">{format(parseISO(refund.refund_date), "d MMM yyyy 'at' HH:mm")}</div>
        </div>
      </div>

      <table className="w-full text-xs mb-6">
        <tbody>
          <tr><td className="py-1 text-gray-500">Mode</td><td className="py-1 font-semibold">{REFUND_MODE_LABEL[refund.refund_mode]}</td></tr>
          <tr><td className="py-1 text-gray-500">Paid From</td><td className="py-1 font-semibold">{refund.payment_account?.account_name ?? '—'}</td></tr>
          {refund.reference_number && (
            <tr><td className="py-1 text-gray-500">Reference</td><td className="py-1 font-semibold">{refund.reference_number}</td></tr>
          )}
          {refund.notes && (
            <tr><td className="py-1 text-gray-500 align-top">Notes</td><td className="py-1">{refund.notes}</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="border-t border-black pt-1">Received By (Customer)</div>
        </div>
        <div className="text-right">
          <div className="border-t border-black pt-1">Authorised Signatory (GLF)</div>
        </div>
      </div>
    </PrintableDocument>
  );
}
