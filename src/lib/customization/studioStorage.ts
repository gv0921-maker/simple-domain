// Studio storage - persist studio form configs in localStorage
import { getItem, setItem } from '@/lib/storage';
import { StudioFormConfig } from './studioTypes';
import { getDefaultStudioForm } from './studioDefaults';

const STUDIO_KEY = 'studio_forms';

function getAllStudioForms(): Record<string, StudioFormConfig> {
  return getItem<Record<string, StudioFormConfig>>(STUDIO_KEY, {});
}

export function getStudioForm(moduleId: string, formName: string): StudioFormConfig {
  const all = getAllStudioForms();
  const key = `${moduleId}:${formName}`;
  return all[key] || getDefaultStudioForm(moduleId, formName);
}

export function saveStudioForm(config: StudioFormConfig): void {
  const all = getAllStudioForms();
  all[config.id] = { ...config, lastModified: new Date().toISOString() };
  setItem(STUDIO_KEY, all);
}

export function resetStudioForm(moduleId: string, formName: string): StudioFormConfig {
  const all = getAllStudioForms();
  const key = `${moduleId}:${formName}`;
  delete all[key];
  setItem(STUDIO_KEY, all);
  return getDefaultStudioForm(moduleId, formName);
}
