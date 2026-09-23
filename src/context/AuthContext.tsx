import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sendBrevoWelcomeEmail } from '../lib/brevoSmtp';
import { globalLoadBalancer } from '../lib/loadBalancerThrottler';

interface RegisterParams {
  email: string;
  pass: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (params: RegisterParams) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const LOCAL_ADMIN_KEY = 'kaalvastr_admin_session';
const LOCAL_USER_STORE = 'kaalvastr_users_store';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_ADMIN_KEY) === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAdmin(Boolean(session?.user));
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAdmin(Boolean(session?.user));
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local demo mode setup
      const localSession = localStorage.getItem(LOCAL_ADMIN_KEY);
      if (localSession === 'true') {
        setIsAdmin(true);
      }
      setLoading(false);
    }
  }, []);

  /**
   * High-concurrency safe login handler (throttled via global load balancer)
   */
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    return globalLoadBalancer.schedule(async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.session) {
            setSession(data.session);
            setUser(data.user);
            setIsAdmin(true);
            localStorage.setItem(LOCAL_ADMIN_KEY, 'true');
            return { success: true };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Login failed' };
        }
      }

      // Local fallback checking
      const storedUsersRaw = localStorage.getItem(LOCAL_USER_STORE);
      let registeredUsers: any[] = [];
      if (storedUsersRaw) {
        try { registeredUsers = JSON.parse(storedUsersRaw); } catch {}
      }

      const foundUser = registeredUsers.find(u => u.email === email && u.pass === pass);

      if (foundUser || (email === 'admin@kaalvastr.in' || email === 'admin') && (pass === 'kaalvastr123' || pass === 'admin123')) {
        setIsAdmin(true);
        localStorage.setItem(LOCAL_ADMIN_KEY, 'true');
        return { success: true };
      }

      return { success: false, error: 'Invalid email or password' };
    });
  };

  /**
   * User & Admin Registration Handler with Brevo SMTP email dispatch
   */
  const registerUser = async ({ email, pass, name, role }: RegisterParams): Promise<{ success: boolean; error?: string }> => {
    return globalLoadBalancer.schedule(async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
              data: {
                full_name: name,
                role: role,
              },
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          // Trigger Brevo SMTP transactional confirmation email
          await sendBrevoWelcomeEmail({ email, name, role });

          if (data.user) {
            setUser(data.user);
            setIsAdmin(role === 'admin');
            localStorage.setItem(LOCAL_ADMIN_KEY, role === 'admin' ? 'true' : 'false');
            return { success: true };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Registration failed' };
        }
      }

      // Local Fallback store & Brevo email dispatch
      const storedUsersRaw = localStorage.getItem(LOCAL_USER_STORE);
      let registeredUsers: any[] = [];
      if (storedUsersRaw) {
        try { registeredUsers = JSON.parse(storedUsersRaw); } catch {}
      }

      registeredUsers.push({ email, pass, name, role, created_at: new Date().toISOString() });
      localStorage.setItem(LOCAL_USER_STORE, JSON.stringify(registeredUsers));

      // Dispatch Brevo welcome email
      await sendBrevoWelcomeEmail({ email, name, role });

      setIsAdmin(role === 'admin');
      localStorage.setItem(LOCAL_ADMIN_KEY, role === 'admin' ? 'true' : 'false');
      return { success: true };
    });
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    localStorage.removeItem(LOCAL_ADMIN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, loginWithEmail, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
