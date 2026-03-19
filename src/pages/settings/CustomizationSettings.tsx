import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleCustomization } from '@/components/customization/ModuleCustomization';
import { ThemeCustomization } from '@/components/customization/ThemeCustomization';
import { Button } from '@/components/ui/button';
import { useCustomization } from '@/contexts/CustomizationContext';
import { RotateCcw, Palette, Layout, FileEdit, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { SETTINGS_NAV } from '@/lib/navigation/settings';

const FORM_REGISTRY = [
  {
    module: 'CRM',
    forms: [
      { name: 'New Opportunity', href: '/crm/pipeline', description: 'Opportunity creation form' },
      { name: 'New Lead', href: '/crm/leads', description: 'Lead capture form' },
      { name: 'New Contact', href: '/crm/contacts', description: 'Contact details form' },
      { name: 'New Company', href: '/crm/companies', description: 'Company details form' },
    ],
  },
  {
    module: 'Sales',
    forms: [
      { name: 'Quotation', href: '/sales/quotations', description: 'Sales quotation form' },
      { name: 'Sales Order', href: '/sales/orders', description: 'Sales order form' },
      { name: 'Customer', href: '/sales/customers', description: 'Customer details form' },
    ],
  },
  {
    module: 'Inventory',
    forms: [
      { name: 'Product', href: '/inventory/products', description: 'Product details form' },
      { name: 'Transfer', href: '/inventory/transfers/new', description: 'Stock transfer form' },
      { name: 'Inventory Adjustment', href: '/inventory/adjustments', description: 'Stock adjustment form' },
      { name: 'Warehouse', href: '/inventory/warehouses', description: 'Warehouse configuration form' },
    ],
  },
  {
    module: 'Manufacturing',
    forms: [
      { name: 'Work Order', href: '/manufacturing/work-orders', description: 'Work order form' },
      { name: 'Bill of Materials', href: '/manufacturing/bom', description: 'BOM form' },
      { name: 'Work Center', href: '/manufacturing/work-centers', description: 'Work center form' },
    ],
  },
  {
    module: 'Accounting',
    forms: [
      { name: 'Invoice', href: '/accounting/invoices', description: 'Invoice form' },
      { name: 'Payment', href: '/accounting/payments', description: 'Payment form' },
      { name: 'Journal Entry', href: '/accounting/journal-entries', description: 'Journal entry form' },
    ],
  },
];

export default function CustomizationSettings() {
  const { resetAll } = useCustomization();
  const navigate = useNavigate();

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
            <div className="space-y-4">
              {FORM_REGISTRY.map((group) => (
                <div key={group.module} className="bg-card rounded-lg border border-border">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">{group.module}</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {group.forms.map((form) => (
                      <button
                        key={form.name}
                        onClick={() => navigate(form.href)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <FileEdit className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{form.name}</p>
                            <p className="text-xs text-muted-foreground">{form.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
