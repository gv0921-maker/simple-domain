// Sales module - re-exports
export * from './types';
export * from './storage';

// Re-export legacy types for backward compatibility
export type { Contact, Lead, Opportunity, Activity } from '../sales';
export { getContacts, getLeads, getOpportunities } from '../sales';
