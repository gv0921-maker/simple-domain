import { PrintableDocument } from '../PrintableDocument';
import type { VendorOrder, VendorOrderLine } from '@/lib/services/vendor-orders';

interface Props {
  vo: VendorOrder;
  lines: VendorOrderLine[];
  isDraft?: boolean;
}

export function VendorOrderPrint({ vo, lines, isDraft = false }: Props) {
  const v = vo.vendor;
  return (
    <PrintableDocument
      documentType="vendor_order"
      documentNumber={vo.vo_number}
      documentDate={vo.created_at}
      isDraft={isDraft}
    >
      <div className="mb-4 text-center">
        <div className="text-lg font-bold uppercase tracking-wider">Purchase Order</div>
        <div className="text-xs text-gray-500">{vo.vo_number}</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Vendor</div>
          <div className="font-semibold">{v?.name ?? '—'}</div>
          {v?.contact_person && <div>{v.contact_person}</div>}
          {v?.phone && <div>{v.phone}</div>}
          {v?.email && <div>{v.email}</div>}
          {v?.address && <div className="whitespace-pre-wrap">{v.address}</div>}
          {v?.gstin && <div>GSTIN: {v.gstin}</div>}
        </div>
        <div className="text-right">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Order Mode</div>
          <div className="font-semibold capitalize">{vo.order_mode}</div>
          {vo.linked_sales_order?.reference && (
            <div className="mt-2 text-gray-500">
              Linked SO: <span className="font-semibold">{vo.linked_sales_order.reference}</span>
            </div>
          )}
          <div className="mt-2 text-gray-500">
            ETA: <span className="font-semibold">{vo.eta_date}</span>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Product</th>
            <th className="text-left py-2">Specifications</th>
            <th className="text-right py-2">Qty</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.id} className="border-b align-top">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{l.product?.name ?? l.product_id}</td>
              <td className="py-2 text-[10px]">
                {l.size_spec && <div>Size: {l.size_spec}</div>}
                {l.colour_polish_spec && <div>Colour/Polish: {l.colour_polish_spec}</div>}
                {l.fabric_spec && <div>Fabric: {l.fabric_spec}</div>}
                {l.customization_notes && <div>{l.customization_notes}</div>}
              </td>
              <td className="py-2 text-right">{l.quantity_ordered}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {vo.notes && (
        <div className="mb-6 text-xs">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Notes / Terms</div>
          <div className="whitespace-pre-wrap">{vo.notes}</div>
        </div>
      )}

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="border-t border-black pt-2">Authorized Signatory</div>
        </div>
        <div>
          <div className="border-t border-black pt-2">Date</div>
        </div>
      </div>
    </PrintableDocument>
  );
}