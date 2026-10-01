// Reusable UI primitives — same design tokens everywhere.
window.UI={
toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>t.classList.remove("show"),1600);},
fmtN(n){return "₦"+Math.round(n).toLocaleString("en-NG");},
moneyUSD(usd){const c=window.APP_CONFIG;return this.fmtN(usd*c.RATE*c.DISCOUNT);},
badges(){document.getElementById("cartCount").textContent=window.Store.cartCount();document.getElementById("wishCount").textContent=window.Store.wish.length;},
sheet(title,html){document.getElementById("sheetTitle").textContent=title;document.getElementById("sheetBody").innerHTML=html;document.getElementById("sheet").hidden=false;},
closeSheet(){document.getElementById("sheet").hidden=true;},
openDrawer(){document.getElementById("drawer").classList.add("open");document.getElementById("overlay").classList.add("show");window.Cart.render();},
closeDrawer(){document.getElementById("drawer").classList.remove("open");document.getElementById("overlay").classList.remove("show");},
card(p){
const wished=window.Store.isWished(p.id);
const cls=p.f==="NEW"?"new":(p.f==="HOT"?"hot":"");
return `<article class="p-card"><div class="p-media"><img loading="lazy" src="${p.img}" alt="${p.n}"><span class="p-flag ${cls}">${p.f}</span><button class="wish ${wished?"on":""}" data-wish="${p.id}" aria-label="wishlist">${wished?"♥":"♡"}</button></div><div class="p-body"><span class="p-cat">${p.c} • ${p.b}</span><h3>${p.n}</h3><div class="stars">★★★★★<span>${p.r}</span></div><div class="price"><strong>${this.moneyUSD(p.p)}</strong><s>${this.moneyUSD(p.o)}</s></div><div class="p-foot"><button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button><button class="btn btn-ghost btn-sm" data-view="${p.id}">👁</button></div></div></article>`;
}
};
window.PRODUCTS=window.MOCK_PRODUCTS;window.CATS=window.CATS;window.fmt=u=>window.UI.moneyUSD(u);