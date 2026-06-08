// Service registry — single switch point for the entire data layer.
//
// Today every service is the localStorage implementation re-exported
// from `@/lib/data/*`. To swap in Supabase later, build matching
// implementations (e.g. `./crm-supabase.ts`) and change the imports
// below. No component code needs to change.

import * as localCRM from './crm';
import * as localSales from './sales';
import * as localInventory from './inventory';
import * as localHR from './hr';
import * as localManufacturing from './manufacturing';
import * as localSettings from './settings';

export type DBProvider = 'localStorage' | 'supabase' | 'postgres';

export const DB_PROVIDER: DBProvider =
  (import.meta.env.VITE_DB_PROVIDER as DBProvider) || 'localStorage';

export const services = {
  crm: localCRM,
  sales: localSales,
  inventory: localInventory,
  hr: localHR,
  manufacturing: localManufacturing,
  settings: localSettings,
} as const;

export const crmService = services.crm;
export const salesService = services.sales;
export const inventoryService = services.inventory;
export const hrService = services.hr;
export const manufacturingService = services.manufacturing;
export const settingsService = services.settings;