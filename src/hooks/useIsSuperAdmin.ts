import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useIsSuperAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) { if (!cancelled) { setIsAdmin(false); setLoading(false); } return; }
      const { data } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', uid);
      const roles = ((data ?? []) as any[]).map(r => r.role);
      if (!cancelled) {
        setIsAdmin(roles.includes('super_admin') || roles.includes('admin'));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { isAdmin, loading };
}