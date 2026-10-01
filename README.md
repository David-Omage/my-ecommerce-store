# ⚡ VoltEdge — Modern Electronics Store

> Polished responsive storefront for premium electronics.
> **Status:** Frontend design only (no backend, checkout, auth yet).
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
app.js       # demo data only: PRODUCTS, card(), drawer/toast/countdown
design-system.md # cheat-sheet (README is canonical)
README.md    # this file - update every task
```
Order: announce -> header (.header-inner + .category-row) -> hero (.hero-grid + .perks) -> #categories (.cat-grid) -> #deals (.deals + #dealRow) -> #products (.filter-row + #gridProducts) -> promo-grid -> #brands -> .rev-grid -> #support .news -> footer -> mobile-nav + overlay + drawer + toast.

## 4. Changelog
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
- [ ] product.html reusing header/footer/p-card
- [ ] filters functional by c in app.js
- [ ] real cart localStorage + #subTotal fmt() + qty
- [ ] search + CmdK focus
- [ ] checkout/newsletter validation + Paystack/Flutterwave badges

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

