import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDeliveryNote } from '@/hooks/inventory/deliveryNotes';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function DeliveryNotePrint() {
  const { id } = useParams<{ id: string }>();
  const { data: note, isLoading } = useDeliveryNote(id);

  useEffect(() => {
    document.title = note ? `Delivery Note ${note.reference}` : 'Delivery Note';
  }, [note]);

  if (isLoading || !note) {
    return <div className="p-8">{isLoading ? 'Loading…' : 'Delivery note not found.'}</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div className="no-print flex justify-end gap-2 p-4 border-b">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-8 text-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <div className="text-3xl font-bold tracking-tight">GLF</div>
            <div className="text-xs text-gray-600">Goods Logistics & Fulfilment</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">DELIVERY NOTE</div>
            <div className="text-sm mt-1">{note.reference}</div>
            <div className="text-xs text-gray-600">
              {format(parseISO(note.deliveryDate ?? note.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Delivered To</div>
          <div className="font-semibold">{note.customerDeliveryName || '—'}</div>
          <div className="whitespace-pre-line text-gray-700">{note.customerDeliveryAddress || '—'}</div>
          {note.customerDeliveryPhone && (
            <div className="text-gray-700">Phone: {note.customerDeliveryPhone}</div>
          )}
        </div>

        {/* Products */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Product</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-left py-2">Unit</th>
              <th className="text-left py-2">Serial Numbers</th>
            </tr>
          </thead>
          <tbody>
            {note.productsJson.map((p, i) => (
              <tr key={`${p.product_id}-${i}`} className="border-b">
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{p.product_name}</td>
                <td className="py-2 text-right">{p.quantity}</td>
                <td className="py-2">{p.unit}</td>
                <td className="py-2 font-mono text-xs">
                  {p.serial_numbers.length ? p.serial_numbers.join(', ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Audit */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
          <div>
            <div className="text-gray-500 uppercase tracking-wide">Created By</div>
            <div className="font-mono">{note.createdBy ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-500 uppercase tracking-wide">QC By</div>
            <div className="font-mono">{note.qcBy ?? '—'}</div>
          </div>
        </div>

        {/* Declaration */}
        <div className="border-t pt-4 mb-12 text-xs italic text-gray-700">
          Received in good condition. The goods listed above have been delivered, inspected
          and accepted by the customer named below.
        </div>

        {/* Signature */}
        <div className="mt-16">
          <div className="border-b border-black w-72 mb-1">&nbsp;</div>
          <div className="text-xs text-gray-600">Customer Signature</div>
          <div className="font-semibold mt-1">{note.customerDeliveryName || ''}</div>
        </div>
      </div>
    </div>
  );
}