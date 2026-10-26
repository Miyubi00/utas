import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isDemoAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy admin for demo/preview if Supabase is unconfigured
const DEMO_USER: User = {
  id: 'demo-admin-id',
  app_metadata: {},
  user_metadata: { name: 'Admin Lembar Senja' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@lebarsenja.com',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Check local storage for demo admin login state
      const savedDemo = localStorage.getItem('lembar_senja_demo_auth');
      if (savedDemo === 'true') {
        setUser(DEMO_USER);
        setIsDemoAdmin(true);
      }
      setIsLoading(false);
      return;
    }

    // Supabase Auth listener
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured()) {
      // Allow demo login
      if (
        (email.trim().toLowerCase() === 'admin@lebarsenja.com' && password === 'senja123') ||
        (email.includes('@') && password.length >= 6)
      ) {
        localStorage.setItem('lembar_senja_demo_auth', 'true');
        setUser(DEMO_USER);
        setIsDemoAdmin(true);
        return { error: null };
      }
      return { error: 'Kredensial salah. Gunakan admin@lebarsenja.com / senja123 untuk mode pratinjau.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk';
      return { error: message };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('lembar_senja_demo_auth');
    setIsDemoAdmin(false);
    setUser(null);
    setSession(null);

    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut, isDemoAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
