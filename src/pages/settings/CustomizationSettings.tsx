import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleCustomization } from '@/components/customization/ModuleCustomization';
import { ThemeCustomization } from '@/components/customization/ThemeCustomization';
import { Button } from '@/components/ui/button';
import { useCustomization } from '@/contexts/CustomizationContext';
import { RotateCcw, Palette, Layout, FileEdit } from 'lucide-react';
import { toast } from 'sonner';

const SETTINGS_NAV = [
  { label: 'General', href: '/settings' },
  { label: 'Customization', href: '/settings/customization' },
  { label: 'Users', href: '/settings/users' },
  { label: 'Roles', href: '/settings/roles' },
  { label: 'Audit Logs', href: '/settings/audit' },
];

export default function CustomizationSettings() {
  const { resetAll } = useCustomization();

  const handleResetAll = () => {
    resetAll();
    toast.success('All customizations reset to defaults');
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-foreground">Customization</h1>
            <p className="text-sm text-muted-foreground">
              Customize modules, forms, and theme appearance
            </p>
          </div>
          <Button variant="outline" onClick={handleResetAll} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
        </div>

        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="modules" className="gap-2">
              <Layout className="h-4 w-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="forms" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Forms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-0">
            <ModuleCustomization />
          </TabsContent>

          <TabsContent value="theme" className="mt-0">
            <ThemeCustomization />
          </TabsContent>

          <TabsContent value="forms" className="mt-0">
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Form Customization</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Form field customization is available on individual forms. 
                Navigate to any form and click the customize button to edit field labels, 
                order, and visibility.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
