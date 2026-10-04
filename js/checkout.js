// Checkout: address/contact/delivery/summary/mock-pay/review + confirmation.
window.Checkout={
couponStatus:{code:"",valid:false,percentOff:0},
couponTimer:null,
shipOpts:[{v:"0",t:"Standard (3–5 days)"},{v:"4410",t:"Express (24h metro)"},{v:"10080",t:"Same-day Lagos"}],
esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));},
shipLabel(v){return v==="10080"?"Same-day Lagos":v==="4410"?"Express (24h)":"Standard (3–5 days)";},
eta(v){const d=new Date();d.setDate(d.getDate()+(v==="10080"?0:v==="4410"?1:4));return d.toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"});},
render(){const S=window.Store,U=window.UI;const lines=S.cartLines();
document.getElementById("coItems").innerHTML=lines.length?lines.map(l=>`<div class="d-item"><img src="${l.img}" alt="${l.n}"><div><b style="font-size:.85rem">${l.n} × ${l.qty}</b></div><b>${U.fmtN(l.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*l.qty)}</b></div>`).join(""):'<p class="hint">Cart empty.</p>';
const f=document.getElementById("coForm"),u=S.user;const save=f.elements.namedItem("saveAddr");save.disabled=!u;save.checked=!!u;
if(u){f.elements.namedItem("name").value=u.name||"";f.elements.namedItem("email").value=u.email||"";f.elements.namedItem("phone").value=u.phone||"";}
const addresses=window.Account.addrs(),def=addresses.find(a=>a.def)||addresses[0];
if(def){f.elements.namedItem("address").value=def.address||"";f.elements.namedItem("city").value=def.city||"";f.elements.namedItem("state").value=def.state||"Lagos";}
document.getElementById("addrPick").innerHTML=addresses.length?'<small class="hint">Saved:</small> '+addresses.map((a,i)=>`<button type="button" class="chip${a.def?" active":""}" data-pickaddr="${i}">${a.label||"Address "+(i+1)}</button>`).join(""):"";
this.totals();document.getElementById("backShop")?.addEventListener("click",()=>window.UI.openDrawer());document.getElementById("backShop2")?.addEventListener("click",()=>location.hash="#/shop");
},
totals(){const S=window.Store,U=window.UI;const sub=S.subtotal();const shipEl=document.querySelector('input[name="ship"]:checked');
const shipOpt=shipEl?.value||"0";const ship=sub===0?0:(shipOpt==="4410"?4410:shipOpt==="10080"?10080:window.APP_CONFIG.standardShipping(sub));
const coupon=document.getElementById('coupon')?.value.trim().toUpperCase();const couponStatus=this.couponStatus;const disc=coupon&&couponStatus.code===coupon&&couponStatus.valid?Math.round(sub*couponStatus.percentOff)/100:0;const total=Math.max(0,Math.round((sub-disc+ship)*100)/100);
document.getElementById("coTotals").innerHTML=`<div class="t-row"><span>Subtotal</span><b>${U.fmtN(sub)}</b></div><div class="t-row"><span>Coupon ${disc?`(${couponStatus.percentOff}% off)`:""}</span><span>−${U.fmtN(disc)}</span></div><div class="t-row"><span>Shipping (${this.shipLabel(shipEl?.value||"0")})</span><span>${ship===0?"Free":U.fmtN(ship)}</span></div><div class="t-row grand"><span>Total</span><b>${U.fmtN(total)}</b></div>`;
const f=document.getElementById("coForm"),rb=document.getElementById("reviewBox");if(rb&&f){const fd=new FormData(f);rb.innerHTML=`<div class="order"><b>${fd.get("name")||"—"}</b> • ${fd.get("phone")||"—"}<br><small>${fd.get("email")||"—"}</small></div><div class="order"><b>Deliver to:</b><br><small>${fd.get("address")||"—"}, ${fd.get("city")||"—"}, ${fd.get("state")||""}</small></div><div class="order"><b>${this.shipLabel(fd.get("ship"))}</b><br><small>ETA ${this.eta(fd.get("ship"))} • ${fd.get("pay")==="pod"?"Pay on delivery":"Card/Transfer (mock)"}</small></div>`;}
return {sub,disc,ship,total,coupon};
},
async validateCoupon(code){
const input=document.getElementById("coupon"),feedback=document.getElementById("couponFeedback");code=String(code??input?.value??"").trim().toUpperCase();
clearTimeout(this.couponTimer);
if(!code){this.couponStatus={code:"",valid:false,percentOff:0};if(feedback)feedback.textContent="";this.totals();return true;}
this.couponStatus={code,valid:false,percentOff:0};if(feedback)feedback.textContent="Checking coupon…";this.totals();
try{
 const result=await window.Api.validateCoupon(code,window.Store.subtotal());
 if(input?.value.trim().toUpperCase()!==code)return false;
 this.couponStatus={code,valid:!!result.valid,percentOff:Number(result.percentOff)||0};
 if(feedback)feedback.textContent=result.valid?`${code} applied: ${result.percentOff}% off.`:"Coupon rejected. It is unknown, inactive, expired, or below its minimum order value.";
 this.totals();return !!result.valid;
}catch(error){
 if(input?.value.trim().toUpperCase()!==code)return false;
 this.couponStatus={code,valid:false,percentOff:0};if(feedback)feedback.textContent="Could not verify this coupon. Please retry or remove it before continuing.";this.totals();return false;
}
},
async sendConfirmationEmail(order){
if(!window.Api.isLive())return {sent:false,demo:true};
const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),11000);
try{
 const response=await fetch("/api/send-order-confirmation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:order.id,recipient:order.email,name:order.name,total:order.total}),signal:controller.signal});
 const result=await response.json().catch(()=>null);
 return {sent:!!response.ok&&result?.ok===true,demo:false};
}catch{return {sent:false,demo:false};}
finally{clearTimeout(timeout);}
},
bind(){const form=document.getElementById("coForm");
form?.addEventListener("input",e=>{
 if(e.target?.id!=="coupon"){this.totals();return;}
 const code=e.target.value.trim().toUpperCase();this.couponStatus={code,valid:false,percentOff:0};clearTimeout(this.couponTimer);
 const feedback=document.getElementById("couponFeedback");if(feedback)feedback.textContent=code?"Checking coupon…":"";this.totals();
 if(code)this.couponTimer=setTimeout(()=>this.validateCoupon(code),350);
});
form?.addEventListener("click",e=>{const pick=e.target.closest("[data-pickaddr]");if(!pick)return;const a=window.Account.addrs()[+pick.dataset.pickaddr];if(!a)return;form.elements.namedItem("address").value=a.address||"";form.elements.namedItem("city").value=a.city||"";form.elements.namedItem("state").value=a.state||"Lagos";this.totals();});
form?.addEventListener("submit",async e=>{
  e.preventDefault();const S=window.Store,U=window.UI,err=document.getElementById("coErr");err.textContent="";
  if(!S.cartCount()){err.textContent="Your cart is empty.";return;}if(!form.checkValidity()){form.reportValidity();return;}
  const couponCode=form.elements.namedItem("coupon").value.trim();
  if(couponCode&&!await this.validateCoupon(couponCode)){err.textContent=document.getElementById("couponFeedback")?.textContent||"Coupon rejected.";return;}
  const fd=new FormData(form),t=this.totals(),shipV=fd.get("ship");
  const order={items:S.cartLines(),sub:t.sub,disc:t.disc,ship:t.ship,total:t.total,name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),address:fd.get("address"),city:fd.get("city"),state:fd.get("state"),note:fd.get("note"),shipOpt:shipV,shipLabel:this.shipLabel(shipV),eta:this.eta(shipV),pay:fd.get("pay"),payMock:true,coupon:t.coupon,status:"Processing"};
  try{
    if(fd.get("saveAddr")&&S.user&&!window.Account.addrs().some(a=>a.address===order.address&&a.city===order.city)){
      const savedAddress=await window.Api.addAddress({label:"Checkout",name:order.name,phone:order.phone,address:order.address,city:order.city,state:order.state,def:!window.Account.addrs().length});window.Account.addressRows.push(savedAddress);
    }
    const saved=await window.Api.createOrder(order);window._lastOrder=saved;S.clearCart();U.badges();
    document.getElementById("confirmMsg").textContent=`${saved.name}, your order ${saved.id} is confirmed. No real payment was taken.`;
    document.getElementById("cfNum").innerHTML=`<span class="ordernum">${this.esc(saved.id)}</span> <span class="pill">${this.esc(saved.status)}</span><br><small>${new Date(saved.date).toLocaleString()} • ${saved.pay==="pod"?"Pay on delivery":"Card/Transfer (mock)"}</small>`;
    document.getElementById("cfItems").innerHTML=saved.items.map(i=>`<div class="d-item"><img src="${this.esc(i.img)}" alt="${this.esc(i.n)}"><div><b style="font-size:.85rem">${this.esc(i.n)} × ${i.qty}</b></div><b>${U.fmtN(i.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*i.qty)}</b></div>`).join("");
    document.getElementById("cfShip").innerHTML=`${this.esc(saved.address)}, ${this.esc(saved.city)}, ${this.esc(saved.state)}<br><small>${this.esc(saved.shipLabel)} • ${this.esc(saved.phone)}${saved.note?` • Note: ${this.esc(saved.note)}`:""}</small>`;
    document.getElementById("cfEta").innerHTML=`<b>${this.esc(saved.eta)}</b><br><small>Standard free over ₦124,740</small>`;
    document.getElementById("cfTotal").innerHTML=`<div class="t-row"><span>Subtotal</span><b>${U.fmtN(saved.sub)}</b></div><div class="t-row"><span>Discount</span><span>−${U.fmtN(saved.disc)}</span></div><div class="t-row"><span>Shipping</span><span>${saved.ship===0?"Free":U.fmtN(saved.ship)}</span></div><div class="t-row grand"><span>Total (mock payment)</span><b>${U.fmtN(saved.total)}</b></div>`;
    const emailResult=await this.sendConfirmationEmail(saved),emailStatus=document.getElementById("confirmEmailStatus");
    if(emailStatus){emailStatus.dataset.status=emailResult.demo?"demo":emailResult.sent?"sent":"failed";emailStatus.textContent=emailResult.demo?"Demo order confirmed. No email was sent.":emailResult.sent?`Order confirmed. A confirmation email was sent to ${saved.email}.`:"Order confirmed, but the confirmation email could not be sent. Your order is still confirmed.";}
    document.getElementById("viewOrderBtn").href="#/account/orders/"+encodeURIComponent(saved.id);location.hash="#/confirm";
  }catch(error){if(/coupon/i.test(error.message||"")){const message="Coupon rejected. It is unknown, inactive, expired, or below its minimum order value.";document.getElementById("couponFeedback").textContent=message;err.textContent=message;}else err.textContent=error.message||"Could not place this order. Please try again.";}
});
},
showConfirm(){window.UI.badges();}
};
