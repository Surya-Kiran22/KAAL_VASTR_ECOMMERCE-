import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from './WhatsAppModal';
import { CartItem } from '../types';

/** Units available for the item's exact color/size, as entered by the admin. */
const maxQtyFor = (item: CartItem): number => {
  const map = item.product.variant_stock;
  if (map && item.selectedColor) {
    const key = `${item.selectedColor}|${item.selectedSize}`;
    if (key in map) return Number(map[key]) || 0;
  }
  return item.product.stock;
};

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, isCartOpen, setIsCartOpen } = useCart();
  const { isStaff } = useAuth();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Staff/admin accounts manage operations and do not shop
  if (isStaff) return null;
  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#141416] border-l border-[#27272A] text-white flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-5 h-5 text-white" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-white">Your Cart</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-medium text-zinc-200 uppercase tracking-wider">Your cart is empty</h3>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Discover minimalist streetwear and apparel in our catalogue.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-6 py-2.5 bg-white text-black text-xs uppercase tracking-widest font-semibold rounded-md hover:bg-zinc-200 transition-colors"
                >
                  Explore Catalogue
                </button>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor || ''}-${index}`}
                  className="flex space-x-4 p-4 rounded-lg bg-[#1A1A1E] border border-zinc-800/80"
                >
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-md border border-zinc-800"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-semibold text-white tracking-wide uppercase line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-400 space-x-2 mt-1">
                        <span>Size: <strong className="text-zinc-200">{item.selectedSize}</strong></span>
                        {item.selectedColor && (
                          <span>| Color: <strong className="text-zinc-200">{item.selectedColor}</strong></span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-1">
                        ₹{item.product.selling_price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex items-center border border-zinc-700 rounded bg-zinc-900/80">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-medium text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          disabled={item.quantity >= maxQtyFor(item)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-zinc-400 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {maxQtyFor(item) < item.product.stock && (
                        <span className="text-[10px] text-amber-400">Max {maxQtyFor(item)} available</span>
                      )}
                      <span className="text-xs text-zinc-400 font-medium">
                        ₹{(item.product.selling_price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Trigger */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#27272A] bg-[#0C0C0E] space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery / Shipping</span>
                  <span className="text-emerald-400">Calculated on WhatsApp</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-white pt-2 border-t border-zinc-800">
                  <span>Total Amount</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-widest uppercase rounded-md transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20"
              >
                <span>Order via WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Checkout Modal */}
      {isCheckoutModalOpen && (
        <WhatsAppModal onClose={() => setIsCheckoutModalOpen(false)} />
      )}
    </div>
  );
};
