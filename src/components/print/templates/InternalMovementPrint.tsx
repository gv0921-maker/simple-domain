import { PrintableDocument } from '../PrintableDocument';
import { MOVEMENT_TYPE_LABEL, type InternalMovement, type InternalMovementItem } from '@/lib/services/inventory/internalMovements';

interface Props {
  movement: InternalMovement;
  items: InternalMovementItem[];
  isDraft?: boolean;
}

export function InternalMovementPrint({ movement, items, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="internal_movement"
      documentNumber={movement.movement_number}
      documentDate={movement.created_at}
      isDraft={isDraft}
    >
      <div className="mb-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Movement Type</div>
          <div className="font-semibold">{MOVEMENT_TYPE_LABEL[movement.movement_type]}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">From → To</div>
          <div className="font-semibold capitalize">
            {movement.from_location_type ?? '—'} → {movement.to_location_type ?? '—'}
          </div>
        </div>
        {movement.reason && (
          <div className="col-span-2">
            <div className="text-gray-500 uppercase tracking-wide mb-1">Reason</div>
            <div>{movement.reason}</div>
          </div>
        )}
        {movement.notes && (
          <div className="col-span-2">
            <div className="text-gray-500 uppercase tracking-wide mb-1">Notes</div>
            <div>{movement.notes}</div>
          </div>
        )}
      </div>

      <table className="w-full border-collapse text-xs mb-6">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Serial</th>
            <th className="text-left py-2">Product</th>
            <th className="text-left py-2">Source Scan</th>
            <th className="text-left py-2">Destination Scan</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{i + 1}</td>
              <td className="py-2 font-mono text-[10px]">{it.serial_number}</td>
              <td className="py-2">{it.product?.name ?? it.product_id}</td>
              <td className="py-2">{it.scanned_at_source ? '✓' : '—'}</td>
              <td className="py-2">{it.scanned_at_destination ? '✓' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="border-t border-black pt-2">Authorized By</div>
        </div>
        <div>
          <div className="border-t border-black pt-2">Date</div>
        </div>
      </div>
    </PrintableDocument>
  );
}