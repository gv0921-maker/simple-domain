import { PrintableDocument } from '../PrintableDocument';
import type { ReturnRequest } from '@/lib/services/returns';
import { format, parseISO } from 'date-fns';

interface Props {
  rt: ReturnRequest;
  isDraft?: boolean;
}

export function ReturnRequestPrint({ rt, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="return_request"
      documentNumber={rt.rt_number}
      documentDate={rt.created_at}
      isDraft={isDraft}
    >
      <div className="mb-4 text-center">
        <div className="text-lg font-bold uppercase tracking-wider">Return Request</div>
        <div className="text-xs text-gray-500">{rt.rt_number}</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Customer</div>
          <div className="font-semibold">{rt.customer_name_snapshot ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Source Invoice</div>
          <div className="font-semibold">{rt.source_invoice?.reference ?? '—'}</div>
          {rt.source_sales_order?.reference && (
            <div className="text-gray-500 mt-1">SO: {rt.source_sales_order.reference}</div>
          )}
          <div className="text-gray-500 mt-1">Status: <span className="font-semibold uppercase">{rt.request_status}</span></div>
        </div>
      </div>

      <div className="mb-4 text-xs">
        <div className="text-gray-500 uppercase tracking-wide mb-1">Reason</div>
        <div className="font-semibold">{rt.customer_reported_reason}</div>
        {rt.customer_reported_issue_description && (
          <div className="text-gray-600 mt-1 whitespace-pre-wrap">{rt.customer_reported_issue_description}</div>
        )}
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Serial</th>
            <th className="text-left py-2">Product</th>
            <th className="text-right py-2">Original Price</th>
            <th className="text-left py-2">Condition</th>
          </tr>
        </thead>
        <tbody>
          {(rt.items ?? []).map((it, i) => (
            <tr key={it.id} className="border-b align-top">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{it.serial_number}</td>
              <td className="py-2">{it.product?.name ?? it.product_id}</td>
              <td className="py-2 text-right">₹{Number(it.original_unit_price).toLocaleString('en-IN')}</td>
              <td className="py-2">{it.condition_grade ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-6 text-xs">
        <div className="text-gray-500 uppercase tracking-wide mb-1">Approval History</div>
        <div>Requested: {format(parseISO(rt.requested_at), "d MMM yyyy 'at' HH:mm")}</div>
        {rt.approved_at && <div>Approved: {format(parseISO(rt.approved_at), "d MMM yyyy 'at' HH:mm")}</div>}
        {rt.rejected_at && <div>Rejected: {format(parseISO(rt.rejected_at), "d MMM yyyy 'at' HH:mm")} — {rt.rejection_reason}</div>}
        {rt.received_at && <div>Received: {format(parseISO(rt.received_at), "d MMM yyyy 'at' HH:mm")}</div>}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="border-t border-black pt-1">Customer Signature</div>
          <div className="text-gray-500">(Goods received back acknowledgment)</div>
        </div>
        <div className="text-right">
          <div className="border-t border-black pt-1">Authorised Signatory (GLF)</div>
        </div>
      </div>
    </PrintableDocument>
  );
}