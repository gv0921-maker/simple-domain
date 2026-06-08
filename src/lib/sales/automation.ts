import {
  listQuotationsRich, saveQuotationRich,
  convertQuotationToOrderRich,
  listSubscriptionsRich, saveSubscriptionRich,
  saveSalesOrderRich, generateOrderReferenceRich,
} from '@/lib/services/sales/api';
import type { Subscription, SalesOrder, SalesOrderLine } from '@/lib/services/sales/types';
import { addMonths, addQuarters, addYears, parseISO } from 'date-fns';
import { logSales } from './audit';

export async function autoExpireQuotations(): Promise<number> {
  const quotations = await listQuotationsRich();
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  for (const q of quotations) {
    if ((q.status === 'sent' || q.status === 'draft') && q.validUntil && q.validUntil < today) {
      await saveQuotationRich({ ...q, status: 'expired' });
      logSales('update', 'quotation', q.id, `Auto-expired (valid until ${q.validUntil})`);
      count++;
    }
  }
  return count;
}

export function autoCreateOrderOnAcceptance(quotationId: string, userId: string, userName: string) {
  return convertQuotationToOrderRich(quotationId, userId, userName);
}

function nextDate(cycle: Subscription['billingCycle'], from: Date): Date {
  if (cycle === 'monthly') return addMonths(from, 1);
  if (cycle === 'quarterly') return addQuarters(from, 1);
  return addYears(from, 1);
}

/** Manually renew a subscription: creates a new SalesOrder & advances nextBillingDate. */
export async function renewSubscription(subId: string, userId: string, userName: string): Promise<SalesOrder | null> {
  const all = await listSubscriptionsRich();
  const sub = all.find((s) => s.id === subId);
  if (!sub || sub.status !== 'active') return null;

  const lines: SalesOrderLine[] = sub.lines.map((l) => ({
    id: crypto.randomUUID(),
    productId: l.productId,
    productName: l.productName,
    quantity: l.quantity,
    deliveredQuantity: 0,
    invoicedQuantity: 0,
    unitPrice: l.unitPrice,
    discount: l.discount || 0,
    discountType: 'percentage',
    taxIds: [],
    subtotal: l.unitPrice * l.quantity,
    taxAmount: 0,
    total: l.unitPrice * l.quantity,
    reservedStock: false,
  }));

  const now = new Date();
  const reference = await generateOrderReferenceRich();
  const order: SalesOrder = {
    id: crypto.randomUUID(),
    reference,
    customerId: sub.customerId,
    customerName: sub.customerName,
    orderDate: now.toISOString().split('T')[0],
    currency: sub.currency,
    paymentTerms: sub.paymentTerms,
    lines,
    subtotal: sub.subtotal,
    discountAmount: 0,
    taxAmount: sub.taxAmount,
    total: sub.total,
    status: 'estimate',
    deliveryStatus: 'pending',
    invoiceStatus: 'not_invoiced',
    activities: [{
      id: crypto.randomUUID(),
      userId,
      userName,
      action: 'Order created from subscription renewal',
      details: `From ${sub.reference}`,
      timestamp: now.toISOString(),
    }],
    createdBy: userName,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const saved = await saveSalesOrderRich(order);

  await saveSubscriptionRich({
    ...sub,
    lastOrderId: saved.id,
    orderHistory: [...(sub.orderHistory || []), saved.id],
    nextBillingDate: nextDate(sub.billingCycle, parseISO(sub.nextBillingDate)).toISOString().split('T')[0],
  });

  logSales('create', 'order', saved.id, `Subscription renewal from ${sub.reference}`);
  return saved;
}

/** Auto-renew any subscription whose nextBillingDate is past. Returns count renewed. */
export async function autoRenewDueSubscriptions(userId = 'system', userName = 'System'): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  const subs = await listSubscriptionsRich();
  for (const s of subs) {
    if (s.status === 'active' && s.nextBillingDate && s.nextBillingDate <= today) {
      if (await renewSubscription(s.id, userId, userName)) count++;
    }
  }
  return count;
}