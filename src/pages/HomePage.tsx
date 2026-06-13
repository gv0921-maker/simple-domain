import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { useCustomization } from '@/contexts/CustomizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/services/settings';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Coffee } from 'lucide-react';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useActiveSession } from '@/hooks/hr';

export default function HomePage() {
  const { getVisibleModules } = useCustomization();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: employee } = useCurrentEmployee();
  const { data: activeSession } = useActiveSession(employee?.id);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('user_roles' as any).select('role').eq('user_id', user.id);
      const roles = ((data ?? []) as any[]).map((r) => r.role);
      const isAdmin = roles.includes('admin') || roles.includes('super_admin');
      const isFactoryOnly = roles.includes('factory_incharge') && !isAdmin;
      if (!cancelled && isFactoryOnly) {
        setRedirecting(true);
        navigate('/shop-floor', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user, navigate]);

  useEffect(() => {
    const state = location.state as { accessDenied?: boolean } | null;
    if (!state?.accessDenied) return;

    toast({ title: 'Access Denied' });
    navigate('/', { replace: true, state: null });
  }, [location.state, navigate, toast]);

  if (redirecting) return null;

  const visibleModules = getVisibleModules().filter((module) =>
    user ? canAccessRoute(user.id, module.href) : false
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-lavender flex items-center justify-center p-6 md:p-10">
        <div className="max-w-6xl w-full mx-auto">
          {activeSession && (
            <Card
              className="mb-6 p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition"
              onClick={() => navigate('/attendance/clock-in')}
            >
              <div className="flex items-center gap-3">
                {activeSession.session_type === 'work'
                  ? <Briefcase className="h-5 w-5 text-emerald-600" />
                  : <Coffee className="h-5 w-5 text-amber-600" />}
                <div>
                  <p className="font-medium">
                    {activeSession.session_type === 'work' ? 'Currently working' : 'On break'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    since {new Date(activeSession.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">Open Clock In/Out</Button>
            </Card>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {visibleModules.map((module, index) => (
              <div
                key={module.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ModuleCard
                  id={module.id}
                  name={module.name}
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
