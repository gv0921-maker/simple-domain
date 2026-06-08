// Sales service module.
//
// Legacy localStorage CRUD has been fully migrated to Supabase-backed
// hooks under `@/hooks/sales`. This index now only re-exports the
// async API namespace and pure B2C helpers used across components.
export * as salesApi from './api';

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