import { useCallback } from 'react';
import { buildContactPopulationFields } from '@/lib/sales/contactPopulation';

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
    const fields = buildContactPopulationFields(c);
    setFormData((prev: any) => ({ ...prev, ...fields }));
  }, [setFormData]);
}