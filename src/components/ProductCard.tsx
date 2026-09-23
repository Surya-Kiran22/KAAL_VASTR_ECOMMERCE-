import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isOutOfStock = product.stock <= 0 || !product.is_available;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-[#141416] border border-[#27272A] rounded-lg overflow-hidden hover:border-zinc-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 flex flex-col"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out ${
            isOutOfStock ? 'opacity-50 grayscale' : 'opacity-95'
          }`}
          loading="lazy"
        />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-zinc-300 font-semibold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm border border-zinc-800">
          {product.category}
        </span>

        {/* Out of stock badge */}
        {isOutOfStock ? (
          <span className="absolute inset-0 m-auto w-max h-max bg-red-950/90 text-red-300 font-semibold text-xs tracking-widest uppercase px-4 py-2 rounded-sm border border-red-800/80 backdrop-blur-sm">
            Sold Out
          </span>
        ) : (
          product.compare_at_price && product.compare_at_price > product.selling_price && (
            <span className="absolute top-3 right-3 bg-white text-black font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm shadow">
              SALE
            </span>
          )
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase group-hover:text-zinc-200 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-bold text-white">
              ₹{product.selling_price.toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && product.compare_at_price > product.selling_price && (
              <span className="text-xs text-zinc-500 line-through">
                ₹{product.compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex space-x-1">
            {product.sizes.slice(0, 3).map((size) => (
              <span
                key={size}
                className="text-[10px] text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded"
              >
                {size}
              </span>
            ))}
            {product.sizes.length > 3 && (
              <span className="text-[10px] text-zinc-500 font-mono self-center">
                +{product.sizes.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
