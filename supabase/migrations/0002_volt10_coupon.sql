-- Keep the coupon used by checkout in sync for databases that already applied
-- 0001 before the current VOLT10 definition was present.
insert into public.coupons(code,percent_off,min_subtotal,active) values
  ('VOLT10',10,0,true)
on conflict (code) do update set
  percent_off=excluded.percent_off,
  min_subtotal=excluded.min_subtotal,
  active=excluded.active;
