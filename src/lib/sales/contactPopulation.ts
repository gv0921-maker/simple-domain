/**
 * Pure helper that translates a CRM Contact record into the billing +
 * delivery fields used by Sales forms (Quotation / Sales Order).
 *
 * Kept separate from the hook so non-hook contexts (e.g. ContactForm's
 * save callback) can reuse the exact same logic.
 */
export function buildContactPopulationFields(c: any) {
  const fullName =
    [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.name || '';
  const primaryPhone = c.phone || c.phones?.[0]?.phone || '';
  const secondaryPhone = c.phone
    ? (c.phones?.[0]?.phone || '')
    : (c.phones?.[1]?.phone || '');
  const billing =
    c.addresses?.find((a: any) =>
      a.type?.toLowerCase() === 'billing' || a.type?.toLowerCase() === 'both',
    ) || c.addresses?.[0] || {};
  const shipping =
    c.addresses?.find((a: any) =>
      a.type?.toLowerCase() === 'shipping' || a.type?.toLowerCase() === 'both',
    ) || c.addresses?.[1] || {};
  return {
    customerId: c.id,
    customerName: fullName,
    billingCustomerName: fullName,
    billingName: fullName,
    billingPhone1: primaryPhone,
    billingPhone2: secondaryPhone,
    billingAddressLine1: billing.street || '',
    billingAddressLine2: billing.street2 || '',
    billingCity: billing.city || '',
    billingState: billing.state || '',
    billingZip: billing.postalCode || '',
    deliveryName: fullName,
    deliveryAddressLine1: shipping.street || billing.street || '',
    deliveryAddressLine2: shipping.street2 || billing.street2 || '',
    deliveryCity: shipping.city || billing.city || '',
    deliveryState: shipping.state || billing.state || '',
    deliveryZip: shipping.postalCode || billing.postalCode || '',
  };
}

export const SALES_RETURN_CONTEXT_KEY = 'sales_form_return_context';
export const SALES_RETURN_TTL_MS = 30 * 60 * 1000;

export interface SalesReturnContext {
  returnTo: string;
  formData: any;
  timestamp: number;
}

export function readSalesReturnContext(): SalesReturnContext | null {
  try {
    const raw = sessionStorage.getItem(SALES_RETURN_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SalesReturnContext;
  } catch {
    return null;
  }
}

export function clearSalesReturnContext() {
  try { sessionStorage.removeItem(SALES_RETURN_CONTEXT_KEY); } catch {/* ignore */}
}

export function clearStaleSalesReturnContext() {
  const ctx = readSalesReturnContext();
  if (ctx && Date.now() - ctx.timestamp > SALES_RETURN_TTL_MS) {
    clearSalesReturnContext();
  }
}

export function writeSalesReturnContext(ctx: SalesReturnContext) {
  try {
    sessionStorage.setItem(SALES_RETURN_CONTEXT_KEY, JSON.stringify(ctx));
  } catch {/* private browsing – silently ignore */}
}