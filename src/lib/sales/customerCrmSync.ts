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

/**
 * One-time/manual backfill: ensure every `crm_contacts` row has a matching
 * `customers` row. Matches by lowercased email when present, otherwise by
 * (name + phone). Returns counts of inserted / skipped / failed records.
 */
export async function backfillContactsToCustomers(): Promise<{
  total: number; inserted: number; skipped: number; failed: number;
}> {
  const { data: contacts, error } = await supabase
    .from('crm_contacts')
    .select('id, first_name, last_name, company_name, email, phone, type');
  if (error) throw error;

  const { data: customers } = await supabase
    .from('customers' as any)
    .select('id, name, email, phone');

  const byEmail = new Map<string, any>();
  const byNamePhone = new Map<string, any>();
  for (const c of (customers || []) as any[]) {
    if (c.email) byEmail.set(String(c.email).toLowerCase().trim(), c);
    byNamePhone.set(`${(c.name || '').trim()}|${c.phone || ''}`, c);
  }

  let inserted = 0, skipped = 0, failed = 0;
  for (const ct of (contacts || []) as any[]) {
    const name =
      [ct.first_name, ct.last_name].filter(Boolean).join(' ').trim() ||
      ct.company_name ||
      '';
    if (!name) { skipped++; continue; }
    const email = (ct.email || '').toLowerCase().trim();
    if (email && byEmail.has(email)) { skipped++; continue; }
    if (!email && byNamePhone.has(`${name}|${ct.phone || ''}`)) { skipped++; continue; }

    try {
      await saveCustomer({
        name,
        email: ct.email ?? null,
        phone: ct.phone ?? null,
        company: ct.company_name ?? null,
        contactPerson: ct.company_name ? name : null,
        type: ct.type === 'company' ? 'company' : 'individual',
        isActive: true,
      });
      inserted++;
    } catch {
      failed++;
    }
  }
  return { total: (contacts || []).length, inserted, skipped, failed };
}