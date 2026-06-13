import { PrintableDocument } from '../PrintableDocument';
import type { ExchangeRow } from '@/lib/services/returns/resolution';
import { format, parseISO } from 'date-fns';

interface Props {
  exchange: ExchangeRow & {
    original_serial?: string | null;
    replacement_serial?: string | null;
    customer_name?: string | null;
    source_invoice_ref?: string | null;
    source_rt_number?: string | null;
  };
  isDraft?: boolean;
}

export function ExchangePrint({ exchange, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="exchange"
      documentNumber={exchange.exchange_number}
      documentDate={exchange.created_at}
      isDraft={isDraft}
    >
      <div className="mb-4 text-center">
        <div className="text-lg font-bold uppercase tracking-wider">Exchange Record</div>
        <div className="text-xs text-gray-500">{exchange.exchange_number}</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Customer</div>
          <div className="font-semibold">{exchange.customer_name ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Source</div>
          <div className="font-semibold">Return: {exchange.source_rt_number ?? exchange.source_return_request_id}</div>
          <div className="text-gray-500">Invoice: {exchange.source_invoice_ref ?? exchange.source_invoice_id}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2"></th>
            <th className="text-left py-2">Original Item</th>
            <th className="text-left py-2">Replacement Item</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2 text-gray-500">Product</td>
            <td className="py-2">—</td>
            <td className="py-2 font-semibold">{exchange.replacement_product?.name ?? exchange.replacement_product_id}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 text-gray-500">Serial</td>
            <td className="py-2">{exchange.original_serial ?? exchange.original_serial_id}</td>
            <td className="py-2">{exchange.replacement_serial ?? exchange.replacement_serial_id ?? '—'}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Price</td>
            <td className="py-2">₹{Number(exchange.original_unit_price).toLocaleString('en-IN')}</td>
            <td className="py-2">₹{Number(exchange.replacement_unit_price).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div className="border-y-2 border-black py-3 my-6 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs uppercase text-gray-500">Price Difference</div>
          <div className="text-xl font-bold">₹{Number(exchange.price_difference).toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Settled</div>
          <div className="font-semibold">{exchange.price_difference_settled ? 'Yes' : 'Pending'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Status</div>
          <div className="font-semibold uppercase">{exchange.status}</div>
        </div>
      </div>

      {exchange.notes && (
        <div className="text-xs mb-4">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Notes</div>
          <div>{exchange.notes}</div>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-6">
        Created: {format(parseISO(exchange.created_at), "d MMM yyyy 'at' HH:mm")}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="border-t border-black pt-1">Customer Signature</div>
        </div>
        <div className="text-right">
          <div className="border-t border-black pt-1">Authorised Signatory (GLF)</div>
        </div>
      </div>
    </PrintableDocument>
  );
}
