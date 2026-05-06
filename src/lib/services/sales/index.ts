// Sales service — mirrors `@/lib/data/sales` (legacy module: contacts,
// leads (sales-side), opportunities, sales orders).
export * from '@/lib/data/sales';

// B2C engines & validators (Phase 1)
export {
  determineGSTType,
  calculateLineTax,
  calculateOrderTotals,
} from '@/lib/sales/gstCalculator';
export {
  validatePhone,
  formatPhone,
  splitPhone,
  PHONE_PREFIXES,
} from '@/lib/sales/phoneValidation';
export { validateGSTIN } from '@/lib/sales/gstinValidation';