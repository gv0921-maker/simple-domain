import { getQuotations, saveQuotation, convertQuotationToOrder } from '@/lib/data/sales/storage';
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