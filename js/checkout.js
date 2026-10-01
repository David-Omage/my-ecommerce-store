// Checkout: info/address/method/summary/mock-pay/review + confirm filling.
window.Checkout={
shipOpts:[{v:"0",t:"Standard (3–5 days)"},{v:"4410",t:"Express (24h metro)"},{v:"10080",t:"Same-day Lagos"}],
shipLabel(v){return v==="10080"?"Same-day Lagos":v==="4410"?"Express (24h)":"Standard (3–5 days)";},
eta(v){const d=new Date();d.setDate(d.getDate()+(v==="10080"?0:v==="4410"?1:4));return d.toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"});},
render(){const S=window.Store,U=window.UI;const lines=S.cartLines();
document.getElementById("coItems").innerHTML=lines.length?lines.map(l=>`<div class="d-item"><img src="${l.img}"><div><b style="font-size:.85rem">${l.n} × ${l.qty}</b></div><b>${U.fmtN(l.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*l.qty)}</b></div>`).join(""):"Cart empty.";
const u=S.user;const f=document.getElementById("coForm");
if(u){f.name.value=u.name||"";f.email.value=u.email||"";f.phone.value=u.phone||"";}
const def=(window.Account.addrs().find(a=>a.def)||window.Account.addrs()[0]);
if(def){f.address.value=def.address||"";f.city.value=def.city||"";f.state.value=def.state||"Lagos";}
document.getElementById("addrPick").innerHTML=window.Account.addrs().length?`<small class="hint">Saved:</small> `+window.Account.addrs().map((a,i)=>`<button type="button" class="chip${a.def?" active":""}" data-pickaddr="${i}">${a.label||"Addr "+(i+1)}</button>`).join(""):"";
this.totals();
document.getElementById("backShop")?.addEventListener("click",()=>window.UI.openDrawer());
document.getElementById("backShop2")?.addEventListener("click",()=>location.hash="#/shop");
},
totals(){const S=window.Store,U=window.UI;const sub=S.subtotal();
const shipEl=document.querySelector('input[name="ship"]:checked');const ship=sub===0?0:(sub>=window.APP_CONFIG.FREE_SHIP&&shipEl?.value==="0"?0:+shipEl.value||0);
const coupon=document.getElementById("coupon")?.value.trim().toUpperCase();
const disc=coupon==="VOLT10"?Math.round(sub*0.1):0;
const total=Math.max(0,sub-disc+ship);
document.getElementById("coTotals").innerHTML=`<div class="t-row"><span>Subtotal</span><b>${U.fmtN(sub)}</b></div><div class="t-row"><span>Coupon ${disc?`(VOLT10 −10%)`:""}</span><span>−${U.fmtN(disc)}</span></div><div class="t-row"><span>Shipping (${this.shipLabel(shipEl?.value||"0")})</span><span>${ship===0?"Free":U.fmtN(ship)}</span></div><div class="t-row grand"><span>Total</span><b>${U.fmtN(total)}</b></div>`;
const f=document.getElementById("coForm");
const rb=document.getElementById("reviewBox");
if(rb&&f){const fd=new FormData(f);
rb.innerHTML=`<div class="order"><b>${fd.get("name")||"—"}</b> • ${fd.get("phone")||"—"}<br><small>${fd.get("email")||"—"}</small></div><div class="order"><b>Deliver to:</b><br><small>${fd.get("address")||"—"}, ${fd.get("city")||"—"}, ${fd.get("state")||""}</small></div><div class="order"><b>${this.shipLabel(fd.get("ship"))}</b><br><small>ETA ${this.eta(fd.get("ship"))} • ${fd.get("pay")==="pod"?"Pay on delivery":"Card/Transfer (mock)"}</small></div>`;}
return {sub,disc,ship,total,coupon};
},
bind(){document.getElementById("coForm")?.addEventListener("input",e=>{
const pk=e.target.closest("[data-pickaddr]");
if(pk){const a=window.Account.addrs()[+pk.dataset.pickaddr];const f=document.getElementById("coForm");f.address.value=a.address;f.city.value=a.city;f.state.value=a.state;}
this.totals();});
document.getElementById("placeOrder")?.addEventListener("click",()=>{
const S=window.Store,U=window.UI;const f=document.getElementById("coForm");
const err=document.getElementById("coErr");
if(!S.cartCount()){err.textContent="Your cart is empty.";return;}
if(!f.checkValidity()){f.reportValidity();return;}
const fd=new FormData(f);const t=this.totals();
const shipV=fd.get("ship");
const order={items:S.cartLines(),sub:t.sub,disc:t.disc,ship:t.ship,total:t.total,name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),address:fd.get("address"),city:fd.get("city"),state:fd.get("state"),note:fd.get("note"),shipOpt:shipV,shipLabel:this.shipLabel(shipV),eta:this.eta(shipV),pay:fd.get("pay"),payMock:true,coupon:t.coupon,status:"Processing"};
if(fd.get("saveAddr")){const l=window.Account.addrs();if(!l.some(a=>a.address===order.address)){l.push({label:"Checkout",address:order.address,city:order.city,state:order.state,def:!l.length});window.Account.saveAddrs(l);}}
window.Api.createOrder(order).then(saved=>{
window._lastOrder=saved;
S.clearCart();U.badges();
document.getElementById("confirmMsg").textContent=`${saved.name}, thanks! Receipt sent to ${saved.email}. Mock payment approved — no real charge.`;
document.getElementById("cfNum").innerHTML=`<span class="ordernum">${saved.id}</span> <span class="pill">${saved.status}</span><br><small>${new Date(saved.date).toLocaleString()} • ${saved.pay==="pod"?"Pay on delivery":"Card/Transfer (mock)"}</small>`;
document.getElementById("cfItems").innerHTML=saved.items.map(i=>`<div class="d-item"><img src="${i.img}"><div><b style="font-size:.85rem">${i.n} × ${i.qty}</b></div><b>${U.fmtN(i.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*i.qty)}</b></div>`).join("");
document.getElementById("cfShip").innerHTML=`${saved.address}, ${saved.city}, ${saved.state}<br><small>${saved.shipLabel} • ${saved.phone}${saved.note?` • Note: ${saved.note}`:""}</small>`;
document.getElementById("cfEta").innerHTML=`<b>${saved.eta}</b><br><small>Standard free over ₦124,740</small>`;
document.getElementById("cfTotal").innerHTML=`<div class="t-row"><span>Subtotal</span><b>${U.fmtN(saved.sub)}</b></div><div class="t-row"><span>Discount</span><span>−${U.fmtN(saved.disc)}</span></div><div class="t-row"><span>Shipping</span><span>${saved.ship===0?"Free":U.fmtN(saved.ship)}</span></div><div class="t-row grand"><span>Total charged (mock)</span><b>${U.fmtN(saved.total)}</b></div>`;
document.getElementById("viewOrderBtn").href="#/account/orders/"+saved.id;
location.hash="#/confirm";
});
});
},
showConfirm(){window.UI.badges();}
};