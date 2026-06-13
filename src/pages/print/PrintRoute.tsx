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
import { StockCountPrint } from '@/components/print/templates/StockCountPrint';
import { WriteOffPrint } from '@/components/print/templates/WriteOffPrint';
import { WorkOrderPrint } from '@/components/print/templates/WorkOrderPrint';
import { VendorOrderPrint } from '@/components/print/templates/VendorOrderPrint';
import { useSalesOrderRich, useQuotationRich } from '@/hooks/sales';
import { useInvoice } from '@/hooks/invoicing';
import { useDeliveryNote } from '@/hooks/inventory/deliveryNotes';
import { useCorrectionOrder } from '@/hooks/inventory/correctionOrders';
import { useInternalMovement } from '@/hooks/inventory/internalMovements';
import { useStockCount } from '@/hooks/inventory/stockCounts';
import { useWriteOff } from '@/hooks/inventory/writeOffs';
import { useWorkOrderV2 } from '@/hooks/manufacturing/workOrders';
import { useVendorOrder } from '@/hooks/vendor-orders';
import { useReturnRequest } from '@/hooks/returns';
import { ReturnRequestPrint } from '@/components/print/templates/ReturnRequestPrint';
import { useCreditNote } from '@/hooks/credit-notes';
import { useRefund } from '@/hooks/refunds';
import { CreditNotePrint } from '@/components/print/templates/CreditNotePrint';
import { RefundVoucherPrint } from '@/components/print/templates/RefundVoucherPrint';
import { ExchangePrint } from '@/components/print/templates/ExchangePrint';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { PrintableDocumentType } from '@/components/print/PrintableDocument';

const PRINT_ELEMENT_ID = 'printable-document';

function InvoiceWithSO({ invoice }: { invoice: any }) {
  const { data: soRef } = useQuery({
    queryKey: ['print-invoice-so-ref', invoice?.sales_order_id],
    queryFn: async () => {
      if (!invoice?.sales_order_id) return null;
      const { data } = await supabase
        .from('sales_orders').select('reference').eq('id', invoice.sales_order_id).maybeSingle();
      return (data as any)?.reference ?? null;
    },
    enabled: !!invoice?.sales_order_id,
  });
  const enriched = { ...invoice, sales_order_reference: soRef ?? undefined };
  return <InvoicePrint invoice={enriched} isDraft={invoice?.status === 'draft'} />;
}

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
  const stockCount = useStockCount(type === 'stock_count' ? documentId : undefined);
  const writeOff = useWriteOff(type === 'write_off' ? documentId : undefined);
  const workOrder = useWorkOrderV2(type === 'work_order' ? documentId : undefined);
  const vendorOrder = useVendorOrder(type === 'vendor_order' ? documentId : undefined);
  const returnRequest = useReturnRequest(type === 'return_request' ? documentId : undefined);
  const creditNote = useCreditNote(type === 'credit_note' ? documentId : undefined);
  const refund = useRefund(type === 'refund_voucher' ? documentId : undefined);
  const exchange = useQuery({
    queryKey: ['print-exchange', documentId, type],
    enabled: type === 'exchange' && !!documentId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('exchanges')
        .select('*, replacement_product:products!exchanges_replacement_product_id_fkey(id,name,sku), customer:customers(name), source_return:return_requests(rt_number), source_invoice:invoices(reference)')
        .eq('id', documentId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    document.title = `${type.replace(/_/g, ' ')} ${documentId ?? ''}`.trim();
  }, [type, documentId]);

  const loading =
    order.isLoading || quotation.isLoading || invoice.isLoading ||
    note.isLoading || payment.isLoading || correction.isLoading || movement.isLoading || stockCount.isLoading || writeOff.isLoading || workOrder.isLoading || vendorOrder.isLoading || returnRequest.isLoading ||
    creditNote.isLoading || refund.isLoading || exchange.isLoading;

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
    body = (
      <InvoiceWithSO invoice={invoice.data as any} />
    );
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
  } else if (type === 'stock_count' && stockCount.data?.count) {
    const c = stockCount.data.count as any;
    docNumber = c.count_number ?? docNumber;
    body = <StockCountPrint count={c} items={stockCount.data.items} isDraft={c.status === 'draft'} />;
  } else if (type === 'write_off' && writeOff.data?.record) {
    const r = writeOff.data.record;
    docNumber = r.wf_number ?? docNumber;
    body = <WriteOffPrint record={r} items={writeOff.data.items} isDraft={r.status === 'draft'} />;
  } else if (type === 'work_order' && workOrder.data) {
    const w = workOrder.data;
    docNumber = w.wo_number ?? docNumber;
    body = <WorkOrderPrint wo={w} isDraft={w.current_stage === 'draft'} />;
  } else if (type === 'vendor_order' && vendorOrder.data?.vo) {
    const v = vendorOrder.data.vo;
    docNumber = v.vo_number ?? docNumber;
    body = <VendorOrderPrint vo={v} lines={vendorOrder.data.lines} isDraft={v.status === 'draft'} />;
  } else if (type === 'return_request' && returnRequest.data) {
    const r = returnRequest.data;
    docNumber = r.rt_number ?? docNumber;
    body = <ReturnRequestPrint rt={r} isDraft={r.request_status === 'draft'} />;
  } else if (type === 'credit_note' && creditNote.data?.cn) {
    const c = creditNote.data.cn;
    docNumber = c.cn_number ?? docNumber;
    body = <CreditNotePrint cn={c} />;
  } else if (type === 'refund_voucher' && refund.data) {
    const r = refund.data;
    docNumber = r.refund_number ?? docNumber;
    body = <RefundVoucherPrint refund={r} />;
  } else if (type === 'exchange' && exchange.data) {
    const e: any = exchange.data;
    docNumber = e.exchange_number ?? docNumber;
    const enriched = {
      ...e,
      customer_name: e.customer?.name ?? null,
      source_rt_number: e.source_return?.rt_number ?? null,
      source_invoice_ref: e.source_invoice?.reference ?? null,
    };
    body = <ExchangePrint exchange={enriched} />;
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