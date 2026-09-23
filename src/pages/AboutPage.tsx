import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, Mail, Instagram, Facebook } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export const AboutPage: React.FC = () => {
  const { settings, loading } = useBusiness();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      {/* Brand Story Header */}
      <div className="text-center space-y-4 border-b border-zinc-800 pb-12">
        <div className="inline-block w-12 h-12 rounded-sm bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-zinc-500/30 flex items-center justify-center font-bold text-xl text-white shadow-xl mx-auto">
          KV
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-widest text-white uppercase font-sans">
          KAAL VASTR
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
          {settings?.description || 'Bespoke minimalist clothing and obsidian streetwear. Crafted for modern aesthetics with uncompromised quality.'}
        </p>
      </div>

      {/* Business Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Store Location & Timings */}
        <div className="bg-[#141416] border border-[#27272A] rounded-lg p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white border-b border-zinc-800 pb-3">
            Flagship Store Location
          </h2>
          
          <div className="space-y-4 text-xs text-zinc-300">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-zinc-300 mt-0.5 shrink-0" />
              <div>
                <strong className="block text-white mb-1">Studio & Store Address</strong>
                <p className="leading-relaxed">
                  {loading ? 'Loading location details...' : settings?.address || '104, Obsidian Avenue, Khar West, Mumbai, MH 400052'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-3 border-t border-zinc-800/80">
              <Clock className="w-5 h-5 text-zinc-300 mt-0.5 shrink-0" />
              <div>
                <strong className="block text-white mb-1">Store Timings</strong>
                <p className="leading-relaxed">
                  {loading ? 'Loading timings...' : settings?.store_timings || 'Mon - Sat: 11:00 AM - 9:00 PM | Sun: 12:00 PM - 7:00 PM'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & WhatsApp Channel */}
        <div className="bg-[#141416] border border-[#27272A] rounded-lg p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white border-b border-zinc-800 pb-3">
            Direct Client Support
          </h2>

          <div className="space-y-4 text-xs text-zinc-300">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-zinc-300 shrink-0" />
              <div>
                <strong className="block text-white">Mobile Helpline</strong>
                <span>{loading ? 'Loading...' : settings?.mobile_number || '+91 98765 43210'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-zinc-800/80">
              <Mail className="w-5 h-5 text-zinc-300 shrink-0" />
              <div>
                <strong className="block text-white">Official Email</strong>
                <span>{loading ? 'Loading...' : settings?.email || 'contact@kaalvastr.in'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80">
              <a
                href={`https://wa.me/${settings?.whatsapp_number || '919876543210'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-widest uppercase rounded-md transition-all flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp (+{settings?.whatsapp_number || '919876543210'})</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Social Media Section */}
      <div className="bg-[#141416] border border-[#27272A] rounded-lg p-8 text-center space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white">Official Social Outlets</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Follow our lookbooks, behind-the-scenes tailoring, and drop notifications.
        </p>
        <div className="flex justify-center space-x-4 pt-2">
          <a
            href={settings?.instagram_url || 'https://instagram.com/kaalvastr'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white hover:border-zinc-500 transition-colors flex items-center space-x-2"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </a>
          <a
            href={settings?.facebook_url || 'https://facebook.com/kaalvastr'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white hover:border-zinc-500 transition-colors flex items-center space-x-2"
          >
            <Facebook className="w-4 h-4" />
            <span>Facebook</span>
          </a>
        </div>
      </div>

    </div>
  );
};
