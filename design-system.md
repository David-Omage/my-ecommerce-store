# VoltEdge Design System v1.0
Modern electronics retailer — frontend only.

## 1. Colors
- Primary: #2563EB (brand-600), hover #1D4ED8
- Light blue: #DBEAFE / #EFF6FF for backgrounds
- Ink: #0F172A (headings/nav), body #1E293B, muted #64748B
- Line: #E2E8F0, BG: #F8FAFC, Card: #FFFFFF, Dark: #0B1220
- Accent gold #F59E0B (stars), Mint #10B981 (new/success), Rose #EF4444 (sale)

## 2. Typography
- Display: Space Grotesk 500/600/700, tight -0.02em, h1 clamp 2.4-4rem
- Body: Inter 400/500/600, 1.6 line-height
- Eyebrow pills: 0.78rem uppercase 0.08em

## 3. Spacing / Layout
- Max width 1240px, 20px gutters
- Section padding 56px desktop / 36px mobile
- Scale: 4,8,12,16,20,24,32,48,64,96

## 4. Components
- Buttons: .btn-primary (blue glow), .btn-ghost (white/border), .btn-dark, sizes sm/lg
- Chips: pill filters, active = dark
- Cards: .p-card 14px radius, image 190px, flag + wishlist, category label, stars, price + old price, Add + view
- Category tiles: image top + count
- Header: sticky blur, logo, nav, search pill with CmdK, account/wishlist/cart badges
- Hero: 2-col grid, gradient headline, stats, trust logos, main product card + floating mini-cards
- Deals: dark rounded panel + countdown + horizontal scroll row
- Promo: 2 gradient banners, newsletter gradient, dark footer
- Drawer/Toast/Mobile bottom nav for mobile UX

## 5. Responsive
- <=1020px: hide nav/kbd, hero stacks, grids 3-col, perks 2-col
- <=640px: hamburger + bottom nav, hide searchbar, 2-col products/categories, promos stack, drawer full-width

## Files
- index.html (structure) / styles.css (system) / js/* (app modules)
- js/config.js + js/supabase.js + js/api.js = data layer (MOCK <-> Supabase swap point)
- supabase/migrations/0001_init.sql = backend schema (review-only, not yet applied)
- app.js (root) is legacy/dead - not loaded by index.html
- Open index.html directly in browser — no build step.
