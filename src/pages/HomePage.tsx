import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { useCustomization } from '@/contexts/CustomizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/data/rbac';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { getVisibleModules } = useCustomization();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { accessDenied?: boolean } | null;
    if (!state?.accessDenied) return;

    toast({ title: 'Access Denied' });
    navigate('/', { replace: true, state: null });
  }, [location.state, navigate, toast]);

  const visibleModules = getVisibleModules().filter((module) =>
    user ? canAccessRoute(user.id, module.href) : false
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-lavender p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleModules.map((module, index) => (
              <div
                key={module.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ModuleCard
                  id={module.id}
                  name={module.name}
                  description={module.description}
                  href={module.href}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
