// Auto-registers all module schemas. Import once at app startup.
import './modules/crmContacts';
import './modules/crmOpportunities';

export * from './registry';
export * from './parseFile';
export * from './generateTemplate';