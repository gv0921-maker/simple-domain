// Aggregated service entry point. Components may import a single
// namespaced service (`crmService.getContacts(...)`) or the named
// helpers from each module file directly.
export * as crmService from './crm';
export * as salesService from './sales';
export * as inventoryService from './inventory';
export * as hrService from './hr';
export * as manufacturingService from './manufacturing';
export * as settingsService from './settings';
export * from './registry';
export type * from './types';