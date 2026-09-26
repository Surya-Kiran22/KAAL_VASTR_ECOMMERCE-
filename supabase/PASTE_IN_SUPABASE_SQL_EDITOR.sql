-- ############################################################################
-- Kaal Vastr - PRODUCTION SCHEMA REPAIR (paste into Supabase SQL editor)
-- ############################################################################
-- Generated from, and kept in sync with, these two source files:
--   1. supabase/migrations/20260921000000_initial_schema.sql
--   2. supabase/migrations/20260926000000_variant_stock_staff_dispatch_staff_directory.sql
--
-- ORDER MATTERS. Run section 1 BEFORE section 2: the second file adds
-- policies and functions on public.profiles, which section 1 creates.
--
-- Both sections are idempotent and safe to run against the existing
-- products / orders / business_settings tables - they only add what is
-- missing. No existing rows are modified or deleted.
--
-- After this succeeds, promote your own account (run separately):
--   select public.promote_to_admin('your-email@example.com');
-- ############################################################################
-- ============================================================================
-- Kaal Vastr â€” Initial Schema & Secure Row Level Security
-- ----------------------------------------------------------------------------
-- This migration is idempotent. It can be applied to a brand-new project OR
-- to an existing project that already contains the earlier Kaal Vastr tables.
--
-- Security model
--   * Everyone (anon + signed-in customers) can SELECT published products
--     (non-archived) and read business_settings.
--   * Only users whose `profiles.role = 'admin'` can INSERT / UPDATE / DELETE
--     products, business_settings and manage orders.
--   * Customers can INSERT order logs during checkout but never read/alter
--     other orders.
--   * Product image storage: public read, admin-only write.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. PROFILES (application role directory)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill a profile row for every auth user that already exists
-- (keeps existing Supabase accounts working after the upgrade).
insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  'customer'
from auth.users
on conflict (id) do nothing;

-- Keep updated_at fresh on profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row automatically whenever a new auth user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Authorization helpers (security definer so RLS never blocks them)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    (auth.uid() = id and (role = (select role from public.profiles where id = auth.uid())))
    or public.is_admin()
  );

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (true);

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  brand text not null default 'Kaal Vastr',
  sku text not null,
  description text,
  selling_price numeric(10, 2) not null check (selling_price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  sizes text[] not null default array['S', 'M', 'L', 'XL'],
  colors text[] not null default array['Charcoal', 'Black', 'Silver'],
  image_url text,
  images text[] not null default array[]::text[],
  stock integer not null default 10 check (stock >= 0),
  is_available boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent padding for any older variant of the table
alter table public.products add column if not exists name text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists brand text not null default 'Kaal Vastr';
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists selling_price numeric(10, 2) not null default 0;
alter table public.products add column if not exists compare_at_price numeric(10, 2);
alter table public.products add column if not exists sizes text[] not null default array['S', 'M', 'L', 'XL'];
alter table public.products add column if not exists colors text[] not null default array['Charcoal', 'Black', 'Silver'];
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists images text[] not null default array[]::text[];
alter table public.products add column if not exists stock integer not null default 10;
alter table public.products add column if not exists is_available boolean not null default true;
alter table public.products add column if not exists is_archived boolean not null default false;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_sku_key on public.products (sku);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Customers can read every non-archived product (out-of-stock items still show).
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (is_archived = false);

-- Admins can see everything, including archived products.
drop policy if exists "products_admin_read_all" on public.products;
create policy "products_admin_read_all"
  on public.products for select
  using (public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. BUSINESS SETTINGS (single configuration row)
-- ---------------------------------------------------------------------------
create table if not exists public.business_settings (
  id uuid not null primary key default gen_random_uuid(),
  business_name text not null default 'Kaal Vastr',
  description text default 'Premium bespoke clothing and dark minimalist couture.',
  tagline text,
  whatsapp_number text not null default '919876543210',
  mobile_number text default '+91 98765 43210',
  email text default 'support@kaalvastr.in',
  address text default '104, Obsidian Avenue, Khar West, Mumbai, Maharashtra 400052',
  store_timings text default 'Mon - Sat: 11:00 AM - 9:00 PM | Sun: 12:00 PM - 7:00 PM',
  instagram_url text,
  facebook_url text,
  logo_url text,
  gst_number text,
  updated_at timestamptz not null default now()
);

alter table public.business_settings add column if not exists business_name text not null default 'Kaal Vastr';
alter table public.business_settings add column if not exists description text;
alter table public.business_settings add column if not exists tagline text;
alter table public.business_settings add column if not exists whatsapp_number text not null default '919876543210';
alter table public.business_settings add column if not exists mobile_number text;
alter table public.business_settings add column if not exists email text;
alter table public.business_settings add column if not exists address text;
alter table public.business_settings add column if not exists store_timings text;
alter table public.business_settings add column if not exists instagram_url text;
alter table public.business_settings add column if not exists facebook_url text;
alter table public.business_settings add column if not exists logo_url text;
alter table public.business_settings add column if not exists gst_number text;
alter table public.business_settings add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_business_settings_updated_at on public.business_settings;
create trigger trg_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

alter table public.business_settings enable row level security;

drop policy if exists "business_settings_public_read" on public.business_settings;
create policy "business_settings_public_read"
  on public.business_settings for select
  using (true);

drop policy if exists "business_settings_admin_insert" on public.business_settings;
create policy "business_settings_admin_insert"
  on public.business_settings for insert
  with check (public.is_admin());

drop policy if exists "business_settings_admin_update" on public.business_settings;
create policy "business_settings_admin_update"
  on public.business_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. ORDERS (WhatsApp order log for admin analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid not null primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  address_notes text,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists address_notes text;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists total_amount numeric(10, 2) not null default 0;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists created_at timestamptz not null default now();

alter table public.orders enable row level security;

-- Any customer can log an order during checkout; it can never be read/altered
-- by customers (keeps order data private between client & customer).
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
  on public.orders for insert
  with check (true);

drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select"
  on public.orders for select
  using (public.is_staff_or_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
  on public.orders for update
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
  on public.orders for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. STORAGE â€” product image bucket (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. GRANTS (explicit, deterministic across hosted & local projects)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.business_settings to anon, authenticated;
grant insert, update, delete on public.business_settings to authenticated;

grant insert, select, update, delete on public.orders to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Helper: promote an existing user to admin
--    Run this in the Supabase SQL editor once for your own account:
--    select public.promote_to_admin('you@example.com');
-- ---------------------------------------------------------------------------
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set role = 'admin'
  from auth.users u
  where u.id = p.id and u.email = target_email;
end $$;
-- ############################################################################
-- SECTION 2 of 2
-- Variant stock + staff-only dispatch + database-backed staff directory
-- Source: 20260926000000_variant_stock_staff_dispatch_staff_directory.sql
-- ############################################################################
-- =============================================================================
-- VARIANT STOCK + STAFF-ONLY DISPATCH + DATABASE-BACKED STAFF DIRECTORY
-- =============================================================================
-- 1. products.variant_stock   -> per "color|size" quantities entered by admin
-- 2. orders                   -> dispatch status updates are STAFF ONLY
--                               (admins keep read-only access)
-- 3. profiles.email           -> staff/admin directory can be read from the DB
-- 4. set_user_role()          -> admin-only RPC to promote/demote accounts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PER-VARIANT (COLOR x SIZE) STOCK
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists variant_stock jsonb;

comment on column public.products.variant_stock is
  'Per-variant stock keyed by "color|size", e.g. {"Black|S":4,"Black|M":0}. NULL means use the flat stock column.';

-- Guard against malformed payloads coming from the client.
create or replace function public.products_variant_stock_is_valid()
returns boolean
language plpgsql
immutable
as $$
declare
  entry jsonb;
begin
  if new.variant_stock is null then
    return true;
  end if;

  if jsonb_typeof(new.variant_stock) <> 'object' then
    return false;
  end if;

  for entry in select * from jsonb_each(new.variant_stock) loop
    -- keys must look like "Color|Size"
    if entry.key not like '%|%' then
      return false;
    end if;
    -- values must be non-negative whole numbers
    if jsonb_typeof(entry.value) <> 'number'
       or (entry.value #>> '{}')::numeric < 0
       or (entry.value #>> '{}')::numeric <> trunc((entry.value #>> '{}')::numeric) then
      return false;
    end if;
  end loop;

  return true;
end $$;

drop trigger if exists trg_products_variant_stock_valid on public.products;
create trigger trg_products_variant_stock_valid
  before insert or update of variant_stock on public.products
  for each row execute function public.products_variant_stock_is_valid();

-- Keep the flat "stock" column in sync with the sum of the variants so that
-- list views, search and analytics stay correct without extra joins.
create or replace function public.products_sync_total_stock()
returns trigger
language plpgsql
as $$
declare
  total integer;
begin
  if new.variant_stock is not null
     and jsonb_typeof(new.variant_stock) = 'object'
     and new.variant_stock <> '{}'::jsonb then
    select coalesce(sum(value::text::numeric), 0)::integer
      into total
      from jsonb_each_text(new.variant_stock);

    new.stock := total;
    -- A variant-tracked product with zero units is automatically out of stock.
    if total = 0 then
      new.is_available := false;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_products_sync_total_stock on public.products;
create trigger trg_products_sync_total_stock
  before insert or update of variant_stock on public.products
  for each row execute function public.products_sync_total_stock();

-- ---------------------------------------------------------------------------
-- 2. DISPATCH STATUS IS STAFF ONLY (ADMINS ARE READ-ONLY)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff_only()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'staff'
  );
$$;

-- Restrict the UPDATE grant to the status column only, so the dispatch action
-- cannot be used to tamper with order contents, totals or customer details.
revoke update on public.orders from anon, authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_staff_update_status" on public.orders;
create policy "orders_staff_update_status"
  on public.orders for update
  using (public.is_staff_only())
  with check (public.is_staff_only());

-- Safety net at the row level: even if a wider UPDATE grant is ever restored,
-- an admin may never move a dispatch status forward.
create or replace function public.orders_block_admin_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not public.is_staff_only() then
    raise exception 'Only staff accounts can update the dispatch status';
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_staff_only_status on public.orders;
create trigger trg_orders_staff_only_status
  before update on public.orders
  for each row execute function public.orders_block_admin_status_change();

-- ---------------------------------------------------------------------------
-- 3. STAFF / ADMIN DIRECTORY FROM THE DATABASE
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

-- Backfill emails for every profile that exists today.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create unique index if not exists profiles_email_key
  on public.profiles (lower(email))
  where email is not null;

-- New sign-ups must record their email so the directory stays complete.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'customer', new.email)
  on conflict (id) do nothing;
  return new;
end $$;

-- New sign-ups always start as customers. Role elevation is only possible
-- through the admin-only set_user_role() RPC below, never through metadata.
create or replace function public.handle_profile_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null and tg_op = 'INSERT' then
    select u.email into new.email
    from auth.users u
    where u.id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_email_lookup on public.profiles;
create trigger trg_profiles_email_lookup
  before insert on public.profiles
  for each row execute function public.handle_profile_email_update();

-- Staff and admins may read the staff/admin directory. Customers stay private.
drop policy if exists "profiles_staff_directory_read" on public.profiles;
create policy "profiles_staff_directory_read"
  on public.profiles for select
  using (
    public.is_staff_or_admin()
    and role in ('admin', 'staff')
  );

-- ---------------------------------------------------------------------------
-- 4. ADMIN-ONLY ROLE MANAGEMENT
-- ---------------------------------------------------------------------------
create or replace function public.set_user_role(target_email text, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change account roles';
  end if;

  if new_role not in ('customer', 'staff', 'admin') then
    raise exception 'Invalid role: %', new_role;
  end if;

  update public.profiles p
  set role = new_role
  from auth.users u
  where u.id = p.id and lower(u.email) = lower(target_email);

  if not found then
    raise exception 'No account found for %', target_email;
  end if;

  -- Keep auth metadata in sync so the client session role matches the database.
  update auth.users u
  set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  where lower(u.email) = lower(target_email);
end $$;

revoke all on function public.set_user_role(text, text) from public, anon;
grant execute on function public.set_user_role(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. REPAIR promote_to_admin()
--    The original helper only wrote profiles.role and never touched
--    auth.users.raw_user_meta_data, so an admin promoted with it had no
--    metadata role. Keep the metadata cache in sync from now on.
-- ---------------------------------------------------------------------------
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set role = 'admin'
  from auth.users u
  where u.id = p.id and lower(u.email) = lower(target_email);

  if not found then
    raise exception 'No account found for %', target_email;
  end if;

  update auth.users u
  set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                          || jsonb_build_object('role', 'admin')
  where lower(u.email) = lower(target_email);
end $$;

-- Backfill the metadata role for every existing account so no one is locked
-- out of the dashboard by a stale cache.
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                        || jsonb_build_object('role', p.role)
from public.profiles p
where p.id = u.id
  and (u.raw_user_meta_data ->> 'role') is distinct from p.role;
