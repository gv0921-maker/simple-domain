import { useCallback } from 'react';

/**
 * Returns a callback that, given a CRM Contact, auto-populates the
 * billing + delivery fields of a Sales form (Quotation / Sales Order).
 *
 * Both forms share identical population logic — keep it here so the
 * same bug can't be reintroduced on only one form.
 */
export function useContactAutoPopulate(
  setFormData: React.Dispatch<React.SetStateAction<any>>,
) {
  return useCallback((c: any) => {
    const fullName =
      [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.name || '';
    // Primary: contact.phone first, fallback to phones[0]
    const primaryPhone = c.phone || c.phones?.[0]?.phone || '';
    // Secondary: if direct phone used, phones[0] is secondary; otherwise phones[1]
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
    setFormData((prev: any) => ({
      ...prev,
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
    }));
  }, [setFormData]);
}