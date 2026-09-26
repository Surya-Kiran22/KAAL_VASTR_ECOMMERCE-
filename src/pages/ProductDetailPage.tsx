import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, MessageSquare } from 'lucide-react';
import { Product } from '../types';
import { fetchProductById } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isStaff } = useAuth();
  const { settings } = useBusiness();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [sizeError, setSizeError] = useState<string>('');

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchProductById(id);
        if (data) {
          setProduct(data);
          setSelectedImage(data.image_url);
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0]);
          }
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-zinc-800 rounded-lg" />
          <div className="space-y-6">
            <div className="h-6 bg-zinc-800 rounded w-1/3" />
            <div className="h-8 bg-zinc-800 rounded w-3/4" />
            <div className="h-6 bg-zinc-800 rounded w-1/4" />
            <div className="h-24 bg-zinc-800 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold uppercase text-white">Product Not Found</h2>
        <p className="text-xs text-zinc-400">
          The requested clothing piece is no longer available or does not exist.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-white text-black text-xs font-semibold uppercase tracking-widest rounded-md hover:bg-zinc-200 transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0 || !product.is_available;
  const galleryImages = Array.from(new Set([product.image_url, ...(product.images || [])])).filter(Boolean);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError('Please select a size to proceed');
      return;
    }
    setSizeError('');
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleDirectWhatsApp = () => {
    if (!selectedSize) {
      setSizeError('Please select a size to proceed');
      return;
    }
    setSizeError('');
    const targetNumber = settings?.whatsapp_number || '919876543210';
    const cleanNumber = targetNumber.replace(/\D/g, '');
    const message = `Hi Kaal Vastr,\n\nI want to order:\n• *${product.name}*\n• SKU: ${product.sku}\n• Size: ${selectedSize}${selectedColor ? ` | Color: ${selectedColor}` : ''}\n• Quantity: ${quantity}\n• Price: ₹${(product.selling_price * quantity).toLocaleString('en-IN')}\n\nPlease confirm availability!`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalogue</span>
      </button>

      {/* Main product view grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] w-full bg-[#141416] border border-[#27272A] rounded-lg overflow-hidden shadow-2xl">
            <img
              src={selectedImage || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-950 text-red-300 font-bold text-sm uppercase tracking-widest px-4 py-2 border border-red-800 rounded-sm">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {galleryImages.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {galleryImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-20 h-24 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === imgUrl ? 'border-white opacity-100' : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} preview ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Actions */}
        <div className="space-y-6 bg-[#141416] border border-[#27272A] rounded-lg p-6 sm:p-8">
          
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono tracking-widest uppercase mb-2">
              <span>{product.category}</span>
              <span>SKU: {product.sku}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-white uppercase font-sans">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline space-x-3 py-3 border-y border-zinc-800">
            <span className="text-2xl font-bold text-white">
              ₹{product.selling_price.toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && product.compare_at_price > product.selling_price && (
              <span className="text-sm text-zinc-500 line-through">
                ₹{product.compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
            {product.compare_at_price && product.compare_at_price > product.selling_price && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                Save ₹{(product.compare_at_price - product.selling_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light">
            {product.description}
          </p>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
              <span className="text-zinc-300">Select Size *</span>
              {sizeError && <span className="text-red-400 text-[11px] lowercase font-normal">{sizeError}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                const isAvailableSize = product.sizes.includes(size);
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    disabled={!isAvailableSize || isOutOfStock}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError('');
                    }}
                    className={`w-12 h-11 rounded-md text-xs font-semibold tracking-wider transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-white text-black font-bold shadow-lg'
                        : isAvailableSize && !isOutOfStock
                        ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-500'
                        : 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed line-through opacity-50'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector (If present) */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Color Variant
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedColor === color
                        ? 'bg-zinc-200 text-black border border-white'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector - hidden for staff/admin */}
          <div className="space-y-3">
            {!isStaff && (
              <>
                <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Quantity
                </span>
                <div className="flex items-center w-max border border-zinc-700 rounded-md bg-zinc-900">
                  <button
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-white">{quantity}</span>
                  <button
                    disabled={quantity >= product.stock || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Toast Notification */}
          {addedToast && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Added to shopping cart!</span>
            </div>
          )}

          {/* Action Buttons - Add to Cart hidden for staff/admin */}
          <div className="pt-4 space-y-3">
            {!isStaff && (
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="w-full py-4 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add To Cart</span>
              </button>
            )}

            <button
              disabled={isOutOfStock}
              onClick={handleDirectWhatsApp}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-widest uppercase rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buy Now via WhatsApp</span>
            </button>
          </div>

          {/* Guarantee Badges */}
          <div className="pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4 text-[11px] text-zinc-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
              <span>Authentic Kaal Vastr Piece</span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-zinc-300" />
              <span>Express Nationwide Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-zinc-300" />
              <span>Size Exchange Guarantee</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
