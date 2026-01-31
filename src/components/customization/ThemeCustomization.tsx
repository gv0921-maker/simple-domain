import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomization } from '@/contexts/CustomizationContext';
import { ThemeConfig } from '@/lib/customization/types';
import { RotateCcw, Palette, Type, Square } from 'lucide-react';
import { toast } from 'sonner';

export function ThemeCustomization() {
  const { state, updateTheme, resetTheme } = useCustomization();
  const { theme } = state;

  const handleResetTheme = () => {
    resetTheme();
    toast.success('Theme reset to defaults');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Theme Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Customize colors, fonts, and appearance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetTheme} className="gap-1">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Color */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Primary Color</h3>
          </div>
          
          <div
            className="h-16 rounded-lg flex items-center justify-center text-sm font-medium"
            style={{
              backgroundColor: `hsl(${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%)`,
              color: theme.primaryLightness > 50 ? '#000' : '#fff',
            }}
          >
            Primary Color Preview
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Hue</Label>
                <span className="text-xs text-muted-foreground">{theme.primaryHue}°</span>
              </div>
              <Slider
                value={[theme.primaryHue]}
                onValueChange={([value]) => updateTheme({ primaryHue: value })}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Saturation</Label>
                <span className="text-xs text-muted-foreground">{theme.primarySaturation}%</span>
              </div>
              <Slider
                value={[theme.primarySaturation]}
                onValueChange={([value]) => updateTheme({ primarySaturation: value })}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Lightness</Label>
                <span className="text-xs text-muted-foreground">{theme.primaryLightness}%</span>
              </div>
              <Slider
                value={[theme.primaryLightness]}
                onValueChange={([value]) => updateTheme({ primaryLightness: value })}
                max={100}
                step={1}
              />
            </div>
          </div>
        </Card>

        {/* Accent Color */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" />
            <h3 className="font-medium text-sm">Accent Color</h3>
          </div>
          
          <div
            className="h-16 rounded-lg flex items-center justify-center text-sm font-medium"
            style={{
              backgroundColor: `hsl(${theme.accentHue} ${theme.accentSaturation}% ${theme.accentLightness}%)`,
              color: theme.accentLightness > 50 ? '#000' : '#fff',
            }}
          >
            Accent Color Preview
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Hue</Label>
                <span className="text-xs text-muted-foreground">{theme.accentHue}°</span>
              </div>
              <Slider
                value={[theme.accentHue]}
                onValueChange={([value]) => updateTheme({ accentHue: value })}
                max={360}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Saturation</Label>
                <span className="text-xs text-muted-foreground">{theme.accentSaturation}%</span>
              </div>
              <Slider
                value={[theme.accentSaturation]}
                onValueChange={([value]) => updateTheme({ accentSaturation: value })}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Lightness</Label>
                <span className="text-xs text-muted-foreground">{theme.accentLightness}%</span>
              </div>
              <Slider
                value={[theme.accentLightness]}
                onValueChange={([value]) => updateTheme({ accentLightness: value })}
                max={100}
                step={1}
              />
            </div>
          </div>
        </Card>

        {/* Border Radius */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Border Radius</h3>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((radius) => {
              const radiusMap = { none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px' };
              return (
                <button
                  key={radius}
                  onClick={() => updateTheme({ borderRadius: radius })}
                  className={`p-3 border-2 transition-all ${
                    theme.borderRadius === radius
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  style={{ borderRadius: radiusMap[radius] }}
                >
                  <div
                    className="w-full h-8 bg-muted"
                    style={{ borderRadius: radiusMap[radius] }}
                  />
                  <span className="text-xs mt-1 block text-center">{radius}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Font Family */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Font Family</h3>
          </div>
          
          <Select
            value={theme.fontFamily}
            onValueChange={(value: ThemeConfig['fontFamily']) =>
              updateTheme({ fontFamily: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Default</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="roboto">Roboto</SelectItem>
              <SelectItem value="poppins">Poppins</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2 text-sm">
            <p style={{ fontFamily: getFontFamily(theme.fontFamily) }}>
              The quick brown fox jumps over the lazy dog.
            </p>
            <p
              className="text-lg font-semibold"
              style={{ fontFamily: getFontFamily(theme.fontFamily) }}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </p>
            <p
              className="text-muted-foreground"
              style={{ fontFamily: getFontFamily(theme.fontFamily) }}
            >
              0123456789 !@#$%^&*()
            </p>
          </div>
        </Card>
      </div>

      {/* Live Preview */}
      <Card className="p-4 space-y-4">
        <h3 className="font-medium text-sm">Live Preview</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </Card>
    </div>
  );
}

function getFontFamily(font: ThemeConfig['fontFamily']): string {
  const map = {
    system: 'system-ui, -apple-system, sans-serif',
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    poppins: '"Poppins", sans-serif',
  };
  return map[font];
}
