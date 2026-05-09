import {
  getQuotations,
  saveQuotation,
  convertQuotationToOrder,
  getSubscriptions,
  saveSubscription,
  saveSalesOrder,
  generateOrderReference,
} from '@/lib/services/sales/storage';
import type { Subscription, SalesOrder, SalesOrderLine } from '@/lib/services/sales/types';
import { addMonths, addQuarters, addYears, parseISO } from 'date-fns';
import { logSales } from './audit';

export function autoExpireQuotations(): number {
  const quotations = getQuotations();
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  quotations.forEach((q) => {
    if ((q.status === 'sent' || q.status === 'draft') && q.validUntil && q.validUntil < today) {
      saveQuotation({ ...q, status: 'expired' });
      logSales('update', 'quotation', q.id, `Auto-expired (valid until ${q.validUntil})`);
      count++;
    }
  });
  return count;
}

export function autoCreateOrderOnAcceptance(quotationId: string, userId: string, userName: string) {
  return convertQuotationToOrder(quotationId, userId, userName);
}

function nextDate(cycle: Subscription['billingCycle'], from: Date): Date {
  if (cycle === 'monthly') return addMonths(from, 1);
  if (cycle === 'quarterly') return addQuarters(from, 1);
  return addYears(from, 1);
}

/** Manually renew a subscription: creates a new SalesOrder & advances nextBillingDate. */
export function renewSubscription(subId: string, userId: string, userName: string): SalesOrder | null {
  const sub = getSubscriptions().find((s) => s.id === subId);
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
  const order: SalesOrder = {
    id: crypto.randomUUID(),
    reference: generateOrderReference(),
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
  const saved = saveSalesOrder(order);

  saveSubscription({
    ...sub,
    lastOrderId: saved.id,
    orderHistory: [...(sub.orderHistory || []), saved.id],
    nextBillingDate: nextDate(sub.billingCycle, parseISO(sub.nextBillingDate)).toISOString().split('T')[0],
  });

  logSales('create', 'order', saved.id, `Subscription renewal from ${sub.reference}`);
  return saved;
}

/** Auto-renew any subscription whose nextBillingDate is past. Returns count renewed. */
export function autoRenewDueSubscriptions(userId = 'system', userName = 'System'): number {
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  getSubscriptions().forEach((s) => {
    if (s.status === 'active' && s.nextBillingDate && s.nextBillingDate <= today) {
      if (renewSubscription(s.id, userId, userName)) count++;
    }
  });
  return count;
}