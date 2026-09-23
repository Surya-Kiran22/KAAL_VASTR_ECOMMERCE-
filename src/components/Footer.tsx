import React from 'react';
import { MapPin, Phone, Clock, MessageSquare, Instagram, Facebook } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export const Footer: React.FC = () => {
  const { settings, loading } = useBusiness();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#08080A] border-t border-[#27272A] text-zinc-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand & Description */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-sm bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-zinc-500/30 flex items-center justify-center font-bold text-sm text-white">
                KV
              </div>
              <span className="font-bold tracking-[0.2em] text-lg text-white uppercase">
                KAAL VASTR
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {settings?.description || 'Bespoke minimalist clothing and obsidian streetwear. Crafted for modern aesthetics with uncompromised quality.'}
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">Contact & Support</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-zinc-300 mt-0.5 shrink-0" />
                <span className="text-zinc-300">
                  {loading ? 'Loading location...' : settings?.address || '104, Obsidian Avenue, Khar West, Mumbai, MH 400052'}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-zinc-300 shrink-0" />
                <span className="text-zinc-300">
                  {loading ? 'Loading phone...' : settings?.mobile_number || '+91 98765 43210'}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${settings?.whatsapp_number || '919876543210'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  WhatsApp: +{settings?.whatsapp_number || '919876543210'}
                </a>
              </li>
            </ul>
          </div>

          {/* Store Hours */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">Store Hours</h3>
            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <Clock className="w-4 h-4 text-zinc-300 mt-0.5 shrink-0" />
              <span>
                {loading ? 'Loading store timings...' : settings?.store_timings || 'Mon - Sat: 11:00 AM - 9:00 PM | Sun: 12:00 PM - 7:00 PM'}
              </span>
            </div>
          </div>

          {/* Social Links & Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">Connect</h3>
            <p className="text-xs text-zinc-400">
              Follow our official channels for drop announcements and custom releases.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href={settings?.instagram_url || 'https://instagram.com/kaalvastr'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.facebook_url || 'https://facebook.com/kaalvastr'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-500">
          <p>© {currentYear} Kaal Vastr Clothing. All rights reserved. Powered by Supabase Backend.</p>
        </div>
      </div>
    </footer>
  );
};
