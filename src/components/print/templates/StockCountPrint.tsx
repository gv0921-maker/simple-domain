import { PrintableDocument } from '../PrintableDocument';
import { MONTH_LABELS, type StockCount, type StockCountItem } from '@/lib/services/inventory/stockCounts';

interface Props {
  count: StockCount;
  items: StockCountItem[];
  isDraft?: boolean;
}

export function StockCountPrint({ count, items, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="stock_count"
      documentNumber={count.count_number}
      documentDate={count.created_at}
      isDraft={isDraft}
    >
      <div className="mb-4 grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Period</div>
          <div className="font-semibold">{MONTH_LABELS[count.count_period_month - 1]} {count.count_period_year}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Type</div>
          <div className="font-semibold capitalize">{count.count_type}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Warehouse</div>
          <div className="font-semibold">{count.warehouse_id ? count.warehouse_id : 'All warehouses'}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Serial</th>
            <th className="text-left py-2">Product</th>
            <th className="text-left py-2">Expected Location</th>
            <th className="text-center py-2 w-12">✓</th>
            <th className="text-left py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{i + 1}</td>
              <td className="py-2 font-mono text-[10px]">{it.serial_number}</td>
              <td className="py-2">{it.product?.name ?? it.product_id}</td>
              <td className="py-2 capitalize">{(it.expected_location_type ?? '—').replace(/_/g, ' ')}</td>
              <td className="py-2 text-center">☐</td>
              <td className="py-2">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div><div className="border-t border-black pt-2">Counter Signature</div></div>
        <div><div className="border-t border-black pt-2">Supervisor Signature</div></div>
      </div>
    </PrintableDocument>
  );
}