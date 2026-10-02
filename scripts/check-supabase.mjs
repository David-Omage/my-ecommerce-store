#!/usr/bin/env node
// scripts/check-supabase.mjs
// NON-DESTRUCTIVE connectivity test. Confirms the app can reach your Supabase
// project's REST API with the publishable key, that the expected tables exist
// and that RLS lets the browser read them. It only issues SELECT requests.
//
//   node scripts/check-supabase.mjs
import { loadEnv, supabaseConfig, looksPrivileged } from "./load-env.mjs";

const get = loadEnv();
const { url, key } = supabaseConfig(get);

if (!url || !key){
  console.log("Supabase is NOT configured yet - nothing to test.\n");
  console.log("  1. Copy .env.example to .env");
  console.log("  2. Fill SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY");
  console.log("  3. Run: node scripts/build-env.mjs   (then serve the site)");
  console.log("  4. Re-run: node scripts/check-supabase.mjs");
  process.exit(2);
}
if (looksPrivileged(key)){
  console.log("The configured key looks like a service_role / secret key. Use the publishable key only.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
let failures = 0;

async function probe(label, path, note){
  try{
    const res = await fetch(`${url}/rest/v1/${path}`, { headers });
    const body = await res.text();
    let detail = "";
    if (res.status === 200){
      let rows = null;
      try{ const j = JSON.parse(body); if (Array.isArray(j)) rows = j.length; }catch{}
      detail = rows != null ? `OK - ${rows} row(s) returned` : "OK";
    } else if (res.status === 401 || res.status === 403){
      detail = "key rejected, or RLS blocks the anon role (check the publishable key + policies)";
    } else if (res.status === 404){
      const msg = body.replace(/\s+/g, " ").slice(0, 170);
      detail = `not found - ${msg || "table/function missing (run supabase/migrations/0001_init.sql)"}`;
    } else {
      detail = body.slice(0, 180);
    }
    const ok = res.status === 200;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}: HTTP ${res.status} - ${detail}${note ? "  " + note : ""}`);
    return ok;
  } catch (e){
    failures++;
    console.log(`FAIL  ${label}: request failed - ${e.message}`);
    console.log("      (wrong SUPABASE_URL, project paused, or no network/CORS)");
    return false;
  }
}

console.log(`[check] project: ${url}\n`);
await probe("products (catalog read)", "products?select=id,name&limit=3");
await probe("categories (join target)", "categories?select=id,slug&limit=1");
await probe("brands (join target)", "brands?select=id,name&limit=1");
// Checkout displays this fixed promotion, and create_order validates the same
// row server-side. Verify its value rather than only checking table presence.
try{
  const res = await fetch(`${url}/rest/v1/coupons?select=code,percent_off,min_subtotal,active&code=eq.VOLT10`, { headers });
  const rows = res.ok ? await res.json() : [];
  const coupon = Array.isArray(rows) ? rows.find(x => x.code === "VOLT10") : null;
  const ok = res.status === 200 && coupon?.active === true && Number(coupon.percent_off) === 10 && Number(coupon.min_subtotal) === 0;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  VOLT10 coupon: ${ok ? "active, 10%, no minimum" : `expected active 10% with no minimum (HTTP ${res.status})`}`);
} catch(e){
  failures++;
  console.log(`FAIL  VOLT10 coupon: request failed - ${e.message}`);
}
await probe("orders (owner-only read)", "orders?select=id&limit=1", "- anon returns 200 with 0 rows; that is expected");

// create_order RPC existence. Probed with an EMPTY cart on purpose: the function
// raises "empty cart" before touching any table, so this writes nothing.
try{
  const res = await fetch(`${url}/rest/v1/rpc/create_order`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ payload: { items: [] } })
  });
  const body = (await res.text()).replace(/\s+/g, " ").slice(0, 150);
  if (res.status === 404){
    failures++;
    console.log(`FAIL  create_order RPC: not exposed - ${body}`);
  } else if (res.status === 401 || res.status === 403){
    failures++;
    console.log(`FAIL  create_order RPC: not permitted for anon (HTTP ${res.status}) - check GRANT EXECUTE in 0001_init.sql`);
  } else {
    console.log(`PASS  create_order RPC: present (HTTP ${res.status} on the empty-cart probe; 0 rows written). ${body}`);
  }
} catch(e){
  failures++;
  console.log(`FAIL  create_order RPC: request failed - ${e.message}`);
}

console.log("");
console.log(failures === 0
  ? "RESULT: PASS - the app can communicate with Supabase and the expected schema is reachable."
  : `RESULT: ${failures} check(s) failed - see the guidance above.`);
process.exit(failures === 0 ? 0 : 1);
