import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type CurrentEmployee = Database['public']['Tables']['employees']['Row'];

/** Returns the employees row linked to the currently signed-in user (via user_id). */
export function useCurrentEmployee() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['hr', 'currentEmployee', user?.id ?? 'anon'],
    queryFn: async (): Promise<CurrentEmployee | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('employees').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}