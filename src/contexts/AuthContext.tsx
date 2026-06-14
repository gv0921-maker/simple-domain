import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { bootstrapRbac, isRbacHydrated, onRbacHydrated } from '@/lib/data/rbac';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  // True once the initial Supabase session probe + RBAC hydration finish.
  authReady: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(su: SupabaseUser | null | undefined): User | null {
  if (!su) return null;
  const meta = (su.user_metadata ?? {}) as Record<string, unknown>;
  const email = su.email ?? (meta.email as string) ?? '';
  return {
    id: su.id,
    email,
    name: (meta.name as string) || (meta.full_name as string) || email.split('@')[0] || 'User',
    avatar: meta.avatar_url as string | undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [rbacReady, setRbacReady] = useState(isRbacHydrated());

  useEffect(() => {
    const unsub = onRbacHydrated(() => setRbacReady(true));
    // Register listener FIRST to avoid missing events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      const mapped = mapUser(session?.user);
      setUser(mapped);
      setIsAuthenticated(!!session);
      if (mapped) {
        // Fire-and-forget: hydrate RBAC cache after sign-in.
        setRbacReady(false);
        void bootstrapRbac(mapped.id).then(() => setRbacReady(true));
      } else {
        // No user → nothing to hydrate; guards can proceed (to /login).
        setRbacReady(true);
      }
    });

    // Then hydrate from existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const mapped = mapUser(session?.user);
      setUser(mapped);
      setIsAuthenticated(!!session);
      setSessionReady(true);
      if (mapped) {
        setRbacReady(false);
        void bootstrapRbac(mapped.id).then(() => setRbacReady(true));
      } else {
        setRbacReady(true);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      unsub();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, authReady: sessionReady && rbacReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
