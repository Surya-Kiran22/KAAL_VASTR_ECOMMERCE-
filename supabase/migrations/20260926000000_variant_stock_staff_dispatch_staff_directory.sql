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
