import { PrintableDocument } from '../PrintableDocument';

interface Props {
  note: any;
  isDraft?: boolean;
}

export function DeliveryNotePrint({ note, isDraft = false }: Props) {
  const items = note?.productsJson ?? note?.products_json ?? [];

  return (
    <PrintableDocument
      documentType="delivery_note"
      documentNumber={note?.reference ?? '—'}
      documentDate={note?.deliveryDate ?? note?.delivery_date ?? note?.createdAt ?? note?.created_at ?? ''}
      isDraft={isDraft}
    >
      <div className="mb-6 text-xs">
        <div className="text-gray-500 uppercase tracking-wide mb-1">Delivered To</div>
        <div className="font-semibold">
          {note?.customerDeliveryName || note?.customer_delivery_name || '—'}
        </div>
        <div className="whitespace-pre-line text-gray-700">
          {note?.customerDeliveryAddress || note?.customer_delivery_address || '—'}
        </div>
        {(note?.customerDeliveryPhone || note?.customer_delivery_phone) && (
          <div className="text-gray-700">
            Phone: {note?.customerDeliveryPhone || note?.customer_delivery_phone}
          </div>
        )}
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Product</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-left py-2">Unit</th>
            <th className="text-left py-2">Serial Numbers</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p: any, i: number) => (
            <tr key={`${p.product_id}-${i}`} className="border-b">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{p.product_name}</td>
              <td className="py-2 text-right">{p.quantity}</td>
              <td className="py-2">{p.unit}</td>
              <td className="py-2 font-mono text-[10px]">
                {(p.serial_numbers ?? []).length ? (p.serial_numbers ?? []).join(', ') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t pt-4 mb-12 text-xs italic text-gray-700">
        Received in good condition. The goods listed above have been delivered,
        inspected and accepted by the customer named below.
      </div>

      <div className="mt-16">
        <div className="border-b border-black w-72 mb-1">&nbsp;</div>
        <div className="text-xs text-gray-600">Customer Signature</div>
        <div className="font-semibold mt-1">
          {note?.customerDeliveryName || note?.customer_delivery_name || ''}
        </div>
      </div>
    </PrintableDocument>
  );
}