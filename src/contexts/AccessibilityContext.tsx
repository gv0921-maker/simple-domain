// Accessibility preferences - reduced motion toggle (persisted in localStorage)
import { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

interface AccessibilityState {
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotionState] = useState<boolean>(
    () => getItem<boolean>('a11y_reduced_motion', false)
  );

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    setItem('a11y_reduced_motion', reducedMotion);
  }, [reducedMotion]);

  return (
    <AccessibilityContext.Provider value={{ reducedMotion, setReducedMotion: setReducedMotionState }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}
