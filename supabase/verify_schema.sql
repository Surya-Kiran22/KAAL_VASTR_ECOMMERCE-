-- ############################################################################
-- Kaal Vastr - post-migration verification (read-only, safe to re-run)
-- Paste into the Supabase SQL editor AFTER applying the schema repair.
-- Every row should read 'ok'. Anything else tells you what is still missing.
-- ############################################################################

-- 1. Tables that must exist
select
  'table: ' || t as check,
  case when exists (select 1 from pg_tables
                   where schemaname = 'public' and tablename = t)
       then 'ok' else 'MISSING' end as status
from unnest(array['products','orders','business_settings','profiles']) as t
union all

-- 2. Columns added by the repair
select
  'column: ' || c,
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = c_table and column_name = c
  ) then 'ok' else 'MISSING' end
from (values
  ('products', 'variant_stock'),
  ('profiles', 'email')
) as x(c_table, c)
union all

-- 3. Functions that must exist
select
  'function: ' || f,
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = f
  ) then 'ok' else 'MISSING' end
from unnest(array[
  'is_admin',
  'is_staff_or_admin',
  'is_staff_only',
  'promote_to_admin',
  'set_user_role',
  'handle_new_user',
  'products_variant_stock_is_valid',
  'products_sync_total_stock',
  'orders_block_admin_status_change'
]) as f
union all

-- 4. Triggers that must exist
select
  'trigger: ' || tg,
  case when exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = tg_table
      and t.tgname = tg
      and not t.tgisinternal
  ) then 'ok' else 'MISSING' end
from (values
  ('trg_products_variant_stock_valid', 'products'),
  ('trg_products_sync_total_stock',    'products'),
  ('trg_orders_staff_only_status',     'orders'),
  ('trg_profiles_email_lookup',        'profiles')
) as x(tg, tg_table)
union all

-- 5. Orders UPDATE must be staff-only: only the status column is granted
select
  'grant: update(status) on orders',
  case when has_column_privilege('authenticated', 'public.orders', 'status', 'UPDATE')
        and not has_column_privilege('authenticated', 'public.orders', 'total_amount', 'UPDATE')
       then 'ok' else 'WRONG - rerun section 2' end
union all

-- 6. RLS must be on everywhere it matters
select
  'rls: ' || relname,
  case when relrowsecurity then 'ok' else 'DISABLED' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('products','orders','business_settings','profiles')
  and c.relkind = 'r'
union all

-- 7. No profile row should be missing an email
select
  'profiles: rows missing email',
  case when count(*) = 0 then 'ok' else count(*)::text || ' row(s) need backfill' end
from public.profiles
where email is null
union all

-- 8. Report every account and its role so you can confirm promotions
select
  'account' as check,
  p.email || '  ->  ' || p.role as status
from public.profiles p
order by p.role, p.email;
