-- ############################################################################
--  K A A L   V A S T R   —   POST-INSTALL VERIFICATION  (read-only)
--  Paste into the Supabase SQL editor AFTER running CLEAN_SCHEMA.sql.
--  Safe to run repeatedly. Every status must read 'ok'.
-- ############################################################################

-- 1 ── Tables -----------------------------------------------------------------
select '1. table: ' || t as check,
       case when exists (select 1 from pg_tables
                          where schemaname = 'public' and tablename = t)
            then 'ok' else 'MISSING' end as status
from unnest(array['profiles','products','orders','order_status_history','business_settings']) as t

union all
-- 2 ── Columns the app depends on --------------------------------------------
select '2. column: ' || c,
       case when exists (select 1 from information_schema.columns
                          where table_schema = 'public'
                            and table_name = c_table
                            and column_name = c)
            then 'ok' else 'MISSING' end
from (values
  ('profiles',         'email'),
  ('profiles',         'role'),
  ('profiles',         'is_active'),
  ('products',         'variant_stock'),
  ('products',         'sizes'),
  ('products',         'colors'),
  ('orders',           'status'),
  ('orders',           'items'),
  ('orders',           'status_updated_by'),
  ('business_settings','whatsapp_number')
) as x(c_table, c)

union all
-- 3 ── business_settings.id must be TEXT 'biz-001' ----------------------------
--      A uuid id here is the single most common cause of a broken settings save.
select '3. business_settings.id is text',
       case when (select data_type from information_schema.columns
                   where table_schema = 'public'
                     and table_name  = 'business_settings'
                     and column_name = 'id') = 'text'
            then 'ok' else 'WRONG TYPE - drop and re-run CLEAN_SCHEMA.sql' end

union all
-- 4 ── Functions ---------------------------------------------------------------
select '4. function: ' || f,
       case when exists (select 1 from pg_proc p
                          join pg_namespace n on n.oid = p.pronamespace
                          where n.nspname = 'public' and p.proname = f)
            then 'ok' else 'MISSING' end
from unnest(array[
  'set_updated_at',
  'handle_new_user',
  'is_admin',
  'is_staff_or_admin',
  'is_staff_only',
  'products_variant_stock_is_valid',
  'products_sync_total_stock',
  'orders_block_admin_status_change',
  'log_order_status_change',
  'promote_to_admin',
  'set_user_role',
  'set_user_active'
]) as f

union all
-- 5 ── Triggers ----------------------------------------------------------------
select '5. trigger: ' || tg,
       case when exists (
         select 1 from pg_trigger t
         join pg_class c     on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = tg_table
           and t.tgname  = tg
           and not t.tgisinternal)
         then 'ok' else 'MISSING' end
from (values
  ('trg_profiles_updated_at',             'profiles'),
  ('on_auth_user_created',                'profiles'),
  ('trg_products_updated_at',             'products'),
  ('trg_products_variant_stock_valid',    'products'),
  ('trg_products_sync_total_stock',       'products'),
  ('trg_orders_updated_at',               'orders'),
  ('trg_orders_staff_only_status',        'orders'),
  ('trg_orders_log_status',               'orders'),
  ('trg_business_settings_updated_at',    'business_settings')
) as x(tg, tg_table)

union all
-- 6 ── RLS enabled on every protected table -----------------------------------
select '6. rls on: ' || c.relname,
       case when c.relrowsecurity then 'ok' else 'DISABLED' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles','products','orders','order_status_history','business_settings')
  and c.relkind = 'r'

union all
-- 7 ── Dispatch status must be staff-only, enforced by BOTH layers ------------
select '7. orders: update(status) only, staff-gated',
       case when has_column_privilege('authenticated','public.orders','status','UPDATE')
             and not has_column_privilege('authenticated','public.orders','total_amount','UPDATE')
             and not has_column_privilege('authenticated','public.orders','items','UPDATE')
            then 'ok' else 'WRONG - re-run CLEAN_SCHEMA.sql' end

union all
-- 8 ── Audit trail must not be client-writable --------------------------------
select '8. order_status_history: no client insert',
       case when has_table_privilege('authenticated','public.order_status_history','INSERT')
            then 'WRONG - client can forge audit rows'
            else 'ok' end

union all
-- 9 ── No table may be writable by the anonymous role -------------------------
select '9. anon cannot write: ' || t,
       case when has_table_privilege('anon', 'public.' || t, 'INSERT')
             or has_table_privilege('anon', 'public.' || t, 'UPDATE')
             or has_table_privilege('anon', 'public.' || t, 'DELETE')
            then 'WRONG' else 'ok' end
from unnest(array['profiles','products','order_status_history','business_settings']) as t

union all
-- 10 ── Variant stock must agree with the flat stock total --------------------
select '10. variant_stock totals match stock',
       case when count(*) = 0 then 'ok'
            else count(*)::text || ' product(s) out of sync - re-run CLEAN_SCHEMA.sql' end
from public.products
where variant_stock is not null
  and variant_stock <> '{}'::jsonb
  and stock <> (
        select coalesce(sum(value::text::numeric), 0)::integer
        from jsonb_each_text(variant_stock)
      )

union all
-- 11 ── Seed data present ------------------------------------------------------
select '11. products seeded: ' || count(*)::text,
       case when count(*) >= 6 then 'ok' else 'MISSING' end
from public.products

union all
-- 12 ── Every profile must have an email --------------------------------------
select '12. profiles missing email: ' || count(*)::text,
       case when count(*) = 0 then 'ok' else 'BACKFILL REQUIRED' end
from public.profiles
where email is null or email = ''

union all
-- 13 ── Account / role report --------------------------------------------------
--       Confirm at least one admin exists, otherwise nobody can reach /admin.
select '13. accounts: ' || count(*)::text || ' total',
       case
         when count(*) filter (where role = 'admin') = 0
           then 'NO ADMIN - run: select public.promote_to_admin(''your@email.com'');'
         else 'ok (' || count(*) filter (where role = 'admin') || ' admin, '
              || count(*) filter (where role = 'staff') || ' staff, '
              || count(*) filter (where role = 'customer') || ' customer)'
       end
from public.profiles;

-- 14 ── Full account listing ---------------------------------------------------
select '14. directory' as check,
       p.email || '  ->  ' || p.role || case when p.is_active then '' else '  (disabled)' end as status
from public.profiles p
order by
  case p.role when 'admin' then 1 when 'staff' then 2 else 3 end,
  p.created_at;
