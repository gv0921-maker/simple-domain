import { PrintableDocument } from '../PrintableDocument';
import type { WriteOffRecord, WriteOffItem } from '@/lib/services/inventory/writeOffs';

interface Props {
  record: WriteOffRecord;
  items: WriteOffItem[];
  isDraft?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  damage: 'Damage',
  loss: 'Loss',
  theft: 'Theft',
  obsolete: 'Obsolete',
  scrap: 'Scrap',
  count_missing: 'Missing in Stock Count',
  qc_unsalvageable: 'QC Unsalvageable',
  other: 'Other',
};

export function WriteOffPrint({ record, items, isDraft = false }: Props) {
  const total = items.reduce((s, i) => s + Number(i.unit_cost_value || 0), 0);
  return (
    <PrintableDocument
      documentType="write_off"
      documentNumber={record.wf_number}
      documentDate={record.created_at}
      isDraft={isDraft || record.status === 'draft'}
    >
      <div className="mb-4 grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Type</div>
          <div className="font-semibold">{TYPE_LABELS[record.write_off_type] ?? record.write_off_type}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Status</div>
          <div className="font-semibold capitalize">{record.status}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Source</div>
          <div className="font-semibold">{record.source_document_reference ?? record.source_type ?? '—'}</div>
        </div>
      </div>

      <div className="mb-4 text-xs">
        <div className="text-gray-500 uppercase tracking-wide mb-1">Reason</div>
        <div className="border p-2 whitespace-pre-wrap">{record.reason || '—'}</div>
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Serial</th>
            <th className="text-left py-2">Product</th>
            <th className="text-right py-2">Unit Cost (₹)</th>
            <th className="text-left py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{i + 1}</td>
              <td className="py-2 font-mono text-[10px]">{it.serial_number}</td>
              <td className="py-2">{it.product?.name ?? it.product_id}</td>
              <td className="py-2 text-right">{Number(it.unit_cost_value || 0).toLocaleString('en-IN')}</td>
              <td className="py-2">{it.item_specific_notes ?? ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-semibold">
            <td colSpan={3} className="py-2 text-right">Total Value</td>
            <td className="py-2 text-right">₹ {total.toLocaleString('en-IN')}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      {record.evidence_photos.length > 0 && (
        <div className="mb-6">
          <div className="text-gray-500 uppercase tracking-wide text-xs mb-2">Evidence</div>
          <div className="grid grid-cols-4 gap-2">
            {record.evidence_photos.map((url, i) => (
              <img key={i} src={url} alt={`Evidence ${i + 1}`} className="w-full h-24 object-cover border" />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div><div className="border-t border-black pt-2">Initiated By</div></div>
        <div>
          <div className="border-t border-black pt-2">
            Super Admin Approval {record.approved_at ? `(${new Date(record.approved_at).toLocaleDateString('en-IN')})` : ''}
          </div>
        </div>
      </div>
    </PrintableDocument>
  );
}
