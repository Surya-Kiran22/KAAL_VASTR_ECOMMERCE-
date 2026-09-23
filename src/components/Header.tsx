import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, ShieldCheck, Database } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { name: 'Shop', path: '/' },
    { name: 'About & Contact', path: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#0C0C0E]/90 backdrop-blur-md border-b border-[#27272A] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Wordmark / Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="group flex items-center space-x-3">
              <div className="w-9 h-9 rounded-sm bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-zinc-500/30 flex items-center justify-center font-bold text-lg text-white shadow-lg group-hover:border-zinc-400 transition-all">
                KV
              </div>
              <span className="font-bold tracking-[0.25em] text-xl text-white uppercase group-hover:text-zinc-200 transition-colors">
                KAAL VASTR
              </span>
            </Link>

            {/* Supabase Connection Status Badge */}
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider border ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
              title={
                isSupabaseConfigured
                  ? 'Connected to live Supabase PostgreSQL DB & Storage'
                  : 'Running in Standalone Local Mode. Create .env with VITE_SUPABASE_URL to connect live Supabase.'
              }
            >
              <Database className="w-3 h-3" />
              <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Mode'}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs uppercase tracking-widest transition-colors font-medium ${
                  isActive(link.path)
                    ? 'text-white border-b-2 border-white pb-1'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </nav>

          {/* Cart Icon */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all group"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-black font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#141416] border-b border-[#27272A] px-4 pt-3 pb-6 space-y-4">
          <div className="flex items-center space-x-2 py-1">
            <span className="text-[11px] text-zinc-500">Backend Status:</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                isSupabaseConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {isSupabaseConfigured ? 'Supabase Live Connected' : 'Standalone Demo Mode'}
            </span>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm uppercase tracking-wider py-2 font-medium border-b border-zinc-800 ${
                isActive(link.path) ? 'text-white font-semibold' : 'text-zinc-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/admin/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 text-sm uppercase tracking-wider text-zinc-400 py-2 pt-3"
          >
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>Sign In</span>
          </Link>
        </div>
      )}

    </header>
  );
};
