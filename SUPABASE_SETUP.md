# 🔌 Connecting VoltEdge to your Supabase project

This app is **already wired** for Supabase. The front end ships with:

- `js/supabase.js` — creates the client (`window.SB`) only when `USE_SUPABASE` is on.
- `js/api.js` — every catalog/order call goes to Supabase when live, and **silently falls back to MOCK** on any error.
- `js/config.js` — reads `window.__ENV__` (URL + publishable key) and exposes the usual `window.APP_CONFIG`.
- `scripts/build-env.mjs` — turns your `.env` into `js/env.js` (`window.__ENV__`); keys are never committed.
- `scripts/check-supabase.mjs` — non-destructive live connectivity test (reads only).
- `scripts/check-config.mjs` — offline self-test of the env → config → client wiring.
- `supabase/migrations/0001_init.sql` — schema + RLS + the `create_order` RPC.
- `supabase/seed.sql` — the 24-product demo catalog, generated from `js/data.js`.

So you do **not** need to change any component code. You only need to (A) put your
project URL + publishable key in `.env`, and (B) create the database objects.

> Values are supplied as **environment variables**: copy `.env.example` → `.env`, fill it
> in, then run `node scripts/build-env.mjs`. `.env` and the generated `js/env.js` are both
> git-ignored, so nothing sensitive is ever committed. Total time: ~5 minutes.

---

## Step 0 — Prerequisites

- A Supabase account and a project (free tier is fine). If you don't have one:
  <https://supabase.com/dashboard> → **New project** → pick a name, a strong DB password,
  a nearby region → **Create**. Wait for provisioning (~2 min).
- Node.js (v18+) is used by `scripts/build-env.mjs`, the check scripts and the seed generator.
- Keep serving the site over HTTP (CORS-friendly), not `file://`:
  ```powershell
  cd c:\Users\david\Desktop\my-ecommerce-store
  python -m http.server 8000
  ```

---

## Step 1 — Grab your Project URL + publishable key

In the Supabase dashboard: **Project Settings → API Keys** (or the "Connect" button).

Copy these two values:

| Value | Looks like | Env var |
|---|---|---|
| **Project URL** | `https://abcdefghijkl.supabase.co` | `SUPABASE_URL` |
| **Publishable key** (or legacy anon key) | `sb_publishable_...` / `eyJhbGciOi...` | `SUPABASE_PUBLISHABLE_KEY` |

> ⚠️ Only ever use the **publishable / anon public** key in a browser app. A
> **`service_role`** (or `sb_secret_...`) key bypasses RLS and must **never** be shipped
> to the front end — `scripts/build-env.mjs` refuses to build if it sees one.

---

## Step 2 — Create the schema (the tables + RLS + RPC)

Pick **one** of the two options.

### Option A — SQL Editor (fastest, no CLI)

1. Open **SQL Editor → New query** in the dashboard.
2. Paste the **entire** contents of `supabase/migrations/0001_init.sql`.
3. Click **Run**. You should see "Success. No rows returned".
4. Confirm 11 new tables under **Table Editor**:
   `categories, brands, products, profiles, addresses, wishlists, coupons, orders, order_items, reviews, newsletter_subscribers`.

### Option B — Supabase CLI (`db push`)

```powershell
npm i -g supabase                 # if not installed
supabase login                    # opens browser
supabase link --project-ref <your-project-ref>
supabase db push                  # applies supabase/migrations/*.sql
```

(The project ref is the `abcdefghijkl` part of your Project URL.)

---

## Step 3 — Load the demo catalog

The front end only switches to the DB when `products` returns rows; an empty table makes
`api.js` fall back to MOCK, and `create_order` would reject unknown product ids. So seed it:

1. **SQL Editor → New query** → paste all of `supabase/seed.sql` → **Run**.
2. Check **Table Editor → products**: you should have **24 rows**.

Need to regenerate the seed after editing `js/data.js`?

```powershell
node supabase/gen_seed.mjs        # rewrites supabase/seed.sql from js/data.js
```

> Prefer your own catalog? Skip this step and insert your own `categories` / `brands` /
> `products` rows instead — just keep `products.slug` values matching the category keys
> used by the storefront (`Laptops`, `Phones`, `Audio`, …).
---

## Step 4 — Configure via environment variables (the only change)

A browser can't read OS environment variables directly, so a small generator turns your
`.env` file into `js/env.js` (`window.__ENV__`), which `index.html` loads just before
`js/config.js`.

1. Create your `.env` from the template and fill in the two values from Step 1:
   ```powershell
   Copy-Item .env.example .env     # then edit .env
   ```
   ```ini
   SUPABASE_URL=https://abcdefghijkl.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   ```
2. Generate the browser config:
   ```powershell
   node scripts/build-env.mjs
   ```
   You should see `mode = LIVE (Supabase)`. It writes `js/env.js` (git-ignored).
3. **Hard-refresh the page** (Ctrl+F5).

> `js/env.js` is generated — never edit it by hand and never commit it (it's in
> `.gitignore`, together with `.env`). Re-run `build-env.mjs` whenever `.env` changes.

> Roll back instantly: set `USE_SUPABASE=false` in `.env` and re-run the generator, or
> simply blank the two values — with no credentials the app stays 100% on MOCK.

---

## Step 5 — Verify the connection

0. **Automated (reads only)** — from the project folder:
   ```powershell
   node scripts/check-config.mjs     # offline: proves env -> config -> client wiring
   node scripts/check-supabase.mjs   # live: table + RPC reachability over the REST API
   ```
   `check-supabase.mjs` prints `PASS`/`FAIL` per object and **never writes a row**.

1. **Console banner** — open DevTools → Console. On a working connection you'll see:
   ```
   [VoltEdge] Supabase client ready: https://abcdefghijkl.supabase.co
   ```
   If you instead see `Supabase not configured — running on MOCK data.`, `USE_SUPABASE`
   or one of the two keys is still empty.

2. **Live rows in the Network tab** — filter by `products`. You should see a
   `GET https://<ref>.supabase.co/rest/v1/products?...` returning `200`, and the product
   grids on the page will render from those rows.

3. **Quick console probe** (paste into the Console):
   ```js
   await SB.from('products').select('id,name').limit(3)
   ```
   A `{ data: [...3 rows], error: null }` result confirms REST + RLS are correct.

4. **Place a test order** — add an item, go through checkout, **Place order**. Then in the
   dashboard open **Table Editor → orders**: your new row should be there, with
   `order_items` linked to it. (Totals are recomputed server-side by `create_order`,
   so they won't trust whatever the page sent.)

---

## Step 6 — Configure Supabase Auth

The app uses Supabase email one-time links and Google OAuth. Sessions are restored by the
Supabase client; profiles, addresses, wishlists, and authenticated order history use the
existing tables and owner-only RLS policies.

Read-only settings check on 2026-10-02: the email provider is enabled, Google is disabled,
and no Auth Site URL is configured. The project URL and publishable key are already
configured locally; no credential values were printed.

1. In **Authentication → Providers**, leave **Email** enabled and allow email sign-ins.
2. In **Authentication → URL Configuration**, set the Site URL and add the exact app URL
   used locally (for example `http://localhost:8000/`) and the production app URL to
   *Redirect URLs*. The app returns to the current app path after authentication.
3. For Google, create a web OAuth client in Google Cloud. Add the local and production app
   origins as authorized JavaScript origins, and copy the Supabase callback URI shown in
   the Supabase Google provider settings into Google's authorized redirect URIs. Enter the
   Google client ID and client secret in the Supabase dashboard only. Do not put either
   value in `.env`, `js/env.js`, or browser code.
4. Save the Google client ID and secret in **Authentication → Providers → Google** in
   Supabase and enable the provider.
5. Apply `supabase/migrations/0002_volt10_coupon.sql` when syncing migrations or aligning an
   existing project. The currently connected project was checked and already has the
   expected active 10% row. Fresh projects get the same row in `0001_init.sql`, and
   `supabase/seed.sql` keeps it aligned when re-seeding.

The `handle_new_user` trigger in `0001_init.sql` creates a profile row when a user signs up.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Grids show demo products, console says "running on MOCK" | `.env` values are empty, `USE_SUPABASE=false`, or you didn't re-run `node scripts/build-env.mjs` after editing `.env`. |
| Console 404 on `js/env.js` | Not generated yet — run `node scripts/build-env.mjs` (the app still runs on MOCK without it). |
| `new row violates row-level security` on order | The key in `.env` isn't the **publishable/anon** key; recheck Step 1, and confirm `0001_init.sql` (RLS + grants) ran fully. |
| `getaddrinfo ENOTFOUND` / requests fail | Wrong `SUPABASE_URL` (typo) or project paused. Copy it again from **Settings → API Keys**. |
| `create_order: no valid items` | Catalog not seeded (Step 3) — cart product ids aren't in `products`. |
| CORS / request blocked | You opened the page via `file://`. Serve over HTTP (Step 0). |
| `relation "public.products" does not exist` | `0001_init.sql` wasn't run (Step 2). |
| Nothing loads after deploy | `index.html` must load, in order: `js/env.js` → `js/config.js` → the `@supabase/supabase-js` `<script>` → `js/supabase.js`. |

---

## Roll back to MOCK any time

Set `USE_SUPABASE=false` in `.env` and re-run `node scripts/build-env.mjs` (or blank the
two values). No other change is needed — `js/api.js` falls back automatically, and any
live-error path already degrades to MOCK rather than crashing.
