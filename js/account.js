// Account: overview/info/addresses/wishlist/history/detail (mock auth).
window.Account={
tab:"overview",
addrs(){return JSON.parse(localStorage.getItem("ve_addrs")||"[]");},
saveAddrs(a){localStorage.setItem("ve_addrs",JSON.stringify(a));},
openWish(){const S=window.Store,U=window.UI;
const items=S.wish.map(id=>window.MOCK_PRODUCTS.find(p=>p.id===+id)).filter(Boolean);
U.sheet("Wishlist ("+items.length+")",items.length?items.map(p=>`<div class="d-item"><img src="${p.img}"><div><b style="font-size:.9rem">${p.n}</b><br><small>${U.moneyUSD(p.p)}</small></div><div style="display:grid;gap:6px"><button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button><button class="btn btn-ghost btn-sm" data-wish="${p.id}">✕</button></div></div>`).join(""):"No saved items yet. Tap ♡ on any product.");
},
openAuth(){const U=window.UI,S=window.Store;
if(S.user){location.hash="#/account";return;}
U.sheet("Sign in (mock)",`<form id="authForm" class="co-form"><input name="name" required placeholder="Full name" /><input name="email" type="email" required placeholder="Email" /><input name="phone" required placeholder="Phone" /><button class="btn btn-primary">Continue →</button><small class="hint">Mock auth — localStorage only.</small></form>`);
document.getElementById("authForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);
S.login({name:f.get("name"),email:f.get("email"),phone:f.get("phone")});U.closeSheet();U.toast("Welcome ✓");document.getElementById("signinBtn").textContent="Hi, "+S.user.name.split(" ")[0];location.hash="#/account";});
},
renderWish(){const box=document.getElementById("acctWish");if(!box)return;const S=window.Store,U=window.UI;
box.innerHTML=S.wish.length?S.wish.map(id=>{const p=window.MOCK_PRODUCTS.find(x=>x.id===+id);return p?`<div class="d-item"><img src="${p.img}"><div><b style="font-size:.85rem">${p.n}</b><br><small>${U.moneyUSD(p.p)}</small></div><div style="display:grid;gap:6px"><button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button><button class="btn btn-ghost btn-sm" data-wish="${p.id}">Remove</button></div></div>`:"";}).join(""):"Empty — tap ♡ to save.";
},
renderAddrs(){const box=document.getElementById("addrList");if(!box)return;const list=this.addrs();
box.innerHTML=list.length?list.map((a,i)=>`<div class="order"><b>${a.label||"Address "+(i+1)}</b> ${a.def?"<span class='pill'>Default</span>":""}<br><small>${a.address}, ${a.city}, ${a.state}</small><br><button class="btn btn-ghost btn-sm" data-addrdef="${i}">Default</button> <button class="btn btn-ghost btn-sm" data-addrdel="${i}">Delete</button></div>`).join(""):"No saved addresses yet.";
},
setTab(t){this.tab=t;document.querySelectorAll("#acctTabs .chip").forEach(c=>c.classList.toggle("active",c.dataset.tab===t));
document.getElementById("acctOverview").style.display=t==="overview"?"":"none";
["info","addresses","wishlist","orders"].forEach(k=>document.getElementById("pane-"+k).hidden=k!==t);
document.getElementById("acctCrumb").textContent="/ "+t;
},
renderPage(sub){const S=window.Store,U=window.UI;window.Api.orders().then(orders=>{
this.setTab(sub&&["info","addresses","wishlist","orders"].includes(sub)?sub:(sub&&sub.startsWith("VE-")?"orders":this.tab||"overview"));
if(!S.user){document.getElementById("acctTitle").textContent="Sign in required";
document.getElementById("acctStats").innerHTML=`<button class="btn btn-primary" id="goLogin">Sign in →</button>`;
document.getElementById("goLogin")?.addEventListener("click",()=>this.openAuth());
document.getElementById("acctRecent").textContent="—";document.getElementById("acctOrders").textContent="Sign in to see orders.";this.renderWish();this.renderAddrs();return;}
document.getElementById("acctTitle").textContent="Hi, "+S.user.name.split(" ")[0];
const f=document.getElementById("infoForm");f.name.value=S.user.name||"";f.email.value=S.user.email||"";f.phone.value=S.user.phone||"";
this.renderWish();this.renderAddrs();
document.getElementById("acctStats").innerHTML=`<b>${S.user.name}</b><br><small>${S.user.email}<br>${S.user.phone}</small><br><br><span class="pill">${orders.length} orders</span> <span class="pill">${S.wish.length} wishlist</span> <span class="pill">${this.addrs().length} addresses</span>`;
document.getElementById("acctRecent").innerHTML=orders[0]?`<b>${orders[0].id}</b> • ${U.fmtN(orders[0].total)}<br><small>${new Date(orders[0].date).toLocaleString()}</small><br><a href="#/account/orders/${orders[0].id}" style="color:var(--brand-600);font-weight:700">View →</a>`:"No orders yet.";
document.getElementById("acctOrders").innerHTML=orders.length?orders.map(o=>`<div class="order"><b>${o.id}</b> • ${new Date(o.date).toLocaleDateString()} • ${o.items.length} items • <b>${U.fmtN(o.total)}</b> • <span class="pill">${o.status}</span><br><small>${o.name} • ${o.city}, ${o.state} • ${o.shipLabel}</small><br><a href="#/account/orders/${o.id}" style="color:var(--brand-600);font-weight:700">View details →</a></div>`).join(""):"No orders yet.";
const det=sub&&sub.startsWith("VE-")?sub:null;const od=document.getElementById("orderDetail");
if(det){const o=orders.find(x=>x.id===det);od.hidden=false;
od.innerHTML=o?`<h4>Order ${o.id}</h4>`+o.items.map(i=>`<div class="d-item"><img src="${i.img}"><div><b style="font-size:.85rem">${i.n} × ${i.qty}</b></div><b>${U.fmtN(i.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*i.qty)}</b></div>`).join("")+`<div class="t-row"><span>Subtotal</span><b>${U.fmtN(o.sub)}</b></div><div class="t-row"><span>Shipping (${o.shipLabel})</span><span>${U.fmtN(o.ship)}</span></div><div class="t-row grand"><span>Total</span><b>${U.fmtN(o.total)}</b></div><small>Deliver to ${o.address}, ${o.city}, ${o.state} • ETA ${o.eta}</small>`:"Order not found.";
}else od.hidden=true;
});},
bind(){document.getElementById("accountBtn")?.addEventListener("click",()=>this.openAuth());
document.getElementById("signinBtn")?.addEventListener("click",()=>this.openAuth());
document.getElementById("sheetClose")?.addEventListener("click",()=>window.UI.closeSheet());
document.getElementById("sheet")?.addEventListener("click",e=>{if(e.target.id==="sheet")window.UI.closeSheet();});
document.getElementById("logoutBtn")?.addEventListener("click",()=>{window.Store.logout();document.getElementById("signinBtn").textContent="Sign in";location.hash="#/";window.UI.toast("Signed out");});
const u=window.Store.user;if(u)document.getElementById("signinBtn").textContent="Hi, "+u.name.split(" ")[0];
document.getElementById("acctTabs")?.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)this.setTab(b.dataset.tab);});
document.getElementById("infoForm")?.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);const cur=window.Store.user||{};Object.assign(cur,{name:f.get("name"),email:f.get("email"),phone:f.get("phone")});window.Store.login(cur);window.UI.toast("Info saved ✓");this.renderPage();});
document.getElementById("addrForm")?.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);const l=this.addrs();l.push({label:f.get("label"),address:f.get("address"),city:f.get("city"),state:f.get("state"),def:!l.length});this.saveAddrs(l);e.target.reset();this.renderAddrs();window.UI.toast("Address saved ✓");});
document.addEventListener("click",e=>{const d=e.target.closest("[data-addrdef]");if(d){const l=this.addrs();l.forEach((a,i)=>a.def=i===+d.dataset.addrdef);this.saveAddrs(l);this.renderAddrs();}
const x=e.target.closest("[data-addrdel]");if(x){const l=this.addrs();l.splice(+x.dataset.addrdel,1);this.saveAddrs(l);this.renderAddrs();}});
}
};