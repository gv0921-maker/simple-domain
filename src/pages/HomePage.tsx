import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { useCustomization } from '@/contexts/CustomizationContext';
import { getIcon } from '@/lib/customization/icons';

export default function HomePage() {
  const { getVisibleModules } = useCustomization();
  const visibleModules = getVisibleModules();
  
  // Split into main modules (first 10) and more modules (rest)
  const mainModules = visibleModules.slice(0, 10);
  const moreModules = visibleModules.slice(10);

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-lavender p-8">
        <div className="max-w-6xl mx-auto">
          {/* Main modules grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
            {mainModules.map((module, index) => {
              const Icon = getIcon(module.icon);
              return (
                <div
                  key={module.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ModuleCard
                    name={module.name}
                    icon={Icon}
                    href={module.href}
                    iconBg={module.iconBg}
                    iconColor={module.iconColor}
                  />
                </div>
              );
            })}
          </div>

          {/* More modules */}
          {moreModules.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-medium text-foreground mb-4">More Apps</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {moreModules.map((module, index) => {
                  const Icon = getIcon(module.icon);
                  return (
                    <div
                      key={module.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${(mainModules.length + index) * 50}ms` }}
                    >
                      <ModuleCard
                        name={module.name}
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
          )}
        </div>
      </div>
    </AppLayout>
  );
}
