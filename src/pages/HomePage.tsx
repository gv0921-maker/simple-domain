import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { useCustomization } from '@/contexts/CustomizationContext';
import { getIcon } from '@/lib/customization/icons';

export default function HomePage() {
  const { getVisibleModules } = useCustomization();
  const visibleModules = getVisibleModules();
  
  // Group modules by category
  const salesModules = visibleModules.filter(m => ['crm', 'sales'].includes(m.id));
  const operationsModules = visibleModules.filter(m => ['inventory', 'manufacturing', 'plm', 'maintenance'].includes(m.id));
  const financeModules = visibleModules.filter(m => ['accounting', 'invoicing'].includes(m.id));
  const hrModules = visibleModules.filter(m => ['employees'].includes(m.id));
  const otherModules = visibleModules.filter(m => 
    !['crm', 'sales', 'inventory', 'manufacturing', 'plm', 'maintenance', 'accounting', 'invoicing', 'employees'].includes(m.id)
  );

  const renderModuleSection = (title: string, modules: typeof visibleModules, startDelay: number = 0) => {
    if (modules.length === 0) return null;
    
    return (
      <div className="mb-10">
        <h2 className="text-xl font-serif italic text-foreground mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => {
            const Icon = getIcon(module.icon);
            return (
              <div
                key={module.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(startDelay + index) * 50}ms` }}
              >
                <ModuleCard
                  name={module.name}
                  description={module.description}
                  icon={Icon}
                  href={module.href}
                  iconBg={module.iconBg}
                  iconColor={module.iconColor}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-lavender p-8">
        <div className="max-w-5xl mx-auto">
          {renderModuleSection('Sales', salesModules, 0)}
          {renderModuleSection('Inventory & Manufacturing', operationsModules, salesModules.length)}
          {renderModuleSection('Finance', financeModules, salesModules.length + operationsModules.length)}
          {renderModuleSection('Human Resources', hrModules, salesModules.length + operationsModules.length + financeModules.length)}
          {renderModuleSection('Productivity', otherModules, salesModules.length + operationsModules.length + financeModules.length + hrModules.length)}
        </div>
      </div>
    </AppLayout>
  );
}
