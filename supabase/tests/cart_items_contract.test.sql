-- Run with `supabase test db` against a local/non-production database after migrations.
begin;
select plan(27);

select has_table('public', 'cart_items', 'shared cart table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.cart_items'::regclass),
  'row level security is enabled'
);
select ok((select count(*) = 3 from pg_policies where schemaname = 'public' and tablename = 'cart_items'), 'only owner select, insert, and update policies exist');
select ok(not has_table_privilege('anon', 'public.cart_items', 'select'), 'anon cannot read cart rows');
select ok(not has_table_privilege('anon', 'public.cart_items', 'insert'), 'anon cannot insert cart rows');
select ok(has_table_privilege('authenticated', 'public.cart_items', 'select'), 'authenticated can read through RLS');
select ok(has_column_privilege('authenticated', 'public.cart_items', 'quantity', 'update'), 'authenticated can update quantity through RLS');
select ok(not has_table_privilege('authenticated', 'public.cart_items', 'delete'), 'authenticated cannot issue DELETE (removals use owner-authorized soft delete)');
select ok(has_column_privilege('authenticated', 'public.cart_items', 'deleted_at', 'update'), 'authenticated can update the soft-delete marker through RLS');
select has_column('public', 'cart_items', 'deleted_at', 'soft-delete marker exists');
select ok(not has_column_privilege('authenticated', 'public.cart_items', 'updated_at', 'update'), 'clients cannot write server timestamps');
select ok(not has_function_privilege('anon', 'public.merge_guest_cart(uuid,jsonb)', 'execute'), 'anon cannot run guest-cart merge');
select ok(has_function_privilege('authenticated', 'public.merge_guest_cart(uuid,jsonb)', 'execute'), 'authenticated can run guest-cart merge');
select ok(
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cart_items'),
  'cart table is in the Realtime publication'
);

-- Use transaction-local fixtures, then impersonate authenticated JWT subjects.
insert into auth.users(id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'cart-a@example.invalid'),
  ('00000000-0000-4000-8000-0000000000b2', 'cart-b@example.invalid');
insert into public.products(slug, name, price, is_active)
values ('cart-contract-test', 'Cart contract test', 1, true);
insert into public.cart_items(user_id, product_id, quantity)
select '00000000-0000-4000-8000-0000000000a1', id, 1 from public.products where slug='cart-contract-test';
insert into public.cart_items(user_id, product_id, quantity)
select '00000000-0000-4000-8000-0000000000b2', id, 1 from public.products where slug='cart-contract-test';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
select is((select count(*)::int from public.cart_items), 1, 'user A sees only their own cart row');
with changed as (update public.cart_items set quantity = 2 where user_id = '00000000-0000-4000-8000-0000000000b2' returning 1) select is((select count(*)::int from changed), 0, 'user A cannot modify user B cart');
select throws_ok($$insert into public.cart_items(user_id,product_id,quantity) select '00000000-0000-4000-8000-0000000000b2',id,1 from public.products where slug='cart-contract-test'$$, '42501', null, 'user A cannot insert a row for user B');
select throws_ok($$insert into public.cart_items(user_id,product_id,quantity) select '00000000-0000-4000-8000-0000000000a1',id,0 from public.products where slug='cart-contract-test'$$, '23514', null, 'quantity zero is rejected');
select throws_ok($$insert into public.cart_items(user_id,product_id,quantity) select '00000000-0000-4000-8000-0000000000a1',id,100 from public.products where slug='cart-contract-test'$$, '23514', null, 'quantity above 99 is rejected');
select is(public.merge_guest_cart('00000000-0000-4000-8000-0000000000c3', (select jsonb_build_array(jsonb_build_object('product_id',id,'quantity',3)) from public.products where slug='cart-contract-test')), true, 'first guest-cart merge applies');
select is(public.merge_guest_cart('00000000-0000-4000-8000-0000000000c3', (select jsonb_build_array(jsonb_build_object('product_id',id,'quantity',3)) from public.products where slug='cart-contract-test')), false, 'retry of same merge is idempotent');
select is((select quantity from public.cart_items ci join public.products p on p.id=ci.product_id where ci.user_id='00000000-0000-4000-8000-0000000000a1' and p.slug='cart-contract-test'), 4, 'idempotent merge adds quantity once');
select throws_ok($$select public.merge_guest_cart('00000000-0000-4000-8000-0000000000c4', '[{"product_id":999999999999,"quantity":1}]'::jsonb)$$, 'P0001', null, 'missing product id is rejected by merge');
select throws_ok($$select public.merge_guest_cart('00000000-0000-4000-8000-0000000000c5', '[{"product_id":1,"quantity":100}]'::jsonb)$$, 'P0001', null, 'invalid merge quantity is rejected');
update public.cart_items set deleted_at=now() where user_id='00000000-0000-4000-8000-0000000000a1';
select is((select count(*)::int from public.cart_items where deleted_at is null), 0, 'soft-deleted rows disappear from active cart reads');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', true);
select is((select count(*)::int from public.cart_items), 1, 'user B sees only their own row despite A removal');
with changed as (update public.cart_items set quantity = 2 where user_id = '00000000-0000-4000-8000-0000000000a1' returning 1) select is((select count(*)::int from changed), 0, 'user B cannot modify user A cart');
reset role;

select * from finish();
rollback;
