-- Update checkout server rules for standard shipping and reject invalid coupons.
-- Apply after 0001_init.sql and 0002_volt10_coupon.sql.
create or replace function public.create_order(payload jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c_rate   constant numeric := 1400;   -- mirrors js/config.js RATE
  c_disc   constant numeric := 0.9;    -- mirrors js/config.js DISCOUNT
  c_free_ship constant numeric := 124740; -- mirrors js/config.js FREE_SHIP
  c_standard_ship constant numeric := 4410; -- mirrors js/config.js STANDARD_SHIP
  v_items  jsonb := coalesce(payload->'items','[]'::jsonb);
  v_coupon text  := nullif(upper(trim(coalesce(payload->>'coupon',''))),'');
  v_pct    int   := 0;
  v_usd    numeric(12,2);
  v_sub    numeric(12,2);
  v_disc   numeric(12,2) := 0;
  v_ship   numeric(12,2);
  v_total  numeric(12,2);
  v_no     text;
  v_id     uuid;
  v_lines  jsonb := '[]'::jsonb;
  rec      record;
begin
  if jsonb_array_length(v_items) = 0 then raise exception 'create_order: empty cart'; end if;

  -- subtotal straight from the catalog (never trust client-sent prices)
  select coalesce(sum(p.price * (it->>'qty')::int),0) into v_usd
    from jsonb_array_elements(v_items) it
    join public.products p on p.id = (it->>'id')::bigint;
  if v_usd <= 0 then raise exception 'create_order: no valid items'; end if;
  v_sub := round(v_usd * c_rate * c_disc, 2);

  -- coupon
  if v_coupon is not null then
    select percent_off into v_pct from public.coupons
     where code = v_coupon and active
       and (expires_at is null or expires_at > now())
       and v_sub >= min_subtotal;
    if not found then raise exception 'create_order: invalid coupon'; end if;
  end if;
  if coalesce(v_pct,0) > 0 then v_disc := round(v_sub * v_pct / 100.0, 2); end if;

  -- Standard shipping follows the cart threshold; premium options use fixed rates.
  if coalesce(payload->>'shipOpt','0') = '4410' then
    v_ship := 4410;
  elsif coalesce(payload->>'shipOpt','0') = '10080' then
    v_ship := 10080;
  elsif coalesce(payload->>'shipOpt','0') = '0' then
    v_ship := case when v_sub >= c_free_ship then 0 else c_standard_ship end;
  else
    raise exception 'create_order: invalid shipping option';
  end if;
  v_total := v_sub - v_disc + v_ship;

  loop
    v_no := 'VE-' || lpad((floor(random()*1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.orders where order_no = v_no);
  end loop;

  insert into public.orders(order_no,user_id,email,contact_name,phone,address,city,state,
                            note,ship_opt,ship_label,eta,pay_method,coupon,
                            subtotal,discount,shipping,total)
  values (v_no, auth.uid(), payload->>'email', payload->>'name', payload->>'phone',
          payload->>'address', payload->>'city', payload->>'state', payload->>'note',
          payload->>'shipOpt', payload->>'shipLabel', payload->>'eta', payload->>'pay',
          v_coupon, v_sub, v_disc, v_ship, v_total)
  returning id into v_id;

  for rec in
    select p.id, p.name, p.price, p.image_url, (it->>'qty')::int as qty
      from jsonb_array_elements(v_items) it
      join public.products p on p.id = (it->>'id')::bigint
  loop
    insert into public.order_items(order_id,product_id,name,unit_price,qty,line_total)
    values (v_id, rec.id, rec.name, rec.price, rec.qty, rec.price*rec.qty);
    v_lines := v_lines || jsonb_build_object('id',rec.id,'n',rec.name,'img',rec.image_url,'p',rec.price,'qty',rec.qty);
  end loop;

  return json_build_object(
    'id', v_no, 'date', now(), 'status','Processing', 'items', v_lines,
    'sub', v_sub, 'disc', v_disc, 'ship', v_ship, 'total', v_total,
    'name', payload->>'name', 'email', payload->>'email', 'phone', payload->>'phone',
    'address', payload->>'address', 'city', payload->>'city', 'state', payload->>'state',
    'note', payload->>'note', 'shipOpt', payload->>'shipOpt', 'shipLabel', payload->>'shipLabel',
    'eta', payload->>'eta', 'pay', payload->>'pay', 'payMock', true, 'coupon', v_coupon
  );
end $$;
