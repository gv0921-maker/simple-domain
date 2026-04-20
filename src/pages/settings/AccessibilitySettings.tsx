// Accessibility settings page (reduced motion etc.)
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accessibility, Sparkles } from 'lucide-react';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function AccessibilitySettings() {
  const { reducedMotion, setReducedMotion } = useAccessibility();

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Accessibility className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-medium">Accessibility</h1>
            <p className="text-sm text-muted-foreground">Personalise how the app behaves visually and on input.</p>
          </div>
        </div>

        <Card className="p-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="reduced-motion" className="font-medium cursor-pointer">Reduce motion</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disable all animations and transitions. Useful if motion causes discomfort.
            </p>
          </div>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
          />
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-2">Keyboard navigation in the Kanban</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Tab to focus a card</li>
            <li><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">→</kbd> move the focused card to the previous / next stage</li>
            <li><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Enter</kbd> open the focused card</li>
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
