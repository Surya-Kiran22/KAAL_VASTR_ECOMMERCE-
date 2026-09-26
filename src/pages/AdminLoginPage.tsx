import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ShieldCheck, KeyRound, Server, Cpu, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LOCAL_USER_STORE = 'kaalvastr_users_store';

type StaffEntry = { email: string; name: string; role: string };

const MASTER_ADMIN: StaffEntry = {
  email: 'admin@kaalvastr.in',
  name: 'Master Admin',
  role: 'admin',
};

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffEntry[]>([MASTER_ADMIN]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_USER_STORE);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const provisioned = parsed
        .filter((u: any) => (u?.role === 'staff' || u?.role === 'admin') && u?.email)
        .filter((u: any) => u.email.toLowerCase() !== MASTER_ADMIN.email)
        .map((u: any) => ({
          email: u.email as string,
          name: (u.name as string) || (u.email as string),
          role: u.role as string,
        }));

      setStaff([MASTER_ADMIN, ...provisioned]);
    } catch {
      /* directory is best-effort; login still works */
    }
  }, []);

  const handleUseAccount = (staffEmail: string) => {
    setEmail(staffEmail);
    setError('');
    document.getElementById('admin-password-field')?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await loginWithEmail(email, password);
      if (res.success) {
        navigate('/admin');
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#141416] border border-[#27272A] rounded-lg p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase">Kaal Vastr </h1>
          <p className="text-xs text-zinc-400">Authenticated  management portal</p>
        </div>

       
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
               Email Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email address"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating via Load Balancer...' : 'Sign In To Portal'}
          </button>
        </form>

        {/* Available Staff Directory */}
        <div className="pt-5 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Available Staff Accounts</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">
              {staff.length} provisioned
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Select an account to pre-fill its email. Passwords are never displayed — use the
            credentials issued by your administrator.
          </p>

          <div className="space-y-2">
            {staff.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleUseAccount(account.email)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-md hover:border-zinc-600 hover:bg-zinc-900 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">
                      {account.name}
                    </span>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${
                        account.role === 'admin'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-sky-950 text-sky-400 border-sky-800'
                      }`}
                    >
                      {account.role}
                    </span>
                  </div>
                  <span className="block text-[11px] font-mono text-zinc-500 truncate">
                    {account.email}
                  </span>
                </div>

                <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-600 group-hover:text-white transition-colors">
                  Use
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-400">
            Need a new account?{' '}
            <Link to="/admin/register" className="text-white hover:underline font-semibold">
              Register 
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
