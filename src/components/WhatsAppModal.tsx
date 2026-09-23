import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, CheckCircle2, ShoppingBag, ArrowLeft, Lock, UserPlus, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { saveOrder } from '../lib/supabase';

interface WhatsAppModalProps {
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart, setIsCartOpen } = useCart();
  const { settings } = useBusiness();
  const { user, isAdmin } = useAuth();

  const [customerName, setCustomerName] = useState(user?.user_metadata?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [error, setError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{ name: string; total: number; itemCount: number } | null>(null);

  const isLoggedIn = Boolean(user || isAdmin);

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and contact mobile number.');
      return;
    }


    // Save order into Supabase / local storage engine
    const orderItems = cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      size: item.selectedSize,
      color: item.selectedColor,
      quantity: item.quantity,
      price: item.product.selling_price,
    }));

    try {
      await saveOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address_notes: addressNotes.trim(),
        items: orderItems,
        total_amount: subtotal,
      });
    } catch (err) {
      console.warn('Could not record order to backend database:', err);
    }

    const targetNumber = settings?.whatsapp_number || '919876543210';
    const cleanNumber = targetNumber.replace(/\D/g, '');

    const itemsListText = cart
      .map((item, idx) => {
        const itemTotal = item.product.selling_price * item.quantity;
        return `${idx + 1}. *${item.product.name}*\n   • Size: ${item.selectedSize}${item.selectedColor ? ` | Color: ${item.selectedColor}` : ''}\n   • Qty: ${item.quantity} x ₹${item.product.selling_price.toLocaleString('en-IN')} = ₹${itemTotal.toLocaleString('en-IN')}`;
      })
      .join('\n\n');

    const totalItemCount = cart.reduce((s, i) => s + i.quantity, 0);

    const message = `🛍️ *NEW ORDER - KAAL VASTR*\n----------------------------------------\n👤 *Customer:* ${customerName.trim()}\n📞 *Phone:* ${customerPhone.trim()}${addressNotes.trim() ? `\n📍 *Address / Notes:* ${addressNotes.trim()}` : ''}\n\n📦 *Order Items:*\n${itemsListText}\n\n💰 *Total Amount:* ₹${subtotal.toLocaleString('en-IN')}\n----------------------------------------\nPlease confirm availability and dispatch instructions.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    // Open WhatsApp in new tab / mobile app
    window.open(whatsappUrl, '_blank');

    // Save details for thank-you return screen
    setConfirmedDetails({
      name: customerName.trim(),
      total: subtotal,
      itemCount: totalItemCount,
    });

    // Clear cart and show site return screen
    clearCart();
    setOrderConfirmed(true);
  };


  const handleReturnToSite = () => {
    onClose();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#141416] border border-[#27272A] rounded-lg p-6 shadow-2xl space-y-5 text-white">
        
        {!isLoggedIn ? (
          /* Mandatory Login / Register Prompt for Shopping */
          <div className="text-center py-4 space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold tracking-wider uppercase text-white">
                Account Login Required
              </h3>
              <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                To complete your order and receive dispatch updates on WhatsApp, please sign in or create a customer account first.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-900/80 rounded-md border border-zinc-800 text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-zinc-400">
                <span>Selected Items:</span>
                <span className="text-zinc-200 font-medium">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Amount:</span>
                <span className="text-white font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={() => {
                  onClose();
                  setIsCartOpen(false);
                  navigate('/admin/login');
                }}
                className="w-full py-3.5 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  setIsCartOpen(false);
                  navigate('/register');
                }}
                className="w-full py-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs tracking-widest uppercase rounded-md transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Register New Customer Account</span>
              </button>
            </div>
          </div>
        ) : orderConfirmed ? (

          /* Order Confirmation / Return to Website View */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-wider uppercase text-white">
                Order Initiated on WhatsApp!
              </h3>
              <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{confirmedDetails?.name}</strong>. Your structured order details were forwarded to our WhatsApp team (+{settings?.whatsapp_number || '919876543210'}).
              </p>
            </div>

            <div className="p-4 bg-zinc-900/80 rounded-md border border-zinc-800 text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-zinc-400">
                <span>Items Selected:</span>
                <span className="text-zinc-200 font-medium">{confirmedDetails?.itemCount} items</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Amount:</span>
                <span className="text-emerald-400 font-bold">₹{confirmedDetails?.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-800/80">
                <span>Status:</span>
                <span className="text-amber-400 font-medium">Awaiting WhatsApp Confirmation</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleReturnToSite}
                className="w-full py-3.5 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Kaal Vastr Store</span>
              </button>

              <button
                onClick={() => {
                  const targetNumber = settings?.whatsapp_number || '919876543210';
                  window.open(`https://wa.me/${targetNumber.replace(/\D/g, '')}`, '_blank');
                }}
                className="w-full text-center text-xs text-emerald-400 hover:underline flex items-center justify-center space-x-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Re-open WhatsApp Chat</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-white">WhatsApp Checkout</h3>
                  <p className="text-[11px] text-zinc-400">Direct order booking with Kaal Vastr</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary Pill */}
            <div className="p-3 bg-zinc-900/80 rounded-md border border-zinc-800 flex justify-between items-center text-xs">
              <span className="text-zinc-400">
                Order Total ({cart.reduce((s, i) => s + i.quantity, 0)} items):
              </span>
              <span className="font-bold text-white text-sm">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-md text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                  WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                  Delivery Address / Special Notes (Optional)
                </label>
                <textarea
                  value={addressNotes}
                  onChange={(e) => setAddressNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Flat 402, Sunshine Heights, Bandra West, Mumbai"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-widest uppercase rounded-md transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Send Order via WhatsApp</span>
                </button>

                <p className="text-[10px] text-center text-zinc-500 leading-tight">
                  Redirects to official Kaal Vastr WhatsApp (+{settings?.whatsapp_number || '919876543210'}). Website will automatically show your order return confirmation.
                </p>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
