-- ============================================================================
-- Kaal Vastr — Demo Seed Data
-- ----------------------------------------------------------------------------
-- Loaded automatically during `supabase db reset` / `supabase start`
-- (see supabase/config.toml => [db.seed]).
-- ============================================================================

insert into public.business_settings (
  business_name, tagline, description, whatsapp_number, mobile_number, email,
  address, store_timings, instagram_url, facebook_url, gst_number
) values (
  'Kaal Vastr',
  'Darkness, Tailored.',
  'Minimalist dark grey & silver aesthetic streetwear and luxury clothing, crafted for distinction.',
  '919876543210',
  '+91 98765 43210',
  'contact@kaalvastr.in',
  '104, Obsidian Avenue, Khar West, Mumbai, MH 400052',
  'Mon - Sat: 11:00 AM - 9:00 PM | Sun: 12:00 PM - 7:00 PM',
  'https://instagram.com/kaalvastr',
  'https://facebook.com/kaalvastr',
  '27AAAKV0000A1Z5'
) on conflict do nothing;

insert into public.products (name, category, brand, sku, description, selling_price, compare_at_price, sizes, colors, image_url, images, stock, is_available, is_archived) values
(
  'Shadow Oversized Hoodie', 'Hoodies', 'Kaal Vastr', 'KV-HD-001',
  'Heavyweight 450 GSM French Terry cotton hoodie in deep obsidian black. Features dropped shoulders, double-stitched seams and clean silver logo print.',
  4499.00, 5999.00,
  array['S', 'M', 'L', 'XL'], array['Obsidian Black', 'Charcoal Grey'],
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  array['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80'],
  15, true, false
),
(
  'Obsidian Acid-Wash Tee', 'T-Shirts', 'Kaal Vastr', 'KV-TS-002',
  'Custom vintage acid-washed 260 GSM combed cotton t-shirt featuring subtle silver typography on the chest.',
  2199.00, 2799.00,
  array['S', 'M', 'L', 'XL', 'XXL'], array['Acid Black', 'Silver Dust'],
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  array['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
  25, true, false
),
(
  'Monolith Utility Cargo Pants', 'Pants', 'Kaal Vastr', 'KV-PT-003',
  'Tapered cargo trousers constructed from weather-resistant ripstop canvas with 6 tactical pockets and adjustable ankles.',
  4999.00, 6499.00,
  array['M', 'L', 'XL'], array['Charcoal Grey', 'Deep Black'],
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  array['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80'],
  8, true, false
),
(
  'Nocturne Bomber Jacket', 'Outerwear', 'Kaal Vastr', 'KV-JK-004',
  'Minimalist matte black nylon bomber jacket with brushed silver zippers and premium satin thermal lining.',
  7999.00, 9999.00,
  array['S', 'M', 'L'], array['Matte Black'],
  'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
  array['https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80'],
  5, true, false
),
(
  'Vanguard Sweatshirt', 'Sweatshirts', 'Kaal Vastr', 'KV-SW-005',
  'Structured French terry crewneck with tonal embroidered Kaal Vastr chest crest and rib-knit cuffs.',
  3499.00, 4299.00,
  array['S', 'M', 'L', 'XL'], array['Steel Grey', 'Coal Black'],
  'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
  array['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80'],
  12, true, false
),
(
  'Eclipse Structured Blazer', 'Outerwear', 'Kaal Vastr', 'KV-BL-006',
  'Modern unconstructed tailored jacket crafted from premium wool-blend twill with clean lapels and minimal silver hardware.',
  8999.00, 11999.00,
  array['M', 'L', 'XL'], array['Charcoal Grey'],
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  array['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'],
  4, true, false
)
on conflict (sku) do nothing;

-- Sample order history for the admin sales dashboard
insert into public.orders (customer_name, customer_phone, address_notes, items, total_amount, status, created_at)
select
  'Aarav Mehta', '+91 98201 44321', 'Penthouse 12B, Sea Crest Towers, Worli, Mumbai',
  jsonb_build_array(
    jsonb_build_object('product_id', (select id from public.products where sku = 'KV-HD-001'), 'product_name', 'Shadow Oversized Hoodie', 'size', 'L', 'color', 'Obsidian Black', 'quantity', 1, 'price', 4499),
    jsonb_build_object('product_id', (select id from public.products where sku = 'KV-TS-002'), 'product_name', 'Obsidian Acid-Wash Tee', 'size', 'XL', 'color', 'Acid Black', 'quantity', 2, 'price', 2199)
  ),
  8897, 'fulfilled', now() - interval '2 hours'
union all
select
  'Rohan Kapoor', '+91 98760 12345', '702, Silver Oak Residency, Bandra West, Mumbai',
  jsonb_build_array(
    jsonb_build_object('product_id', (select id from public.products where sku = 'KV-BL-006'), 'product_name', 'Eclipse Structured Blazer', 'size', 'M', 'color', 'Charcoal Grey', 'quantity', 1, 'price', 8999)
  ),
  8999, 'confirmed', now() - interval '5 hours'
union all
select
  'Ananya Verma', '+91 99112 33445', 'B-405, Olive Heights, Indiranagar, Bengaluru',
  jsonb_build_array(
    jsonb_build_object('product_id', (select id from public.products where sku = 'KV-PT-003'), 'product_name', 'Monolith Utility Cargo Pants', 'size', 'M', 'color', 'Deep Black', 'quantity', 1, 'price', 4999),
    jsonb_build_object('product_id', (select id from public.products where sku = 'KV-SW-005'), 'product_name', 'Vanguard Sweatshirt', 'size', 'S', 'color', 'Steel Grey', 'quantity', 1, 'price', 3499)
  ),
  8498, 'pending', now() - interval '26 hours'
on conflict (created_at) do nothing;
