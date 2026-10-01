/* VoltEdge storefront — visual demo only, no backend */
const RATE=1400;
const DISCOUNT=0.9; // 10% off everything
const fmt=n=>"₦"+Math.round(n*RATE*DISCOUNT).toLocaleString("en-NG");
const PRODUCTS=[
{id:1,n:"NovaBook Pro 14 OLED",c:"Laptops",b:"NovaTech",p:1899,o:2499,r:"4.9 (2.1k)",f:"-24%",img:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=70&auto=format&fit=crop"},
{id:2,n:"Photon 15 Ultra Phone",c:"Phones",b:"Photon",p:999,o:1199,r:"4.8 (5.4k)",f:"-17%",img:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=70&auto=format&fit=crop"},
{id:3,n:"Aura Buds Pro ANC",c:"Audio",b:"Aura",p:129,o:199,r:"4.9 (12k)",f:"HOT",img:"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=70&auto=format&fit=crop"},
{id:4,n:"Pulse Fit S Watch",c:"Wearables",b:"Pulse",p:249,o:329,r:"4.7 (3.2k)",f:"NEW",img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=70&auto=format&fit=crop"},
{id:5,n:"Vortex RTX Gaming Rig",c:"Gaming",b:"Vortex",p:2199,o:2599,r:"4.9 (890)",f:"-15%",img:"https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=70&auto=format&fit=crop"},
{id:6,n:"Echo Dome Speaker",c:"Smart Home",b:"Echo",p:89,o:129,r:"4.6 (8k)",f:"-31%",img:"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=70&auto=format&fit=crop"},
{id:7,n:"SonicMax Headphones",c:"Audio",b:"SonicMax",p:349,o:449,r:"4.8 (6k)",f:"-22%",img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=70&auto=format&fit=crop"},
{id:8,n:"VoltCharge 140W GaN",c:"Accessories",b:"VoltEdge",p:69,o:99,r:"4.7 (4k)",f:"NEW",img:"https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=70&auto=format&fit=crop"},
{id:9,n:"VisionMax 55 QLED 4K TV",c:"TVs",b:"VisionMax",p:749,o:899,r:"4.8 (3.4k)",f:"HOT",img:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=70&auto=format&fit=crop"},
{id:10,n:"VisionMax 65 QLED + Soundbar Bundle",c:"TVs",b:"VisionMax",p:1199,o:1499,r:"4.9 (1.2k)",f:"-20%",img:"https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=70&auto=format&fit=crop"},
{id:11,n:"CinemaBar 5.1 Dolby Soundbar",c:"TVs",b:"CinemaBar",p:299,o:399,r:"4.7 (5.1k)",f:"-25%",img:"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=70&auto=format&fit=crop"},
{id:12,n:"Luma M50 Mirrorless Camera",c:"Cameras",b:"Luma",p:899,o:1099,r:"4.9 (980)",f:"-18%",img:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=70&auto=format&fit=crop"},
{id:13,n:"ActionCam 4K Waterproof",c:"Cameras",b:"ActionCam",p:249,o:329,r:"4.7 (6.3k)",f:"NEW",img:"https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&q=70&auto=format&fit=crop"},
{id:14,n:"ProShot 4K Drone",c:"Cameras",b:"ProShot",p:699,o:899,r:"4.8 (2.2k)",f:"HOT",img:"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&q=70&auto=format&fit=crop"},
{id:15,n:"Luma 50mm f/1.8 Lens",c:"Cameras",b:"Luma",p:199,o:259,r:"4.9 (1.5k)",f:"-23%",img:"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=70&auto=format&fit=crop"},
{id:16,n:"MagDock 3-in-1 Wireless Charger",c:"Accessories",b:"VoltEdge",p:79,o:99,r:"4.6 (9k)",f:"-20%",img:"https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=500&q=70&auto=format&fit=crop"},
{id:17,n:"Titan USB-C 11-in-1 Hub",c:"Accessories",b:"Titan",p:129,o:159,r:"4.8 (4.1k)",f:"NEW",img:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=70&auto=format&fit=crop"},
{id:18,n:"SecureCam 360 Indoor",c:"Smart Home",b:"SecureCam",p:79,o:109,r:"4.6 (7k)",f:"-28%",img:"https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=500&q=70&auto=format&fit=crop"},
{id:19,n:"Sentinel Video Doorbell",c:"Smart Home",b:"Sentinel",p:149,o:199,r:"4.7 (3.8k)",f:"NEW",img:"https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=70&auto=format&fit=crop"},
{id:20,n:"GlowStrip LED Starter Kit",c:"Smart Home",b:"Glow",p:39,o:59,r:"4.5 (11k)",f:"-34%",img:"https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=70&auto=format&fit=crop"},
{id:21,n:"Falcon AX6000 WiFi 6 Router",c:"Networking",b:"Falcon",p:199,o:269,r:"4.8 (5.5k)",f:"HOT",img:"https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=500&q=70&auto=format&fit=crop"},
{id:22,n:"MeshForce Whole-Home WiFi 3-Pack",c:"Networking",b:"MeshForce",p:349,o:449,r:"4.9 (2.8k)",f:"NEW",img:"https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=70&auto=format&fit=crop"},
{id:23,n:"SwitchPro 8-Port 2.5G Switch",c:"Networking",b:"SwitchPro",p:89,o:119,r:"4.7 (1.9k)",f:"-25%",img:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=70&auto=format&fit=crop"},
{id:24,n:"AeroBook Air 13 M3",c:"Laptops",b:"NovaTech",p:1099,o:1299,r:"4.8 (1.8k)",f:"-15%",img:"https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=70&auto=format&fit=crop"}
];
function card(p){
const cls=p.f==="NEW"?"new":(p.f==="HOT"?"hot":"");
return `<article class="p-card" data-id="${p.id}"><div class="p-media"><img loading="lazy" src="${p.img}" alt="${p.n}"><span class="p-flag ${cls}">${p.f}</span><button class="wish" aria-label="wishlist">♡</button></div><div class="p-body"><span class="p-cat">${p.c} • ${p.b}</span><h3>${p.n}</h3><div class="stars">★★★★★<span>${p.r}</span></div><div class="price"><strong>${fmt(p.p)}</strong><s>${fmt(p.o)}</s></div><div class="p-foot"><button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button><button class="btn btn-ghost btn-sm" data-view="${p.id}">👁</button></div></div></article>`;
}
// --- CATEGORY META (title + description per department) ---
const CATS={
"All":{t:"All products",d:"Every department in one place. Search, filter and sort the full VoltEdge catalog.",img:"https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=70&auto=format&fit=crop"},
"Laptops":{t:"Laptops",d:"Ultrabooks, creators and gaming laptops. 32GB options, OLED displays, 2-year warranty.",img:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=70&auto=format&fit=crop"},
"Phones":{t:"Smartphones",d:"Flagships with pro cameras and 5G. Trade-in and student discounts stack.",img:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=70&auto=format&fit=crop"},
"Audio":{t:"Audio",d:"ANC earbuds, studio headphones and party speakers. Tested in our sound lab.",img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=70&auto=format&fit=crop"},
"Wearables":{t:"Wearables",d:"Watches and fitness bands with 21-day battery and health tracking.",img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=70&auto=format&fit=crop"},
"Gaming":{t:"Gaming",d:"RTX rigs, 240Hz monitors and pro gear. Bundle and save extra 10%.",img:"https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=70&auto=format&fit=crop"},
"TVs":{t:"TVs & Home Entertainment",d:"QLED 4K TVs, Dolby soundbars and bundles for movie nights.",img:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=70&auto=format&fit=crop"},
"Cameras":{t:"Cameras",d:"Mirrorless, action cams, drones and lenses for creators.",img:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=70&auto=format&fit=crop"},
"Accessories":{t:"Accessories",d:"GaN chargers, hubs and docks. Small upgrades, big speed.",img:"https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=70&auto=format&fit=crop"},
"Smart Home":{t:"Smart Home",d:"Speakers, security, lighting and doorbells from ₦36,540.",img:"https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=70&auto=format&fit=crop"},
"Networking":{t:"Networking",d:"WiFi 6 routers, mesh systems and 2.5G switches for dead-zone-free homes.",img:"https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=70&auto=format&fit=crop"}
};
const PER=8; // pagination size
// --- SHOP BROWSING STATE (no redesign, same components) ---
const shop={q:"",cat:"All",brand:"All",max:2500,sort:"pop",page:1,shown:8};
const grid=document.getElementById("gridProducts");
const shopCount=document.getElementById("shopCount");
const brandSel=document.getElementById("brandSel");
const priceSel=document.getElementById("priceSel");
const sortSel=document.getElementById("sortSel");
const searchInput=document.getElementById("searchInput");
const clearBtn=document.getElementById("clearFilters");
// populate brands once
if(brandSel){[...new Set(PRODUCTS.map(p=>p.b))].sort().forEach(b=>{const o=document.createElement("option");o.value=b;o.textContent=b;brandSel.appendChild(o)})}
function filtered(){
let list=PRODUCTS.filter(p=>
(shop.cat==="All"||p.c===shop.cat)&&
(shop.brand==="All"||p.b===shop.brand)&&
(p.p<=shop.max)&&
(!shop.q||(p.n+" "+p.c+" "+p.b).toLowerCase().includes(shop.q))
);
if(shop.sort==="low")list=[...list].sort((a,b)=>a.p-b.p);
if(shop.sort==="high")list=[...list].sort((a,b)=>b.p-a.p);
if(shop.sort==="rating")list=[...list].sort((a,b)=>parseFloat(b.r)-parseFloat(a.r));
return list;
}
function renderShop(){
syncShopUI();
const list=filtered();
const total=list.length, pages=Math.max(1,Math.ceil(total/PER));
shop.page=Math.min(Math.max(1,shop.page),pages);
const slice=list.slice(0,shop.shown);
const target=(document.body.dataset.view==="shop")?document.getElementById("gridProducts2"):grid;
const countEl=(document.body.dataset.view==="shop")?document.querySelector("#view-shop #shopCount"):shopCount;
if(target)target.innerHTML=slice.length?slice.map(card).join(""):`<div style="grid-column:1/-1;text-align:center;padding:32px;background:#fff;border:1px solid var(--line);border-radius:14px"><b>No products match.</b><br><span style="color:var(--muted)">Try clearing search or filters.</span></div>`;
if(countEl){
const meta=CATS[shop.cat]||CATS.All;
const shownTxt=slice.length?`Showing 1–${slice.length} of ${total}`:`Showing 0 of ${total}`;
countEl.textContent=`${shownTxt} • ${meta.t} • page ${shop.page}/${pages}`;
}
const pi=(document.body.dataset.view==="shop")?document.getElementById("pageInfo2"):document.getElementById("pageInfo");
if(pi)pi.textContent=`Page ${shop.page} of ${pages} • ${total} items`;
["prevPage","nextPage","loadMore","prevPage2","nextPage2","loadMore2"].forEach(id=>{
const el=document.getElementById(id);if(!el)return;
if(id.startsWith("prev"))el.disabled=shop.page<=1;
if(id.startsWith("next"))el.disabled=shop.page>=pages;
if(id.startsWith("load"))el.disabled=shop.shown>=total;
});
if(priceSel)priceSel.querySelector("span").textContent=`Up to ${fmt(shop.max)}`;
}
function syncShopUI(){
// reflect state into both home + view controls
[["#shopFilters","#shopFilters2"]].forEach(()=>{});
document.querySelectorAll("#shopFilters .chip, #shopFilters2 .chip").forEach(x=>x.classList.toggle("active",x.dataset.cat===shop.cat));
if(searchInput&&document.activeElement!==searchInput)searchInput.value=shop.q;
const hs=document.getElementById("headerSearch");if(hs&&document.activeElement!==hs)hs.value=shop.q;
if(brandSel)brandSel.value=shop.brand;if(sortSel)sortSel.value=shop.sort;
const pr=priceSel?.querySelector("input");if(pr&&document.activeElement!==pr)pr.value=shop.max;
// category hero
const meta=CATS[shop.cat]||CATS.All;
const ct=document.getElementById("catTitle");if(ct)ct.textContent=meta.t;
const cd=document.getElementById("catDesc");if(cd)cd.textContent=meta.d+(shop.q?` • Search: “${shop.q}”`:"");
const ci=document.getElementById("catImg");if(ci)ci.src=meta.img;
const cc=document.getElementById("catCount");if(cc){const n=shop.cat==="All"?PRODUCTS.length:PRODUCTS.filter(p=>p.c===shop.cat).length;cc.textContent=`${n} products in this department • ${PRODUCTS.length} total`;}
const cr=document.getElementById("crumbCat");if(cr)cr.textContent=meta.t;
const cs=document.getElementById("crumbSearch");if(cs)cs.textContent=shop.q?` / “${shop.q}”`:"";
}
searchInput?.addEventListener("input",e=>{shop.q=e.target.value.trim().toLowerCase();shop.page=1;shop.shown=PER;renderShop()});
brandSel?.addEventListener("change",e=>{shop.brand=e.target.value;shop.page=1;shop.shown=PER;renderShop()});
priceSel?.querySelector("input")?.addEventListener("input",e=>{shop.max=+e.target.value;shop.page=1;shop.shown=PER;renderShop()});
sortSel?.addEventListener("change",e=>{shop.sort=e.target.value;renderShop()});
function setCat(c){shop.cat=c;shop.page=1;shop.shown=PER;renderShop();}
document.getElementById("shopFilters")?.addEventListener("click",e=>{
const b=e.target.closest("[data-cat]");if(!b)return;
setCat(b.dataset.cat);
});
document.getElementById("shopFilters2")?.addEventListener("click",e=>{
const b=e.target.closest("[data-cat]");if(!b)return;
setCat(b.dataset.cat);
});
// header search -> search results view
document.getElementById("headerSearch")?.addEventListener("input",e=>{
shop.q=e.target.value.trim().toLowerCase();shop.page=1;shop.shown=PER;
location.hash="#/search/"+encodeURIComponent(shop.q);
});
document.querySelectorAll("[data-navcat]").forEach(b=>b.addEventListener("click",()=>{
const c=b.dataset.navcat;location.hash=c==="All"?"#/deals":"#/shop/"+encodeURIComponent(c);
}));
// pagination + load more
function goPage(d){shop.page+=d;shop.shown=Math.max(shop.shown,shop.page*PER);renderShop();window.scrollTo({top:document.getElementById("products")?.offsetTop-80||0,behavior:"smooth"});}
["prevPage","prevPage2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>goPage(-1)));
["nextPage","nextPage2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>goPage(1)));
["loadMore","loadMore2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>{shop.shown+=PER;shop.page=Math.ceil(shop.shown/PER);renderShop();}));
clearBtn?.addEventListener("click",()=>{
Object.assign(shop,{q:"",cat:"All",brand:"All",max:2500,sort:"pop",page:1,shown:PER});
if(searchInput)searchInput.value="";if(brandSel)brandSel.value="All";if(sortSel)sortSel.value="pop";
const pr=priceSel?.querySelector("input");if(pr)pr.value=2500;
renderShop();
});
if(grid)renderShop();
// --- ROUTER: home <-> categories <-> listings <-> search <-> details ---
function route(){
const h=location.hash||"#/";
const parts=h.replace(/^#\//,"").split("/").map(decodeURIComponent);
const root=parts[0]||"";
if(root==="" ){showView("home");}
else if(root==="categories"){showView("cats");buildHub();}
else if(root==="shop"){shop.q="";showView("shop");setCat(CATS[parts[1]]?parts[1]:"All");location.hash="#/shop/"+encodeURIComponent(shop.cat);document.getElementById("view-shop")?.scrollIntoView();}
else if(root==="search"){showView("shop");shop.cat="All";shop.q=(parts[1]||"").toLowerCase();shop.page=1;shop.shown=PER;renderShop();}
else if(root==="product"){showProduct(+parts[1]);}
else if(root==="deals"){showView("home");setCat("All");document.getElementById("deals")?.scrollIntoView({behavior:"smooth"});}
else if(root==="brands"||root==="support"){showView("home");document.getElementById(root)?.scrollIntoView({behavior:"smooth"});}
else{showView("home");}
document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===(root===""?"home":root)));
}
function showView(v){document.body.dataset.view=v==="cats"?"cats":v==="shop"?"shop":v==="product"?"product":"home";
document.getElementById("view-shop").hidden=v!=="shop";
document.getElementById("view-categories").hidden=v!=="cats";
document.getElementById("view-product").hidden=v!=="product";
if(v==="shop")renderShop();window.scrollTo({top:v==="home"?0:0,behavior:"smooth"});}
function buildHub(){
const hub=document.getElementById("catsHub");if(!hub)return;
hub.innerHTML=Object.entries(CATS).filter(([k])=>k!=="All").map(([k,m])=>{
const n=PRODUCTS.filter(p=>p.c===k).length;
return `<div class="cat" data-hub="${k}"><img loading="lazy" src="${m.img}" alt="${m.t}"><div><strong>${m.t}</strong><span>${n} in demo • ${m.d.slice(0,60)}…</span></div></div>`;
}).join("");
hub.querySelectorAll("[data-hub]").forEach(el=>el.addEventListener("click",()=>{location.hash="#/shop/"+encodeURIComponent(el.dataset.hub);}));
}
function showProduct(id){
const p=PRODUCTS.find(x=>x.id===id)||PRODUCTS[0];
showView("product");
document.getElementById("pCrumbs").innerHTML=`<a href="#/">Home</a> / <a href="#/shop/${encodeURIComponent(p.c)}">${p.c}</a> / ${p.n}`;
const img=document.getElementById("pdImg");img.src=p.img.replace("w=500","w=900");img.alt=p.n;
const fl=document.getElementById("pdFlag");fl.textContent=p.f;fl.className="p-flag "+(p.f==="NEW"?"new":p.f==="HOT"?"hot":"");
document.getElementById("pdCat").textContent=`${p.c} • ${p.b}`;
document.getElementById("pdName").textContent=p.n;
document.getElementById("pdStars").innerHTML=`★★★★★<span>${p.r} • 2-year warranty</span>`;
document.getElementById("pdPrice").textContent=fmt(p.p);
document.getElementById("pdOld").textContent=fmt(p.o);
document.getElementById("pdSave").textContent=`Save ${fmt(p.o-p.p)}`;
document.getElementById("pdDesc").textContent=`${p.n} by ${p.b} — ${CATS[p.c]?.d||""} Demo mock data. In stock, ships in 24h.`;
document.getElementById("pdSpecs").innerHTML=[`Brand: ${p.b}`,`Category: ${p.c}`,`Rating: ${p.r}`,`Flag: ${p.f}`,`Warranty: 2 years`,...[`Free express shipping`]].map(s=>`<li>${s}</li>`).join("");
document.getElementById("pdAdd").onclick=e=>{document.querySelector("[data-add]")?.click();toast.textContent=`${p.n} added ✓`;};
document.getElementById("pdRelated").innerHTML=PRODUCTS.filter(x=>x.c===p.c&&x.id!==p.id).concat(PRODUCTS.filter(x=>x.c!==p.c)).slice(0,4).map(card).join("");
window.scrollTo({top:0,behavior:"smooth"});
}
window.addEventListener("hashchange",route);
// product view eye buttons (delegated, works for all grids)
document.addEventListener("click",e=>{
const v=e.target.closest("[data-view]");if(v){location.hash="#/product/"+v.dataset.view;}
const hb=e.target.closest(".cat[data-goto]");if(hb&&!hb.dataset.hub){location.hash="#/shop/"+encodeURIComponent(hb.dataset.goto);}
});
route();
// cart drawer visual
const drawer=document.getElementById("drawer"),overlay=document.getElementById("overlay");
const dItems=document.getElementById("dItems");
const dealRow=document.getElementById("dealRow");
if(dealRow)dealRow.innerHTML=PRODUCTS.slice(8,13).map(card).join("");
if(dItems) dItems.innerHTML=PRODUCTS.slice(0,2).map(p=>`<div class="d-item"><img src="${p.img}"><div><b style="font-size:.9rem">${p.n}</b><br><small style="color:#64748B">Qty 1 • ${fmt(p.p)}</small></div><b>${fmt(p.p)}</b></div>`).join("");
function openD(o){drawer.classList.toggle("open",o);overlay.classList.toggle("show",o)}
document.getElementById("cartBtn")?.addEventListener("click",()=>openD(true));
document.getElementById("closeDrawer")?.addEventListener("click",()=>openD(false));
overlay?.addEventListener("click",()=>openD(false));
// toast
let cart=2;const toast=document.getElementById("toast");
document.addEventListener("click",e=>{
if(e.target.closest("[data-add]")){cart++;document.getElementById("cartCount").textContent=cart;toast.textContent=`Added to cart ✓ (${cart})`;toast.classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>toast.classList.remove("show"),1600);}
if(e.target.closest(".wish")){e.target.closest(".wish").textContent="♥";toast.textContent="Saved to wishlist ♥";toast.classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>toast.classList.remove("show"),1400);}
});
// countdown
let s=14*3600+32*60+10;setInterval(()=>{s=Math.max(0,s-1);const h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");hh.textContent=h;mm.textContent=m;ss.textContent=ss;},1000);
// chips (category-row only, shop has its own handler)
// old tile handler removed — router delegation above handles .cat[data-goto]
