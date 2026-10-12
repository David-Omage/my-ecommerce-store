// Static guardrails for the shared-cart migration and both client integrations.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const mobile = resolve(root, "..", "voltedge-mobile");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const check = (condition, label) => {
  if (!condition) throw new Error(`FAIL ${label}`);
  console.log(`PASS ${label}`);
};

const migration = read("supabase/migrations/0004_shared_cart.sql");
const webSync = read("js/cart-sync.js");
const store = read("js/store.js");
const account = read("js/account.js");
const cart = read("js/cart.js");
const html = read("index.html");
const checkout = read("supabase/migrations/0003_checkout_consistency.sql");
const mobileHook = readFileSync(resolve(mobile, "src/useCartSync.ts"), "utf8");
const mobileApp = readFileSync(resolve(mobile, "App.tsx"), "utf8");

check(/primary key\s*\(user_id, product_id\)/i.test(migration), "cart rows are unique per user and product");
check(/quantity\s+integer not null check \(quantity between 1 and 99\)/i.test(migration) && /deleted_at timestamptz/i.test(migration), "database validates quantities and stores soft removals");
check(/alter table public\.cart_items enable row level security/i.test(migration), "cart table enables RLS");
check((migration.match(/\(select auth\.uid\(\)\) = user_id/g) || []).length >= 3, "cart read/write policies scope rows to auth.uid()");
check(/revoke all on table public\.cart_items from public, anon, authenticated/i.test(migration) && /grant select on table public\.cart_items to authenticated/i.test(migration) && /grant insert \(user_id, product_id, quantity, deleted_at\)/i.test(migration) && /grant update \(user_id, product_id, quantity, deleted_at\)/i.test(migration) && !/grant\s+delete\b/i.test(migration), "cart grants exclude public/anonymous access and hard-delete privilege");
check(/to_regclass\('public\.cart_items'\)[\s\S]*already exists[\s\S]*create table public\.cart_items/i.test(migration) && !/create table if not exists public\.cart_items/i.test(migration), "migration fails closed on pre-existing cart objects");
check(/create function public\.merge_guest_cart[\s\S]*security definer[\s\S]*set search_path = ''/i.test(migration) && /cart_merge_receipts[\s\S]*on conflict do nothing/i.test(migration), "guest merge is authenticated and idempotent");
check(/pg_publication_tables[\s\S]*tablename = 'cart_items'[\s\S]*alter publication supabase_realtime add table public\.cart_items/i.test(migration), "Realtime publication addition is guarded");
check(/rpc\("merge_guest_cart"/.test(webSync) && /navigator\.locks/.test(webSync), "website retries guest merges with a persisted cross-tab lock");
check(/window\.CartSync\?\.localChanged\(/.test(store) && /postgres_changes/.test(webSync) && /event:"INSERT"/.test(webSync) && /event:"UPDATE"/.test(webSync) && !/event:"\*"/.test(webSync) && /deleted_at/.test(webSync), "website uses INSERT/UPDATE Realtime and soft-removal");
check(/ve_cart_pending_writes/.test(webSync) && /overlayWrites/.test(webSync) && /acknowledge/.test(webSync), "website retains unsaved per-product edits through refresh and retry");
check(/CartSync\?\.setUser\(authUser\.id/.test(account) && /CartSync\?\.setUser\(null\)/.test(account), "website activates and clears cart scope with auth state");
check(/cart-sync\.js/.test(html) && /cartSyncRetry/.test(cart), "website loads sync code and exposes retry state");
check(/rpc\('merge_guest_cart'/.test(mobileHook) && /postgres_changes/.test(mobileHook) && /event: 'INSERT'/.test(mobileHook) && /event: 'UPDATE'/.test(mobileHook) && !/event: '\*'/.test(mobileHook) && /deleted_at/.test(mobileHook), "mobile uses INSERT/UPDATE Realtime and soft-removal");
check(/ve_cart_pending_writes/.test(mobileHook) && /overlayWrites/.test(mobileHook) && /acknowledgeWrites/.test(mobileHook), "mobile retains unsaved per-product edits through refresh and retry");
check(/LOCAL Supabase/.test(readFileSync(resolve(mobile, "scripts/test-cart-realtime.mjs"), "utf8")) && /eventsB\.length/.test(readFileSync(resolve(mobile, "scripts/test-cart-realtime.mjs"), "utf8")), "local Realtime isolation integration test is available");
check(/simulated offline write/.test(read("scripts/test-cart-sync.mjs")) && /Realtime addition/.test(read("scripts/test-cart-sync.mjs")) && /soft removal/.test(read("scripts/test-cart-sync.mjs")), "website write-failure and Realtime behavior tests are available");
check(/p\.price \* \(it->>'qty'\)::int/.test(checkout) && /create_order/.test(checkout), "checkout continues to calculate totals from database prices");
check(!/service_role|sb_secret_|MAILGUN_API_KEY/i.test(mobileApp + mobileHook), "mobile cart code contains no privileged or Mailgun credential references");

console.log("Static checks do not prove runtime RLS or Realtime authorization; run pgTAP and the local two-user Realtime test against an isolated local Supabase project.");
