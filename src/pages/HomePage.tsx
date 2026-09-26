import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowDown, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { fetchProducts } from '../lib/supabase';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  useEffect(() => {
    async function loadData(silent = false) {
      if (!silent) setLoading(true);
      try {
        const data = await fetchProducts(false); // Only active non-archived products
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    }
    loadData();

    // Auto-refresh catalog so stock/price changes appear without a manual reload
    const poll = window.setInterval(() => loadData(true), 30000);
    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering & Sorting
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.selling_price - b.selling_price;
      if (sortBy === 'price-desc') return b.selling_price - a.selling_price;
      return 0;
    });

  const scrollToShop = () => {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden border-b border-[#27272A] bg-gradient-to-b from-[#141416] via-[#0C0C0E] to-[#0C0C0E]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3F3F46_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative max-w-5xl mx-auto px-4 text-center space-y-8 z-10 py-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Autumn / Winter Couture Drop</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-wider uppercase font-sans leading-tight">
            ELEGANCE IN <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent">OBSIDIAN</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed font-light">
            Kaal Vastr creates dark minimalist clothing, heavyweight street apparel, and luxury tailored silhouettes designed for distinction.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToShop}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold text-xs uppercase tracking-widest rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>Explore Shop</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Product Catalogue Section */}
      <section id="catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-wider text-white uppercase">Product Catalogue</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Browse available clothing drops and select sizes to initiate WhatsApp order.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#141416] border border-[#27272A] rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-[#141416] border border-[#27272A] rounded-md text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors appearance-none pr-8 cursor-pointer"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow'
                  : 'bg-[#141416] text-zinc-400 border border-[#27272A] hover:text-white hover:border-zinc-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid / Loading / Empty States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-[#141416] border border-[#27272A] rounded-lg p-4 space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-zinc-800 rounded-md" />
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#141416] border border-[#27272A] rounded-lg space-y-4">
            <p className="text-sm font-semibold uppercase text-zinc-400">No products found</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No products match your search "{searchQuery}" or category filter "{selectedCategory}". Try clearing your query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-zinc-800 text-white text-xs uppercase tracking-wider rounded-md hover:bg-zinc-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </section>
    </div>
  );
};
