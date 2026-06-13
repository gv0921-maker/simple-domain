import { PrintableDocument } from '../PrintableDocument';
import type { WorkOrderRow } from '@/lib/services/manufacturing/workOrders';

interface Props {
  wo: WorkOrderRow;
  isDraft?: boolean;
}

export function WorkOrderPrint({ wo, isDraft = false }: Props) {
  return (
    <PrintableDocument
      documentType="work_order"
      documentNumber={wo.wo_number}
      documentDate={wo.created_at}
      isDraft={isDraft || wo.current_stage === 'draft'}
    >
      <div className="mb-4 grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Product</div>
          <div className="font-semibold">{wo.product?.name ?? wo.product_id}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">Quantity</div>
          <div className="font-semibold">{wo.quantity}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wide mb-1">ETA</div>
          <div className="font-semibold">{wo.eta_date ?? '—'}</div>
        </div>
      </div>

      {wo.linked_sales_order?.reference && (
        <div className="mb-3 text-xs">
          <span className="text-gray-500">Linked Sales Order: </span>
          <span className="font-semibold">{wo.linked_sales_order.reference}</span>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 text-xs border p-3">
        <Spec label="Size" value={wo.size_spec} />
        <Spec label="Colour / Polish" value={wo.colour_polish_spec} />
        <Spec label="Fabric" value={wo.fabric_spec} />
        <Spec label="Customization Notes" value={wo.customization_notes} />
      </div>

      {wo.reference_images.length > 0 && (
        <div className="mb-6">
          <div className="text-gray-500 uppercase tracking-wide text-xs mb-2">Reference Images</div>
          <div className="grid grid-cols-4 gap-2">
            {wo.reference_images.map((url, i) => (
              <img key={i} src={url} alt={`Ref ${i + 1}`} className="w-full h-24 object-cover border" />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs">
        <div className="text-gray-500 uppercase tracking-wide mb-1">Stage History</div>
        <table className="w-full text-xs border-collapse">
          <tbody>
            <Row label="Placed at Factory" value={wo.placed_at} />
            <Row label="Work Start" value={(wo as any).work_start_at ?? null} />
            <Row label="BOM Entered" value={wo.bom_entered_at} />
            <Row label="Materials Consumed" value={wo.materials_consumed_at} />
            <Row label="Factory Completion" value={wo.factory_completion_at} />
            <Row label="Received at Store" value={wo.received_at_store_at} />
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-12 text-xs">
        <div><div className="border-t border-black pt-2">Authorised By</div></div>
        <div><div className="border-t border-black pt-2">Factory Acknowledgement</div></div>
      </div>
    </PrintableDocument>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="font-medium whitespace-pre-wrap">{value || '—'}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <tr className="border-b">
      <td className="py-1 pr-2 text-gray-500">{label}</td>
      <td className="py-1 font-medium">{value ? new Date(value).toLocaleString('en-IN') : '—'}</td>
    </tr>
  );
}