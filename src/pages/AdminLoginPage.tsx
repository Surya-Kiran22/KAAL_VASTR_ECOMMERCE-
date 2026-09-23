import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ShieldCheck, KeyRound, Server, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
