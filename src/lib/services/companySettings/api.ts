import { supabase } from '@/integrations/supabase/client';

export interface CompanySettings {
  id: string;
  company_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  website: string | null;
  logo_url: string | null;
  letterhead_footer: string | null;
  standard_terms: string | null;
  thermal_width_mm: number;
  default_advance_percent: number | null;
  updated_at: string;
  updated_by: string | null;
}

export async function fetchCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as CompanySettings | null) ?? null;
}

export async function updateCompanySettings(
  id: string,
  patch: Partial<Omit<CompanySettings, 'id' | 'updated_at'>>,
): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from('company_settings')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as CompanySettings;
}