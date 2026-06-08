// Bi-directional sync between CRM contacts (`crm_contacts`) and Sales
// customers (`customers`). Match key is the lowercase email — when an
// email is missing we no-op so we don't create unlinkable duplicates.
import { supabase } from '@/integrations/supabase/client';
import { saveCustomer, type SbCustomer } from '@/lib/services/sales/api';
import { saveContact } from '@/lib/data/crm-supabase';
import type { Contact } from '@/lib/services/crm';

function norm(s?: string | null) {
  return (s || '').toLowerCase().trim();
}

/** Upsert a `customers` row from a CRM contact (email = match key). */
export async function upsertCustomerFromContact(contact: any): Promise<SbCustomer | null> {
  const email = norm(contact?.email);
  if (!email) return null;

  const fullName =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() ||
    contact.companyName ||
    contact.name ||
    '';
  if (!fullName) return null;

  const { data: existing } = await supabase
    .from('customers' as any)
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  const existingId = (existing as any)?.id as string | undefined;

  return saveCustomer({
    ...(existingId ? { id: existingId } : {}),
    name: fullName,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    company: contact.companyName ?? null,
    contactPerson: contact.companyName ? fullName : null,
    type: contact.type === 'company' ? 'company' : 'individual',
    isActive: true,
  });
}

/** Upsert a `crm_contacts` row from a Sales customer (email = match key). */
export async function upsertContactFromCustomer(customer: any): Promise<Contact | null> {
  const email = norm(customer?.email);
  if (!email) return null;

  const name = (customer?.name || '').trim();
  if (!name) return null;
  const parts = name.split(/\s+/);
  const firstName = parts[0] || name;
  const lastName = parts.slice(1).join(' ') || '';

  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  const existingId = (existing as any)?.id as string | undefined;

  return saveContact({
    ...(existingId ? { id: existingId } : {}),
    type: 'individual',
    firstName,
    lastName,
    email: customer.email,
    phone: customer.phone || '',
    companyName: customer.company || '',
  });
}

/** Build the Sales form billing/customer fields from a `customers` row. */
export function buildCustomerPopulationFields(c: any) {
  const name = c?.name || '';
  return {
    customerId: c?.id,
    customerName: name,
    billingCustomerName: name,
    billingName: name,
    billingPhone1: c?.phone || '',
    deliveryName: name,
  };
}