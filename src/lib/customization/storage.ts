// Local storage for customization settings

import { getItem, setItem } from '@/lib/storage';
import { CustomizationState, DEFAULT_CUSTOMIZATION } from './types';

const CUSTOMIZATION_KEY = 'customization';

export function getCustomization(): CustomizationState {
  return getItem<CustomizationState>(CUSTOMIZATION_KEY, DEFAULT_CUSTOMIZATION);
}

export function setCustomization(state: CustomizationState): void {
  setItem(CUSTOMIZATION_KEY, state);
}

export function resetCustomization(): void {
  setItem(CUSTOMIZATION_KEY, DEFAULT_CUSTOMIZATION);
}
