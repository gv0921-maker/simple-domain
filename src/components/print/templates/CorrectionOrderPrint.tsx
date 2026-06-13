import { PrintableDocument } from '../PrintableDocument';

interface Props {
  co: any;
  items: any[];
  isDraft?: boolean;
}

export function CorrectionOrderPrint({ co, items, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="correction_order"
      documentNumber={co?.co_number ?? '—'}
      documentDate={co?.sent_at ?? co?.created_at ?? ''}
      isDraft={isDraft}
    >
      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Addressed To</div>
          <div className="font-semibold">{co?.addressed_to_name || '—'}</div>
          <div className="text-gray-700 capitalize">({co?.addressed_to_type})</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Source</div>
          <div className="font-semibold">{co?.source_document_reference || '—'}</div>
          <div className="text-gray-700 capitalize">
            Correction Type: <strong>{co?.correction_type}</strong>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Serial</th>
            <th className="text-left py-2">Product</th>
            <th className="text-left py-2">QC Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: any, i: number) => (
            <tr key={it.id} className="border-b align-top">
              <td className="py-2">{i + 1}</td>
              <td className="py-2 font-mono text-[10px]">{it.serial_number}</td>
              <td className="py-2">{it.product?.name ?? it.product_id}</td>
              <td className="py-2">{it.original_qc_notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {co?.notes && (
        <div className="border-t pt-4 mb-12 text-xs">
          <div className="text-gray-500 uppercase tracking-wide mb-1">Notes</div>
          <div className="whitespace-pre-line">{co.notes}</div>
        </div>
      )}

      <div className="mt-16">
        <div className="border-b border-black w-72 mb-1">&nbsp;</div>
        <div className="text-xs text-gray-600">Authorized Signatory</div>
      </div>
    </PrintableDocument>
  );
}