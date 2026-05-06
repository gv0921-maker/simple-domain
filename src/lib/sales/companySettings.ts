// Company-level settings used by the Sales module (GST origin state, etc.).
// Stored in localStorage. Read through the service layer (`@/lib/services/sales`).
import { getItem, setItem } from '@/lib/storage';

export interface CompanySettings {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  /** Two-letter or full-name state of the selling company.
   *  Compared case-insensitively against billing state to decide CGST/SGST vs IGST. */
  state: string;
  gstin?: string;
  city?: string;
  zip?: string;
  addressLine1?: string;
  addressLine2?: string;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: '',
  state: '',
};

const KEY = 'company_settings';

export function getCompanySettings(): CompanySettings {
  return getItem<CompanySettings>(KEY, DEFAULT_COMPANY_SETTINGS);
}

export function saveCompanySettings(settings: CompanySettings): void {
  setItem(KEY, settings);
}