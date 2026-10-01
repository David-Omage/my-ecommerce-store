# ⚡ VoltEdge — Modern Electronics Store

> Polished responsive storefront for premium electronics.
> **Status:** v1.3 — Supabase connected via env vars (`.env` → `js/env.js`). Project reachable; schema still to be applied before live data flows — see **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**.
> **Preview:** `http://localhost:8000/` via `python -m http.server 8000`

## Contents
1. What this is 2. Quick start 3. File map 4. Changelog
5. Design system 6. Currency 7. Components 8. Responsive
9. Conventions 10. Next steps 11. Log

## 1. What this is
Homepage only: announce + header + hero + perks + categories + flash deals + product grids + promos + brands + reviews + newsletter + footer + mobile nav + cart drawer visual. Vanilla HTML/CSS/JS, no build, no npm.

## 2. Quick start
```powershell
cd c:\Users\david\Desktop\my-ecommerce-store
python -m http.server 8000
# open http://localhost:8000/
```
Keep alive: `Start-Process python -ArgumentList '-m','http.server','8000'`. Stop: `taskkill /F /IM python.exe`. Test mobile: F12 -> device toolbar.

## 3. File map
```
index.html   # structure, sections in order below
styles.css   # tokens, components, responsive
js/          # app modules (load order: config, supabase, data, api, store, ui, shop, cart, account, checkout, router, app)
  config.js  # reads window.__ENV__ -> RATE/DISCOUNT/PER/FREE_SHIP + SUPABASE_URL/ANON_KEY/USE_SUPABASE
  supabase.js# creates window.SB only when USE_SUPABASE=true (else silent MOCK)
  data.js    # MOCK_PRODUCTS (24) + MOCK_MORE + CATS (11)
  api.js     # Api.products/product/createOrder/orders - MOCK or Supabase
  store.js   # cart/wishlist/user state (ve_cart/ve_wish/ve_user)
  ui.js      # card(), moneyUSD(), fmtN(), badges()
  shop.js cart.js account.js checkout.js router.js app.js  # features + boot
env.js     # GENERATED from .env by scripts/build-env.mjs (git-ignored) -> window.__ENV__
scripts/     # build-env.mjs (.env -> js/env.js), check-supabase.mjs, check-config.mjs, load-env.mjs
.env.example # template for SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (copy to .env; .env is git-ignored)
supabase/migrations/0001_init.sql # schema + RLS + create_order RPC (paste into SQL editor)
supabase/seed.sql        # 24-product catalog seed (generated) - run AFTER the migration
supabase/gen_seed.mjs    # node script: rebuilds seed.sql from js/data.js
SUPABASE_SETUP.md        # step-by-step guide: connect this app to your Supabase project
app.js       # legacy root file - DEAD (not loaded by index.html); kept for history
design-system.md # cheat-sheet (README is canonical)
README.md    # this file - update every task
.gitignore   # OS/editor + .env + js/env.js + supabase temp
```
Order: announce -> header (.header-inner + .category-row) -> hero (.hero-grid + .perks) -> #categories (.cat-grid) -> #deals (.deals + #dealRow) -> #products (.filter-row + #gridProducts) -> promo-grid -> #brands -> .rev-grid -> #support .news -> footer -> mobile-nav + overlay + drawer + toast.

## 4. Changelog
### v1.3 Supabase connected (env-based)
Added an env-var layer: `.env.example` (template) + `scripts/load-env.mjs` + `scripts/build-env.mjs` (writes the git-ignored `js/env.js` = `window.__ENV__`), and rewrote js/config.js to read window.__ENV__ while keeping the exact same APP_CONFIG shape - so js/supabase.js, js/api.js and the UI are untouched. index.html now loads js/env.js just before js/config.js. Added scripts/check-supabase.mjs (non-destructive live PASS/FAIL probe of products/categories/brands/orders + the create_order RPC) and scripts/check-config.mjs (offline wiring self-test, 11 assertions). Credentials now live only in .env; .env and js/env.js are git-ignored, and build-env refuses service_role / sb_secret_ keys. Verified live: the publishable key is valid (PostgREST responded) but the tables are not created yet, so applying supabase/migrations/0001_init.sql is the remaining step.

### v1.2 Supabase connection kit
Added supabase/seed.sql (24 products / 10 categories / 20 brands, ids 1-24 matching js/data.js, with setval guards) plus supabase/gen_seed.mjs which regenerates it straight from js/data.js so the live catalog matches MOCK exactly. Wrote SUPABASE_SETUP.md: a 6-step guide (get URL+anon key -> run 0001_init.sql -> run seed.sql -> fill js/config.js -> verify via console/Network/orders table -> optional Auth) with a troubleshooting table and a one-line MOCK rollback. Verified the supabase-js UMD CDN path used in index.html (dist/umd/supabase.js) resolves and contains createClient. No component code changed - connecting is just two values in js/config.js.

### v1.1 Supabase wiring (no DB provisioned yet)
Added the supabase-js UMD loader + js/supabase.js (creates window.SB only when USE_SUPABASE=true, else silent MOCK). js/api.js is now USE_SUPABASE-aware: live products/product queries with a snake_case->camelCase row mapper (nested categories(slug)/brands(name)) and MOCK fallback on any error; createOrder calls the create_order RPC and falls back to localStorage. js/app.js hydrates the grids from Api.products() when live. Wrote supabase/migrations/0001_init.sql (11 tables + RLS + SECURITY DEFINER create_order) for review. Bug fixes: hero data-add now ="1" (was adding undefined); duplicate IDs searchInput/brandSel/priceSel/sortSel/shopCount in #view-shop renamed to *2 with Shop.bind()/syncControls() driving both bars; shipping radio values aligned to labels (4410/10080). Added .gitignore.

### v0.7 catalog browsing (new categories, no redesign)
24 products (was 8). Added TVs (3: 55 QLED, 65 bundle, soundbar), Cameras (4: mirrorless, action, drone, lens), Accessories (2 new: MagDock, hub), Smart Home (3 new: SecureCam, doorbell, LED), Networking (3: AX6000, mesh 3-pack, switch) + AeroBook. Same .p-card/.chip/.grid tokens, same ₦ fmt+DISCOUNT. New: #searchInput, #brandSel (auto from b), #priceSel range 39-2500, #sortSel pop/low/high/rating, #shopCount, #shopFilters data-cat, #clearFilters, .shop-bar styles, .cat data-goto jump. Deals row now TVs/cameras slice. Verified: node --check OK, 24 PRODUCTS, shop render true.
### v0.1 scaffold
Header, hero (gradient headline, stats, trust logos, main card + 3 floats), base tokens (Inter + Space Grotesk).

### v0.2 full homepage
Perks 4-up, 6 tiles, dark deals + countdown, 8 products, 2 promos, brands, 3 reviews, newsletter, footer. Components: btn, chip, p-card, cat, perk, promo, rev, news, drawer, toast, mobile-nav. Responsive 1020px + 640px.

### v0.3 server
Python 3.14.7 serves 200 OK on :8000, detached launch documented.

### v0.4 naira (1 USD = 1400 NGN)
Static: hero 2,658,600/3,498,600, float 180,600, shipping 138,600 x2, promo from 40,600, review 476,000, newsletter 28,000 x2, subtotal 2,839,200. JS: RATE=1400 + fmt(). Zero $ remains.

### v0.8 navigation + category pages + details + pagination
Hash router: #/ (home) #/categories (hub with per-cat counts) #/shop/Cat (title+desc+hero+count+grid+filters+sort+pager) #/search/q (results view reusing shop) #/product/id (gallery, specs, save-amount, related, crumbs) #/deals #/brands #/support anchors. Same .p-card/.chip/.btn tokens. Category meta CATS[11] with descriptions. Pagination PER=8: Prev/Next + Load more, count Showing 1-X of Y • Cat • page P/N. Header search -> #/search, tiles/chips/footer/promos route. Verified node --check OK + hasCATS/Router/Pager/PD/Views true.

### v0.9 shopping: cart + wishlist + account + checkout + confirmation
Clean arch js/: config (RATE/DISCOUNT/PER + SUPABASE placeholders), data (MOCK_PRODUCTS 24 + CATS 11), api (products/product/createOrder/orders — Supabase swap point), store (ve_cart/ve_wish/ve_user localStorage, subtotal via RATE*DISCOUNT), ui (card/badges/sheet/toast/money), shop (filter/sort/page), cart (drawer qty +/-, remove, free-ship bar, totals), account (auth sheet mock, wishlist sheet, profile/orders page), checkout (validated form, ship options, VOLT10 coupon, totals), router (+checkout/account/confirm), app boot. Reusable .qty/.sheet/.co-*/.order/.pill. Responsive: co-grid/acct-grid stack, co-sum static on mobile. Old app.js kept (unused). Verified all 11 js/ node --check OK.

### v1.0 account tabs + full checkout + rich confirmation
Account #/account + tabs: Overview (stats + recent), Personal info (editable mock), Addresses (ve_addrs add/default/delete), Wishlist (move to cart), Orders history + #/account/orders/VE-X detail. Checkout #/checkout 4 steps: contact info, shipping address (saved picker + save checkbox), delivery method (Standard/Express/Same-day + ETA), MOCK payment card (amber .mockpay + pill, no charge) + coupon, final review live box, sticky summary. Confirm #/confirm: order number VE-X + status, items purchased, delivery info, order total breakdown, ETA, view-order link #/account/orders/ID. All C/A/R checks OK, responsive confirm-grid stacks.

## 5. Design system v1.0
Colors: brand-600 #2563EB, hover #1D4ED8, light #DBEAFE/#EFF6FF, ink #0F172A, body #1E293B, muted #64748B, line #E2E8F0, bg #F8FAFC, card #fff, dark #0B1220, accent #F59E0B (stars), mint #10B981 (NEW), rose #EF4444 (sale).
Type: Display Space Grotesk 500/600/700 -0.02em 1.05; Body Inter 400/500/600 1.6; h1 clamp(2.4rem,5.2vw,4rem) gradient em; h2 clamp(1.6rem,3vw,2.3rem); eyebrow pill 0.78rem 700 uppercase 0.08em brand-700.
Layout: max 1240px, gutters 20px, sections 56px/36px mobile, scale 4,8,12,16,20,24,32,48,64,96. Radius sm10 md14 lg20 xl28. Shadows sm/md/lg blue glow for hero.

## 6. Currency (NGN)
RATE=1400, DISCOUNT=0.9 (10% off) in app.js. fmt=n=>"₦"+Math.round(n*RATE*DISCOUNT).toLocaleString("en-NG"). Store USD in PRODUCTS (p:1899), display converts. Examples: 1899->₦2,392,740 999->₦1,258,740 129->₦162,540 249->₦313,740 2199->₦2,770,740 89->₦112,140 349->₦439,740 69->₦86,940 99->₦124,740 20->₦25,200 29->₦36,540 340->₦428,400. Always ₦ + commas. To remove promo, set DISCOUNT=1.

## 7. Components (reuse)
Buttons: .btn .btn-primary(glow) .btn-ghost .btn-dark .btn-sm/.btn-lg. Chips: .chip .active=ink. Header: .header sticky blur, .header-inner, .category-row scroll, .badge i#cartCount. Hero: .hero-grid 1.05/0.95fr, .hero-card-main img340px, .float-1/2/3 animation. Card: .p-card>.p-media(img190px+.p-flag.new/hot+.wish)+.p-body(.p-cat,h3,.stars,.price strong+s,.p-foot Add[data-add]+view). JS card(p) builds it. Deals: .deals dark+glow, .count #hh/#mm/#ss, .deal-row 250px scroll (first 5). Grid: #gridProducts 4-col (all 8). Promo .p1/.p2 gradient+masked img. Rev+avatar, news gradient+white form, footer .f-grid 4-col, drawer/overlay/toast/mobile-nav via #cartBtn/#closeDrawer.

## 8. Responsive
<=1020px: hide nav/kbd/cta/ship-note, hero 1-col img260px, cat/grid 3-col, perks 2-col, news 1-col, footer 2-col. <=640px: show menu-btn, hide searchbar, floats adjust hide-3, cat/grid 2-col img150px, promo/rev 1-col img30%, sections 36px, show mobile-nav body pad64px, footer 1-col, news stacks.

## 9. Conventions
Vanilla only, no frameworks. styles.css order: tokens->base->buttons->header->hero->perks->cards->promo/reviews/news->footer->overlays->responsive. Kebab classes, state .active/.open/.show/.on. Use vars never hardcode. app.js demo only: PRODUCTS {n,c,p,o,r,f,img} USD, card()+fmt(), no fetch/storage. Images Unsplash w400-900 q70 lazy (hero eager), logos Wikimedia gray 60%. Keep alt/aria-label.

## 10. Next steps
- [x] real cart localStorage + #subTotal fmt() + qty (v0.9)
- [x] filters/search/sort/pager (v0.7-v0.8)
- [x] checkout + newsletter validation (v1.0)
- [x] write schema + RLS + create_order RPC (supabase/migrations/0001_init.sql)
- [x] write seed catalog + generator + setup guide (supabase/seed.sql, supabase/gen_seed.mjs, SUPABASE_SETUP.md)
- [ ] provision Supabase project: run 0001_init.sql then seed.sql (see SUPABASE_SETUP.md) - REQUIRED before live data flows
- [x] env-based Supabase config (.env + scripts/build-env.mjs) + connectivity/self-test scripts
- [ ] replace mock auth in js/account.js with supabase.auth (magic link / OTP)
- [ ] wire wishlist + profile + order history reads to Supabase (owner RLS)
- [ ] add #/404 route + real Paystack/Flutterwave payment init

## 11. Log (update every task)
| Date | Ver | Change | Files |
|------|-----|--------|-------|
| 2026-10-01 | v0.4 | Naira 1400 + fmt | index.html, app.js |
| 2026-10-01 | v0.3 | Server :8000 live | — |
| 2026-10-01 | v0.2 | Homepage + responsive | index.html, styles.css, app.js |
| 2026-10-01 | v0.1 | Scaffold + hero | index.html, styles.css |
| 2026-10-01 | v0.5 | README created as canonical doc | README.md |
| 2026-10-01 | v0.6 | 10% off all amounts via DISCOUNT=0.9 | app.js, index.html, README.md |
| 2026-10-01 | v0.7 | Catalog 24 items + search/filter/sort, 4 new tiles | app.js, index.html, styles.css, README.md |
| 2026-10-01 | v0.8 | Router + category hub/detail + pager | app.js, index.html, styles.css, README.md |
| 2026-10-01 | v0.9 | Cart/wishlist/account/checkout/confirm clean arch | js/* (11 files), index.html, styles.css, README.md |
| 2026-10-01 | v1.0 | Account tabs + full checkout + rich confirm | index.html, js/account.js, js/checkout.js, js/router.js, styles.css, README.md |
| 2026-10-01 | v1.0 commit | git init + root commit dbb30c4 (16 files, 1292 insertions) | .git, all tracked |
| 2026-10-01 | v1.1 | Supabase SDK + api swap + migration (review-only); hero/dup-ID/shipping fixes | index.html, js/supabase.js, js/api.js, js/shop.js, js/app.js, js/checkout.js, js/config.js, supabase/migrations/0001_init.sql, .gitignore, README.md, design-system.md |
| 2026-10-01 | v1.2 | Seed catalog + generator + SUPABASE_SETUP.md connect guide | supabase/seed.sql, supabase/gen_seed.mjs, SUPABASE_SETUP.md, README.md |
| 2026-10-01 | v1.3 | Env-var Supabase config (.env -> js/env.js) + live connectivity & config self-tests | .env.example, scripts/build-env.mjs, scripts/load-env.mjs, scripts/check-supabase.mjs, scripts/check-config.mjs, js/config.js, index.html, .gitignore, SUPABASE_SETUP.md, README.md |

