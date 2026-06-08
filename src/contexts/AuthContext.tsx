import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
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
    role: ((meta.role as string) ?? 'user'),
    avatar: meta.avatar_url as string | undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Register listener FIRST to avoid missing events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      const mapped = mapUser(session?.user);
      setUser(mapped);
      setIsAuthenticated(!!session);
    });

    // Then hydrate from existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const mapped = mapUser(session?.user);
      setUser(mapped);
      setIsAuthenticated(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
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
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
