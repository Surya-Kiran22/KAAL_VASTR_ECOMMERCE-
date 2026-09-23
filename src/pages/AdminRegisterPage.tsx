import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, KeyRound, CheckCircle2, Server, Cpu, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BREVO_CONFIG } from '../lib/brevoSmtp';

export const AdminRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Public sign-up is strictly for Customers (zero admin/product management permissions)
      const res = await registerUser({ email, pass: password, name, role: 'customer' });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1800);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-[#141416] border border-[#27272A] rounded-lg p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mx-auto">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase">Customer Registration</h1>
          <p className="text-xs text-zinc-400">
            Create your Kaal Vastr account to place orders and track your favourites.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-md text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Customer account created! Welcome verification dispatched via Brevo SMTP ({BREVO_CONFIG.host}:2525). Redirecting...</span>
          </div>
        )}

        {/* Form - Role dropdown removed (Public registration is strictly Customer role) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikramaditya Singh"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? 'Creating Customer Account...' : 'Register Customer Account'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/admin/login" className="text-white hover:underline font-semibold">
              Sign In to Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
