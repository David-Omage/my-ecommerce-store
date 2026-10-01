// Shop browsing — search/filter/sort/paginate over Api products.
window.Shop={q:"",cat:"All",brand:"All",max:2500,sort:"pop",page:1,shown:8,list:window.MOCK_PRODUCTS,
filtered(){let l=this.list.filter(p=>(this.cat==="All"||p.c===this.cat)&&(this.brand==="All"||p.b===this.brand)&&(p.p<=this.max)&&(!this.q||(p.n+" "+p.c+" "+p.b).toLowerCase().includes(this.q)));
if(this.sort==="low")l=[...l].sort((a,b)=>a.p-b.p);if(this.sort==="high")l=[...l].sort((a,b)=>b.p-a.p);if(this.sort==="rating")l=[...l].sort((a,b)=>parseFloat(b.r)-parseFloat(a.r));return l;},
setCat(c){this.cat=c;this.page=1;this.shown=window.APP_CONFIG.PER;this.render();},
render(){const PER=window.APP_CONFIG.PER;const list=this.filtered();const total=list.length,pages=Math.max(1,Math.ceil(total/PER));
this.page=Math.min(Math.max(1,this.page),pages);const slice=list.slice(0,this.shown);
const inShop=document.body.dataset.view==="shop";
const target=inShop?document.getElementById("gridProducts2"):document.getElementById("gridProducts");
const countEl=inShop?document.querySelector("#view-shop #shopCount"):document.getElementById("shopCount");
if(target)target.innerHTML=slice.length?slice.map(p=>window.UI.card(p)).join(""):`<div style="grid-column:1/-1;text-align:center;padding:32px;background:#fff;border:1px solid var(--line);border-radius:14px"><b>No products match.</b><br><span style="color:var(--muted)">Try clearing search or filters.</span></div>`;
if(countEl){const m=window.CATS[this.cat]||window.CATS.All;countEl.textContent=`${slice.length?`Showing 1–${slice.length} of ${total}`:`Showing 0 of ${total}`} • ${m.t} • page ${this.page}/${pages}`;}
const pi=inShop?document.getElementById("pageInfo2"):document.getElementById("pageInfo");if(pi)pi.textContent=`Page ${this.page} of ${pages} • ${total} items`;
["prevPage","nextPage","loadMore","prevPage2","nextPage2","loadMore2"].forEach(id=>{const el=document.getElementById(id);if(!el)return;
if(id.startsWith("prev"))el.disabled=this.page<=1;if(id.startsWith("next"))el.disabled=this.page>=pages;if(id.startsWith("load"))el.disabled=this.shown>=total;});
const ps=document.getElementById("priceSel");if(ps)ps.querySelector("span").textContent=`Up to ${window.UI.moneyUSD(this.max)}`;
document.querySelectorAll("#shopFilters .chip, #shopFilters2 .chip").forEach(x=>x.classList.toggle("active",x.dataset.cat===this.cat));
const meta=window.CATS[this.cat]||window.CATS.All;
const ct=document.getElementById("catTitle");if(ct)ct.textContent=meta.t;
const cd=document.getElementById("catDesc");if(cd)cd.textContent=meta.d+(this.q?` • Search: “${this.q}”`:"");
const ci=document.getElementById("catImg");if(ci)ci.src=meta.img;
const cc=document.getElementById("catCount");if(cc){const n=this.cat==="All"?this.list.length:this.list.filter(p=>p.c===this.cat).length;cc.textContent=`${n} products in this department • ${this.list.length} total`;}
const cr=document.getElementById("crumbCat");if(cr)cr.textContent=meta.t;
const cs=document.getElementById("crumbSearch");if(cs)cs.textContent=this.q?` / “${this.q}”`:"";
const bs=document.getElementById("brandSel");if(bs&&!bs.dataset.fill){[...new Set(this.list.map(p=>p.b))].sort().forEach(b=>{const o=document.createElement("option");o.value=b;o.textContent=b;bs.appendChild(o)});bs.dataset.fill="1";}
},
bind(){const S=this;
document.getElementById("searchInput")?.addEventListener("input",e=>{S.q=e.target.value.trim().toLowerCase();S.page=1;S.shown=window.APP_CONFIG.PER;S.render();});
document.getElementById("brandSel")?.addEventListener("change",e=>{S.brand=e.target.value;S.page=1;S.shown=window.APP_CONFIG.PER;S.render();});
document.querySelector("#priceSel input")?.addEventListener("input",e=>{S.max=+e.target.value;S.page=1;S.shown=window.APP_CONFIG.PER;S.render();});
document.getElementById("sortSel")?.addEventListener("change",e=>{S.sort=e.target.value;S.render();});
[["shopFilters"],["shopFilters2"]].forEach(([id])=>document.getElementById(id)?.addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(b)S.setCat(b.dataset.cat);}));
document.getElementById("headerSearch")?.addEventListener("input",e=>{S.q=e.target.value.trim().toLowerCase();S.page=1;S.shown=window.APP_CONFIG.PER;location.hash="#/search/"+encodeURIComponent(S.q);});
document.querySelectorAll("[data-navcat]").forEach(b=>b.addEventListener("click",()=>{const c=b.dataset.navcat;location.hash=c==="All"?"#/deals":"#/shop/"+encodeURIComponent(c);}));
const go=d=>{S.page+=d;S.shown=Math.max(S.shown,S.page*window.APP_CONFIG.PER);S.render();window.scrollTo({top:0,behavior:"smooth"});};
["prevPage","prevPage2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>go(-1)));
["nextPage","nextPage2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>go(1)));
["loadMore","loadMore2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>{S.shown+=window.APP_CONFIG.PER;S.page=Math.ceil(S.shown/window.APP_CONFIG.PER);S.render();}));
document.getElementById("clearFilters")?.addEventListener("click",()=>{Object.assign(S,{q:"",cat:"All",brand:"All",max:2500,sort:"pop",page:1,shown:window.APP_CONFIG.PER});const si=document.getElementById("searchInput");if(si)si.value="";const bs=document.getElementById("brandSel");if(bs)bs.value="All";const ss=document.getElementById("sortSel");if(ss)ss.value="pop";const pr=document.querySelector("#priceSel input");if(pr)pr.value=2500;S.render();});
}
};