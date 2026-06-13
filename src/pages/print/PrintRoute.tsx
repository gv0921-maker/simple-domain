import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PrintActions } from '@/components/print/PrintActions';
import { SalesOrderPrint } from '@/components/print/templates/SalesOrderPrint';
import { QuotationPrint } from '@/components/print/templates/QuotationPrint';
import { InvoicePrint } from '@/components/print/templates/InvoicePrint';
import { DeliveryNotePrint } from '@/components/print/templates/DeliveryNotePrint';
import { PaymentReceiptPrint } from '@/components/print/templates/PaymentReceiptPrint';
import { CorrectionOrderPrint } from '@/components/print/templates/CorrectionOrderPrint';
import { InternalMovementPrint } from '@/components/print/templates/InternalMovementPrint';
import { useSalesOrderRich, useQuotationRich } from '@/hooks/sales';
import { useInvoice } from '@/hooks/invoicing';
import { useDeliveryNote } from '@/hooks/inventory/deliveryNotes';
import { useCorrectionOrder } from '@/hooks/inventory/correctionOrders';
import { useInternalMovement } from '@/hooks/inventory/internalMovements';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { PrintableDocumentType } from '@/components/print/PrintableDocument';

const PRINT_ELEMENT_ID = 'printable-document';

function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return null;
      // Prefer the new multi-payment ledger
      const sop = await (supabase as any)
        .from('sales_order_payments')
        .select('*, payment_account:payment_accounts(*), sales_order:sales_orders(reference, billing_customer_name, customer:customers(name))')
        .eq('id', id)
        .maybeSingle();
      if (sop.data) {
        const row = sop.data as any;
        return {
          ...row,
          reference: row.payment_number,
          method: row.payment_mode,
          payment_method: row.payment_mode,
          payment_reference: row.reference_number,
          customer_name: row.sales_order?.billing_customer_name || row.sales_order?.customer?.name || null,
          against_reference: row.sales_order?.reference || null,
        };
      }
      // Legacy fallback
      const { data, error } = await supabase
        .from('payments').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export default function PrintRoute() {
  const { documentType, documentId } = useParams<{ documentType: string; documentId: string }>();
  const [params] = useSearchParams();
  const fmt = (params.get('format') === 'thermal' ? 'thermal' : 'a4') as 'a4' | 'thermal';
  const type = (documentType ?? '') as PrintableDocumentType;

  const order = useSalesOrderRich(type === 'sales_order' ? documentId : undefined);
  const quotation = useQuotationRich(type === 'quotation' ? documentId : undefined);
  const invoice = useInvoice(type === 'invoice' ? documentId : undefined);
  const note = useDeliveryNote(type === 'delivery_note' ? documentId : undefined);
  const payment = usePayment(type === 'payment_receipt' ? documentId : undefined);
  const correction = useCorrectionOrder(type === 'correction_order' ? documentId : undefined);
  const movement = useInternalMovement(type === 'internal_movement' ? documentId : undefined);

  useEffect(() => {
    document.title = `${type.replace(/_/g, ' ')} ${documentId ?? ''}`.trim();
  }, [type, documentId]);

  const loading =
    order.isLoading || quotation.isLoading || invoice.isLoading ||
    note.isLoading || payment.isLoading || correction.isLoading || movement.isLoading;

  let body: React.ReactNode = null;
  let docNumber = documentId ?? '';
  let toEmail: string | undefined;

  if (type === 'sales_order' && order.data) {
    docNumber = (order.data as any).reference ?? docNumber;
    body = <SalesOrderPrint order={order.data} lines={(order.data as any).order_lines ?? []} isDraft={(order.data as any).status === 'draft'} />;
  } else if (type === 'quotation' && quotation.data) {
    docNumber = (quotation.data as any).reference ?? docNumber;
    body = <QuotationPrint quotation={quotation.data} lines={(quotation.data as any).quotation_lines ?? []} isDraft={(quotation.data as any).status === 'draft'} />;
  } else if (type === 'invoice' && invoice.data) {
    docNumber = (invoice.data as any).reference ?? docNumber;
    body = <InvoicePrint invoice={invoice.data} isDraft={(invoice.data as any).status === 'draft'} />;
  } else if (type === 'delivery_note' && note.data) {
    docNumber = (note.data as any).reference ?? docNumber;
    body = <DeliveryNotePrint note={note.data} isDraft={(note.data as any).status === 'draft'} />;
  } else if (type === 'payment_receipt' && payment.data) {
    docNumber = (payment.data as any).reference ?? (payment.data as any).payment_reference ?? docNumber;
    body = <PaymentReceiptPrint payment={payment.data} />;
  } else if (type === 'correction_order' && correction.data?.co) {
    const c = correction.data.co as any;
    docNumber = c.co_number ?? docNumber;
    body = <CorrectionOrderPrint co={c} items={correction.data.items} isDraft={c.status === 'draft'} />;
  } else if (type === 'internal_movement' && movement.data?.movement) {
    const m = movement.data.movement as any;
    docNumber = m.movement_number ?? docNumber;
    body = <InternalMovementPrint movement={m} items={movement.data.items} isDraft={m.status === 'draft'} />;
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }
  if (!body) {
    return <div className="p-8 text-center text-muted-foreground">Document not available for printing.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <PrintActions
        elementId={PRINT_ELEMENT_ID}
        documentType={type}
        documentNumber={docNumber}
        format={fmt}
        emailTo={toEmail}
      />
      <div className="py-6">{body}</div>
    </div>
  );
}