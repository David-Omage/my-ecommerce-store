-- Shared, authenticated VoltEdge carts plus an idempotent guest-cart merge.
-- Apply after 0003_checkout_consistency.sql; this does not alter checkout.

-- Fail closed on partial/manual installs. CREATE TABLE IF NOT EXISTS does not
-- reconcile an incompatible object, so this migration requires a clean target.
do $$ begin
  if to_regclass('public.cart_items') is not null then
    raise exception 'public.cart_items already exists; inspect/reconcile it manually before applying migration 0004';
  end if;
  if to_regnamespace('voltedge_private') is not null then
    raise exception 'schema voltedge_private already exists; inspect/reconcile it manually before applying migration 0004';
  end if;
  if to_regprocedure('public.merge_guest_cart(uuid,jsonb)') is not null then
    raise exception 'public.merge_guest_cart(uuid,jsonb) already exists; inspect/reconcile it manually before applying migration 0004';
  end if;
  if to_regclass('public.products') is null or to_regprocedure('public.set_updated_at()') is null then
    raise exception 'migration 0001 prerequisites are missing (products or set_updated_at)';
  end if;
  if not exists (select 1 from pg_attribute where attrelid = 'public.products'::regclass and attname = 'id' and atttypid = 'bigint'::regtype and not attisdropped)
     or not exists (select 1 from pg_attribute where attrelid = 'public.products'::regclass and attname = 'is_active' and atttypid = 'boolean'::regtype and not attisdropped) then
    raise exception 'public.products does not have the expected bigint id and boolean is_active columns';
  end if;
end $$;

create table public.cart_items (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity   integer not null check (quantity between 1 and 99),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index cart_items_product_idx on public.cart_items(product_id);

create trigger trg_cart_items_updated before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;
revoke all on table public.cart_items from public, anon, authenticated;
grant select on table public.cart_items to authenticated;
grant insert (user_id, product_id, quantity, deleted_at) on public.cart_items to authenticated;
grant update (user_id, product_id, quantity, deleted_at) on public.cart_items to authenticated;

create policy own_cart_items_select on public.cart_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy own_cart_items_insert on public.cart_items for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );

create policy own_cart_items_update on public.cart_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (deleted_at is not null or exists (select 1 from public.products p where p.id = product_id and p.is_active))
  );

-- A receipt makes retrying an interrupted sign-in merge exactly-once per user.
-- This schema is intentionally not exposed through the Supabase Data API.
create schema voltedge_private;
revoke all on schema voltedge_private from public, anon, authenticated;
create table voltedge_private.cart_merge_receipts (
  user_id    uuid not null references auth.users(id) on delete cascade,
  merge_id   uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, merge_id)
);
alter table voltedge_private.cart_merge_receipts enable row level security;
revoke all on table voltedge_private.cart_merge_receipts from public, anon, authenticated;

create function public.merge_guest_cart(p_merge_id uuid, p_items jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_product_id bigint;
  v_quantity integer;
  v_inserted integer;
begin
  if v_user is null then raise exception 'merge_guest_cart: authentication required'; end if;
  if p_merge_id is null then raise exception 'merge_guest_cart: merge id required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then
    raise exception 'merge_guest_cart: items must be an array of at most 200 lines';
  end if;
  if exists (
    select 1 from (
      select value->>'product_id' as product_id
      from jsonb_array_elements(p_items)
    ) lines group by product_id having count(*) > 1
  ) then raise exception 'merge_guest_cart: duplicate product ids'; end if;

  insert into voltedge_private.cart_merge_receipts(user_id, merge_id)
  values (v_user, p_merge_id) on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return false; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item->>'product_id','') !~ '^[1-9][0-9]*$'
       or coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]?$' then
      raise exception 'merge_guest_cart: invalid product id or quantity';
    end if;
    v_product_id := (v_item->>'product_id')::bigint;
    v_quantity := (v_item->>'quantity')::integer;
    if not exists (select 1 from public.products p where p.id = v_product_id and p.is_active) then
      raise exception 'merge_guest_cart: product is missing or inactive';
    end if;
    insert into public.cart_items(user_id, product_id, quantity)
    values (v_user, v_product_id, v_quantity)
    on conflict (user_id, product_id) do update
      set quantity = (case when public.cart_items.deleted_at is null then public.cart_items.quantity else 0 end) + excluded.quantity,
          deleted_at = null,
          updated_at = now();
  end loop;
  return true;
end;
$$;

revoke all on function public.merge_guest_cart(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.merge_guest_cart(uuid, jsonb) to authenticated;

-- Idempotently add only this table to Realtime; leave other publication members alone.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cart_items'
  ) then
    execute 'alter publication supabase_realtime add table public.cart_items';
  end if;
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime' and pubinsert and pubupdate) then
    raise exception 'supabase_realtime must publish INSERT and UPDATE; configure it before applying migration 0004';
  end if;
end $$;
