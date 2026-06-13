import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface Vendor {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface VendorInput {
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export async function getVendors(activeOnly = true): Promise<Vendor[]> {
  let q = sb.from('vendors').select('*').order('name', { ascending: true });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Vendor[];
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const { data, error } = await sb.from('vendors').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Vendor | null;
}

export async function searchVendors(query: string): Promise<Vendor[]> {
  const q = (query ?? '').trim();
  if (!q) return getVendors(true);
  const { data, error } = await sb
    .from('vendors')
    .select('*')
    .ilike('name', `%${q}%`)
    .eq('is_active', true)
    .order('name')
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Vendor[];
}

export async function createVendor(input: VendorInput): Promise<Vendor> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await sb
    .from('vendors')
    .insert({ ...input, created_by: u.user?.id ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Vendor;
}

export async function updateVendor(id: string, input: Partial<VendorInput>): Promise<Vendor> {
  const { data, error } = await sb.from('vendors').update(input).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Vendor;
}

export async function deactivateVendor(id: string): Promise<void> {
  const { error } = await sb.from('vendors').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}