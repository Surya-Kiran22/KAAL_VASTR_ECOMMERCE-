import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, fetchCurrentUserRole } from '../lib/supabase';
import { sendBrevoWelcomeEmail } from '../lib/brevoSmtp';
import { issueOtp, verifyOtp } from '../lib/otpEngine';
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
  isStaff: boolean;
  role: UserRole | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (params: RegisterParams) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean; email?: string }>;
  verifyRegistrationOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  verifyAccountOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const LOCAL_ADMIN_KEY = 'kaalvastr_admin_session';
const LOCAL_USER_STORE = 'kaalvastr_users_store';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type UserRole = 'customer' | 'staff' | 'admin';

/** Applies a role to state + the legacy admin flag in one place. */
const applyRole = (
  r: UserRole | null,
  setRole: (v: UserRole | null) => void,
  setIsAdmin: (v: boolean) => void
) => {
  setRole(r);
  setIsAdmin(r === 'admin');
  if (r) {
    localStorage.setItem('kaalvastr_user_role', r);
  } else {
    localStorage.removeItem('kaalvastr_user_role');
  }
};

/** Reads the role cached in user metadata. Defaults to 'customer'. */
const roleFromMetadata = (u: User | null | undefined): UserRole => {
  const raw = u?.user_metadata?.role;
  return raw === 'admin' || raw === 'staff' || raw === 'customer' ? raw : 'customer';
};

/**
 * Resolves the effective role for a signed-in Supabase user.
 *
 * The `profiles` row is authoritative; `user_metadata.role` is only a cache.
 * Reading metadata alone locks out admins promoted with promote_to_admin(),
 * because that helper never wrote metadata.
 */
const resolveEffectiveRole = async (u: User | null | undefined): Promise<UserRole> => {
  const fromDb = await fetchCurrentUserRole();
  return fromDb ?? roleFromMetadata(u);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_ADMIN_KEY) === 'true';
  });
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          applyRole(await resolveEffectiveRole(session.user), setRole, setIsAdmin);
        } else {
          applyRole(null, setRole, setIsAdmin);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Resolved outside the callback: Supabase warns about awaiting
          // inside onAuthStateChange, and a network call can deadlock it.
          resolveEffectiveRole(session.user).then((r) => {
            applyRole(r, setRole, setIsAdmin);
            setLoading(false);
          });
        } else {
          applyRole(null, setRole, setIsAdmin);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Local demo mode setup
      const localSession = localStorage.getItem(LOCAL_ADMIN_KEY);
      if (localSession === 'true') {
        const stored = localStorage.getItem('kaalvastr_user_role');
        applyRole(stored === 'staff' || stored === 'customer' ? stored : 'admin', setRole, setIsAdmin);
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
            // Await the authoritative role so ProtectedRoute sees the correct
            // value on the very first render after login.
            const supaRole = await resolveEffectiveRole(data.user);
            applyRole(supaRole, setRole, setIsAdmin);
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
        const foundRole = foundUser?.role;
        const resolved: UserRole =
          foundRole === 'admin' || foundRole === 'staff' || foundRole === 'customer'
            ? foundRole
            : 'admin';
        applyRole(resolved, setRole, setIsAdmin);
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

          // Issue 6-digit OTP + email it — NO auto-login (auto-login on an
          // unconfirmed Supabase account is what caused the grant_type=password 400 flood)
          const { code } = issueOtp(email);
          await sendBrevoWelcomeEmail({ email, name, role, otp: code, otpExpiresInMin: 10 });
          return { success: true, requiresOtp: true, email };
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

      try {
        let registeredUsers: any[] = [];
        const storedUsersRaw = localStorage.getItem(LOCAL_USER_STORE);
        if (storedUsersRaw) {
          try { registeredUsers = JSON.parse(storedUsersRaw); } catch {}
        }

        const existing = registeredUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (existing) {
          const updated = registeredUsers.map((u: any) => u.email?.toLowerCase() === email.toLowerCase() ? { ...u, name, role } : u);
          localStorage.setItem(LOCAL_USER_STORE, JSON.stringify(updated));
        } else {
          registeredUsers.push({ email, pass, name, role, created_at: new Date().toISOString() });
          localStorage.setItem(LOCAL_USER_STORE, JSON.stringify(registeredUsers));
        }

        // Local fallback: same OTP challenge (no auto-login → no grant_type flood)
        const { code } = issueOtp(email);
        await sendBrevoWelcomeEmail({ email, name, role, otp: code, otpExpiresInMin: 10 });
        return { success: true, requiresOtp: true, email };
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed' };
      }
    });
  };

  /**
   * Complete Registration OTP verification (no auto-login)
   */
  const verifyRegistrationOtp = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    return globalLoadBalancer.schedule(async () => {
      const result = verifyOtp(email, code);
      if (result.success) {
        // Finalize session against the local registered account (no grant_type flow)
        const storedUsersRaw = localStorage.getItem(LOCAL_USER_STORE);
        let registeredUsers: any[] = [];
        if (storedUsersRaw) {
          try { registeredUsers = JSON.parse(storedUsersRaw); } catch {}
        }
        const account = registeredUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase().trim());
        if (account) {
          setUser({ id: account.email, email: account.email } as any);
          const accountRole = account.role;
          const resolved: UserRole =
            accountRole === 'admin' || accountRole === 'staff' || accountRole === 'customer'
              ? accountRole
              : 'customer';
          applyRole(resolved, setRole, setIsAdmin);
          if (resolved === 'admin') {
            localStorage.setItem(LOCAL_ADMIN_KEY, 'true');
          }
          return { success: true };
        }
        return { success: false, error: 'Account not found. Please register again.' };
      }
      const msg =
        result.reason === 'expired' ? 'Verification code expired. Please request a new one.' :
        result.reason === 'locked' ? 'Too many attempts. Please request a fresh code.' :
        'Incorrect verification code. Please try again.';
      return { success: false, error: msg };
    });
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setRole(null);
    localStorage.removeItem(LOCAL_ADMIN_KEY);
    localStorage.removeItem('kaalvastr_user_role');
  };

  /**
   * Validates a registration OTP without touching the current session.
   * Used by the admin dashboard when provisioning a staff account, so the
   * admin stays logged in while the new account is verified.
   */
  const verifyAccountOtp = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    return globalLoadBalancer.schedule(async () => {
      const result = verifyOtp(email, code);
      if (result.success) return { success: true };
      const msg =
        result.reason === 'expired' ? 'Verification code expired. Please re-send the invite.' :
        result.reason === 'locked' ? 'Too many attempts. Please re-send the invite.' :
        'Incorrect verification code. Please try again.';
      return { success: false, error: msg };
    });
  };

  const isStaff = role === 'admin' || role === 'staff';

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isStaff, role, loading, loginWithEmail, registerUser, verifyRegistrationOtp, verifyAccountOtp, logout }}>
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
