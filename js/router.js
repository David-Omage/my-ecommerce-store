// Hash router — home/categories/shop/search/product/checkout/account/confirm.
window.Router={
route(){const h=location.hash||"#/";const parts=h.replace(/^#\//,"").split("/").map(decodeURIComponent);const root=parts[0]||"";
const views=["view-shop","view-categories","view-product","view-checkout","view-confirm","view-account"];
const show=id=>{views.forEach(v=>document.getElementById(v).hidden=v!==id);
const home=id===null;
document.body.dataset.view=id==="view-shop"?"shop":id==="view-categories"?"cats":id==="view-product"?"product":id==="view-checkout"?"checkout":id==="view-confirm"?"confirm":id==="view-account"?"account":"home";
["products","deals","categories"].forEach(s=>{const el=document.getElementById(s);if(el)el.style.display=home?"":"none";});
document.querySelectorAll(".hero,.perks").forEach(el=>el.style.display=home?"":"none");
document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===(root===""?"home":root)));
window.scrollTo({top:0});};
if(root==="")show(null);
else if(root==="categories"){show("view-categories");this.hub();}
else if(root==="shop"){show("view-shop");window.Shop.q="";const c=window.CATS[parts[1]]?parts[1]:"All";if(window.Shop.cat!==c)window.Shop.setCat(c);else window.Shop.render();}
else if(root==="search"){show("view-shop");window.Shop.cat="All";window.Shop.q=(parts[1]||"").toLowerCase();window.Shop.page=1;window.Shop.shown=window.APP_CONFIG.PER;window.Shop.render();}
else if(root==="product")this.product(+parts[1]);
else if(root==="checkout"){if(!window.Store.cartCount()){location.hash="#/shop";return;}show("view-checkout");window.Checkout.render();}
else if(root==="confirm"){show("view-confirm");window.Checkout.showConfirm();}
else if(root==="account"){show("view-account");const sub=parts[1]==="orders"?parts[2]||"orders":parts[1];window.Account.renderPage(sub);}
else if(root==="deals"){show(null);window.Shop.setCat("All");setTimeout(()=>document.getElementById("deals")?.scrollIntoView({behavior:"smooth"}),50);}
else if(root==="brands"||root==="support"){show(null);setTimeout(()=>document.getElementById(root)?.scrollIntoView({behavior:"smooth"}),50);}
else show(null);
},
hub(){const hub=document.getElementById("catsHub");hub.innerHTML=Object.entries(window.CATS).filter(([k])=>k!=="All").map(([k,m])=>{const n=window.MOCK_PRODUCTS.filter(p=>p.c===k).length;
return `<div class="cat" data-hub="${k}"><img loading="lazy" src="${m.img}" alt="${m.t}"><div><strong>${m.t}</strong><span>${n} in demo • ${m.d}</span></div></div>`;}).join("");
hub.querySelectorAll("[data-hub]").forEach(el=>el.addEventListener("click",()=>location.hash="#/shop/"+encodeURIComponent(el.dataset.hub)));},
product(id){const p=window.MOCK_PRODUCTS.find(x=>x.id===id)||window.MOCK_PRODUCTS[0];
["view-shop","view-categories","view-checkout","view-confirm","view-account"].forEach(v=>document.getElementById(v).hidden=true);
document.getElementById("view-product").hidden=false;document.body.dataset.view="product";
["products","deals","categories"].forEach(s=>document.getElementById(s).style.display="none");document.querySelectorAll(".hero,.perks").forEach(el=>el.style.display="none");
document.getElementById("pCrumbs").innerHTML=`<a href="#/">Home</a> / <a href="#/shop/${encodeURIComponent(p.c)}">${p.c}</a> / ${p.n}`;
const img=document.getElementById("pdImg");img.src=p.img.replace("w=500","w=900");img.alt=p.n;
const fl=document.getElementById("pdFlag");fl.textContent=p.f;fl.className="p-flag "+(p.f==="NEW"?"new":p.f==="HOT"?"hot":"");
document.getElementById("pdCat").textContent=`${p.c} • ${p.b}`;document.getElementById("pdName").textContent=p.n;
document.getElementById("pdStars").innerHTML=`★★★★★<span>${p.r} • 2-year warranty</span>`;
document.getElementById("pdPrice").textContent=window.UI.moneyUSD(p.p);document.getElementById("pdOld").textContent=window.UI.moneyUSD(p.o);
document.getElementById("pdSave").textContent=`Save ${window.UI.moneyUSD(p.o-p.p)}`;
document.getElementById("pdDesc").textContent=`${p.n} by ${p.b} — ${window.CATS[p.c]?.d||""} In stock, ships in 24h.`;
document.getElementById("pdSpecs").innerHTML=[`Brand: ${p.b}`,`Category: ${p.c}`,`Rating: ${p.r}`,`Flag: ${p.f}`,`Warranty: 2 years`,`Free express shipping over ₦124,740`].map(s=>`<li>${s}</li>`).join("");
const add=document.getElementById("pdAdd");add.onclick=()=>{window.Store.add(p.id,1);window.UI.badges();window.UI.toast(`${p.n} added ✓`);};
const w=document.getElementById("pdWish");const sync=()=>{const on=window.Store.isWished(p.id);w.textContent=on?"♥ Saved":"♡ Save";};sync();w.onclick=()=>{window.Store.toggleWish(p.id);window.UI.badges();sync();};
document.getElementById("pdRelated").innerHTML=window.MOCK_PRODUCTS.filter(x=>x.c===p.c&&x.id!==p.id).concat(window.MOCK_PRODUCTS.filter(x=>x.c!==p.c)).slice(0,4).map(x=>window.UI.card(x)).join("");
window.scrollTo({top:0});
},
bind(){window.addEventListener("hashchange",()=>this.route());
document.addEventListener("click",e=>{const v=e.target.closest("[data-view]");if(v)location.hash="#/product/"+v.dataset.view;
const hb=e.target.closest(".cat[data-goto]");if(hb)location.hash="#/shop/"+encodeURIComponent(hb.dataset.goto);});
}
};