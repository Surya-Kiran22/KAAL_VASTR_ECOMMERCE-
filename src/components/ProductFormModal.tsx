import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { saveProduct, uploadProductImage } from '../lib/supabase';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onClose, onSaved }) => {
  const isEditing = Boolean(product?.id);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Hoodies');
  const [brand, setBrand] = useState(product?.brand || 'Kaal Vastr');
  const [sku, setSku] = useState(product?.sku || `KV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState(product?.description || '');
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price ? String(product.selling_price) : '');
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compare_at_price ? String(product.compare_at_price) : '');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(product?.sizes || ['S', 'M', 'L', 'XL']);
  const [colorsInput, setColorsInput] = useState(product?.colors ? product.colors.join(', ') : 'Charcoal, Black');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [stock, setStock] = useState(product?.stock !== undefined ? String(product.stock) : '10');
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [isArchived, setIsArchived] = useState(product?.is_archived ?? false);

  // Per-variant stock, keyed "color|size"
  const [variantStock, setVariantStock] = useState<Record<string, number>>(
    product?.variant_stock ? { ...product.variant_stock } : {}
  );
  const [useVariantStock, setUseVariantStock] = useState<boolean>(
    Boolean(product?.variant_stock && Object.keys(product.variant_stock).length > 0)
  );

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await uploadProductImage(file);
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const parseColors = () =>
    colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

  const variantKey = (color: string, size: string) => `${color}|${size}`;

  const setVariantQty = (color: string, size: string, value: number) => {
    setVariantStock((prev) => {
      const next = { ...prev };
      const key = variantKey(color, size);
      if (value > 0) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const getVariantQty = (color: string, size: string) => {
    const key = variantKey(color, size);
    return variantStock[key] ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || !sku.trim()) {
      setError('Please fill out all required fields (Name, SKU, Selling Price)');
      return;
    }

    if (selectedSizes.length === 0) {
      setError('Please select at least one available size');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const colorsArray = parseColors();

      // When per-variant stock is enabled, the flat total is the sum of all variants
      const variantTotal = Object.values(variantStock).reduce((a, b) => a + b, 0);
      const effectiveStock = useVariantStock ? variantTotal : (parseInt(stock, 10) || 0);

      const productPayload: Partial<Product> = {
        id: product?.id,
        name: name.trim(),
        category: category.trim(),
        brand: brand.trim(),
        sku: sku.trim(),
        description: description.trim(),
        selling_price: parseFloat(sellingPrice),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        sizes: selectedSizes,
        colors: colorsArray,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        stock: effectiveStock,
        variant_stock: useVariantStock ? variantStock : null,
        is_available: useVariantStock ? variantTotal > 0 : isAvailable,
        is_archived: isArchived,
      };

      await saveProduct(productPayload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#141416] border border-[#27272A] rounded-lg p-6 sm:p-8 shadow-2xl space-y-6 text-white my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold tracking-wider uppercase text-white">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-zinc-400">Save product specs to Supabase PostgreSQL database</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-md text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shadow Oversized Hoodie"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                SKU *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="KV-HD-001"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Row 2: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="Hoodies">Hoodies</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Pants">Pants</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Sweatshirts">Sweatshirts</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Row 3: Prices & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="4499"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Compare-at Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="5999"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Stock Inventory {useVariantStock && <span className="text-zinc-500 normal-case">(auto-summed)</span>}
              </label>
              <input
                type="number"
                value={useVariantStock ? String(Object.values(variantStock).reduce((a, b) => a + b, 0)) : stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                disabled={useVariantStock}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Per-Variant (Color x Size) Stock */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Quantity Per Color &amp; Size
                </label>
                <p className="text-[11px] text-zinc-500">
                  Enter the exact quantity available for each color/size combination. Total stock is
                  calculated automatically.
                </p>
              </div>
              <label className="inline-flex items-center space-x-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium uppercase tracking-wider rounded-md cursor-pointer transition-colors border border-zinc-700 shrink-0">
                <input
                  type="checkbox"
                  checked={useVariantStock}
                  onChange={(e) => setUseVariantStock(e.target.checked)}
                  className="w-3 h-3 accent-white"
                />
                <span>Enabled</span>
              </label>
            </div>

            {useVariantStock && parseColors().length > 0 && selectedSizes.length > 0 ? (
              <div className="overflow-x-auto border border-zinc-800 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Color \ Size</th>
                      {selectedSizes.map((size) => (
                        <th key={size} className="px-3 py-2 text-center font-semibold">
                          {size}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-semibold">Row Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {parseColors().map((color) => {
                      const rowTotal = selectedSizes.reduce(
                        (sum, size) => sum + getVariantQty(color, size),
                        0
                      );
                      return (
                        <tr key={color} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="px-3 py-2 font-medium text-white whitespace-nowrap">{color}</td>
                          {selectedSizes.map((size) => {
                            const qty = getVariantQty(color, size);
                            return (
                              <td key={size} className="px-2 py-1.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={qty === 0 ? '' : qty}
                                  onChange={(e) =>
                                    setVariantQty(color, size, Math.max(0, parseInt(e.target.value || '0', 10) || 0))
                                  }
                                  placeholder="0"
                                  className={`w-14 px-2 py-1.5 bg-zinc-900 border rounded text-center text-xs text-white focus:outline-none ${
                                    qty === 0
                                      ? 'border-zinc-700 text-zinc-500'
                                      : qty <= 5
                                      ? 'border-amber-700 text-amber-300'
                                      : 'border-zinc-600'
                                  }`}
                                />
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-mono text-zinc-300">
                            {rowTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-zinc-900/70 border-t border-zinc-800">
                    <tr>
                      <td
                        className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 font-semibold"
                        colSpan={selectedSizes.length + 1}
                      >
                        Total Units
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                        {Object.values(variantStock).reduce((a, b) => a + b, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : useVariantStock ? (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
                Add at least one color and one size to enter per-variant quantities.
              </p>
            ) : null}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Heavyweight 450 GSM cotton hoodie..."
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Available Sizes Checklist */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Available Sizes *
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((size) => {
                const checked = selectedSizes.includes(size);
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wider transition-all flex items-center space-x-1.5 ${
                      checked
                        ? 'bg-white text-black font-bold shadow'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                    <span>{size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors List */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Colors (Comma Separated)
            </label>
            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="Obsidian Black, Charcoal Grey"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Image Upload & URL */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Product Image (Supabase Storage / URL)
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Preview Thumbnail */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-20 h-24 object-cover rounded-md border border-zinc-700 bg-zinc-900"
                />
              )}

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none focus:border-zinc-500"
                />

                <div className="relative">
                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-md cursor-pointer transition-colors border border-zinc-700">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading image...' : 'Upload Image File to Supabase'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Archive Checkboxes */}
          <div className="flex flex-col sm:flex-row gap-6 pt-2 border-t border-zinc-800">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-zinc-300">Is Available / In Stock</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-red-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-zinc-300">Archive / Hide from Customers</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs uppercase tracking-wider font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-white text-black font-semibold text-xs uppercase tracking-widest rounded-md hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
