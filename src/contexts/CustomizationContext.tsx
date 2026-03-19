import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  CustomizationState,
  ModuleConfig,
  FormConfig,
  ThemeConfig,
  DEFAULT_CUSTOMIZATION,
} from '@/lib/customization/types';
import { getCustomization, setCustomization, resetCustomization } from '@/lib/customization/storage';

interface CustomizationContextValue {
  state: CustomizationState;
  // Module operations
  updateModule: (moduleId: string, updates: Partial<ModuleConfig>) => void;
  reorderModules: (modules: ModuleConfig[]) => void;
  resetModules: () => void;
  getVisibleModules: () => ModuleConfig[];
  // Form operations
  updateForm: (formId: string, updates: Partial<FormConfig>) => void;
  getFormConfig: (moduleId: string, formName: string) => FormConfig | undefined;
  // Theme operations
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  // General
  resetAll: () => void;
}

const CustomizationContext = createContext<CustomizationContextValue | null>(null);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomizationState>(() => getCustomization());

  // Persist to localStorage on change
  useEffect(() => {
    setCustomization(state);
  }, [state]);

  // Apply theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = state;
    
    // Apply primary color
    root.style.setProperty('--primary', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
    root.style.setProperty('--ring', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
    
    // Apply accent color
    root.style.setProperty('--accent', `${theme.accentHue} ${theme.accentSaturation}% ${theme.accentLightness}%`);
    
    // Apply border radius
    const radiusMap = { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' };
    root.style.setProperty('--radius', radiusMap[theme.borderRadius]);
    
    // Apply font family
    const fontMap = {
      system: 'system-ui, -apple-system, sans-serif',
      inter: '"Inter", sans-serif',
      roboto: '"Roboto", sans-serif',
      poppins: '"Poppins", sans-serif',
    };
    root.style.setProperty('--font-sans', fontMap[theme.fontFamily]);
    document.body.style.fontFamily = fontMap[theme.fontFamily];
  }, [state.theme]);

  const updateModule = useCallback((moduleId: string, updates: Partial<ModuleConfig>) => {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const reorderModules = useCallback((modules: ModuleConfig[]) => {
    setState((prev) => ({
      ...prev,
      modules: modules.map((m, i) => ({ ...m, order: i })),
    }));
  }, []);

  const resetModules = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modules: DEFAULT_CUSTOMIZATION.modules,
    }));
  }, []);

  const getVisibleModules = useCallback(() => {
    return state.modules
      .filter((m) => m.visible)
      .sort((a, b) => a.order - b.order);
  }, [state.modules]);

  const updateForm = useCallback((formId: string, updates: Partial<FormConfig>) => {
    setState((prev) => {
      const existingIndex = prev.forms.findIndex((f) => f.id === formId);
      if (existingIndex >= 0) {
        const newForms = [...prev.forms];
        newForms[existingIndex] = { ...newForms[existingIndex], ...updates };
        return { ...prev, forms: newForms };
      }
      // Create new form config if it doesn't exist
      return { ...prev, forms: [...prev.forms, updates as FormConfig] };
    });
  }, []);

  const getFormConfig = useCallback((moduleId: string, formName: string) => {
    return state.forms.find((f) => f.moduleId === moduleId && f.formName === formName);
  }, [state.forms]);

  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setState((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: DEFAULT_CUSTOMIZATION.theme,
    }));
  }, []);

  const resetAll = useCallback(() => {
    resetCustomization();
    setState(DEFAULT_CUSTOMIZATION);
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        state,
        updateModule,
        reorderModules,
        resetModules,
        getVisibleModules,
        updateForm,
        getFormConfig,
        updateTheme,
        resetTheme,
        resetAll,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within CustomizationProvider');
  }
  return context;
}
