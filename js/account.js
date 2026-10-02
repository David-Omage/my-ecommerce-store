// Supabase-backed sign-in and account data.
window.Account={
tab:"overview",addressRows:[],authSubscription:null,sessionUserId:null,
esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));},
addrs(){return this.addressRows;},
async init(){
  if(!window.Api.isLive())return;
  const auth=window.SB.auth;
  const {data:{subscription}}=auth.onAuthStateChange((event,session)=>{
    setTimeout(()=>this.syncSession(session,event),0);
  });
  this.authSubscription=subscription;
  const {data,error}=await auth.getSession();
  if(error)throw error;
  await this.syncSession(data.session,"INITIAL_SESSION",true);
},
async syncSession(session,event,force=false){
  const authUser=session?.user||null;
  if(!authUser){
    this.sessionUserId=null;window.Store.setUser(null);window.Store.setWish([]);this.addressRows=[];
    const sign=document.getElementById("signinBtn");if(sign)sign.textContent="Sign in";
    window.UI?.badges();if(event==="SIGNED_OUT"&&location.hash.startsWith("#/account"))location.hash="#/";return;
  }
  if(this.sessionUserId===authUser.id&&!force&&event!=="USER_UPDATED"){
    if(window.Store.user)window.Store.setUser({...window.Store.user,email:authUser.email||""});
    if(event==="SIGNED_IN")location.hash="#/account";
    return;
  }
  this.sessionUserId=authUser.id;
  const meta=authUser.user_metadata||{};
  let profile={id:authUser.id,full_name:meta.full_name||meta.name||"",phone:meta.phone||""};
  window.Store.setUser({id:authUser.id,email:authUser.email||"",name:profile.full_name,phone:profile.phone});
  const sign=document.getElementById("signinBtn");if(sign)sign.textContent="Hi, "+(profile.full_name||authUser.email||"there").split(" ")[0];
  try{
    const [savedProfile,addresses,wish]=await Promise.all([window.Api.profile(authUser.id),window.Api.addresses(),window.Api.wishlists()]);
    profile=savedProfile||profile;
    this.addressRows=addresses;window.Store.setWish(wish);
    window.Store.setUser({id:authUser.id,email:authUser.email||"",name:profile.full_name||authUser.email||"",phone:profile.phone||""});
  }catch(error){
    console.error("[VoltEdge] account data load failed:",error.message);
    window.UI.toast("Signed in, but account data could not be loaded.");
  }
  const label=document.getElementById("signinBtn");if(label)label.textContent="Hi, "+(window.Store.user.name||window.Store.user.email).split(" ")[0];
  window.UI.badges();
  if(location.hash.startsWith("#/account"))this.renderPage(location.hash.match(/^#\/account\/orders\/(.+)$/)?.[1]||location.hash.replace(/^#\/account\/?/,"")||"overview");
  if(event==="SIGNED_IN")location.hash="#/account";
},
openAuth(){
  const U=window.UI,S=window.Store;
  if(S.user){location.hash="#/account";return;}
  if(!window.Api.isLive()){
    U.sheet("Sign in unavailable",'<p class="hint">Connect this app to Supabase to enable sign-in.</p>');return;
  }
  U.sheet("Sign in or create an account",`<form id="authForm" class="co-form"><input name="name" placeholder="Full name (for new accounts)" autocomplete="name" /><input name="phone" placeholder="Phone (optional)" autocomplete="tel" /><input name="email" type="email" required placeholder="Email" autocomplete="email" /><button class="btn btn-primary" type="submit">Email me a sign-in link →</button><button class="btn btn-ghost" type="button" id="googleSignIn">Continue with Google</button><small class="hint" id="authMsg">We’ll email you a secure sign-in link.</small></form>`);
  document.getElementById("authForm").addEventListener("submit",async e=>{
    e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const msg=document.getElementById("authMsg");
    const email=String(f.get("email")||"").trim();
    msg.textContent="Sending sign-in link…";
    try{const {error}=await window.SB.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,data:{full_name:String(f.get("name")||"").trim(),phone:String(f.get("phone")||"").trim()}}});if(error)throw error;msg.textContent="Check your inbox for the sign-in link. You can close this window after opening it.";}catch(error){msg.textContent=error.message||"Could not send the sign-in link.";}
  });
  document.getElementById("googleSignIn").addEventListener("click",async()=>{
    try{const {error}=await window.SB.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error)throw error;}catch(error){document.getElementById("authMsg").textContent=error.message||"Google sign-in could not start.";}
  });
},
async toggleWish(id){
  if(!window.Store.user){this.openAuth();return false;}
  const on=window.Store.toggleWishLocal(id);window.UI.badges();
  try{if(on)await window.Api.addWish(id);else await window.Api.removeWish(id);this.renderWish();return on;}
  catch(error){window.Store.toggleWishLocal(id);window.UI.badges();window.UI.toast(error.message||"Wishlist update failed.");throw error;}
},
openWish(){
  if(!window.Store.user){this.openAuth();return;}
  const U=window.UI;const items=window.Store.wish.map(id=>window.MOCK_PRODUCTS.find(p=>p.id===+id)).filter(Boolean);
  U.sheet("Wishlist ("+items.length+")",items.length?items.map(p=>`<div class="d-item"><img src="${p.img}" alt="${this.esc(p.n)}"><div><b style="font-size:.9rem">${this.esc(p.n)}</b><br><small>${U.moneyUSD(p.p)}</small></div><div style="display:grid;gap:6px"><button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button><button class="btn btn-ghost btn-sm" data-wish="${p.id}">Remove</button></div></div>`).join(""):'<p class="hint">No saved items yet. Tap ♡ on any product.</p>');
},
renderWish(){
  const box=document.getElementById("acctWish");if(!box)return;const U=window.UI;
  box.innerHTML=window.Store.wish.length?window.Store.wish.map(id=>{const p=window.MOCK_PRODUCTS.find(x=>x.id===+id);return p?`<div class="d-item"><img src="${p.img}" alt="${this.esc(p.n)}"><div><b style="font-size:.85rem">${this.esc(p.n)}</b><br><small>${U.moneyUSD(p.p)}</small></div><div style="display:grid;gap:6px"><button class="btn btn-primary btn-sm" data-add="${p.id}">Add</button><button class="btn btn-ghost btn-sm" data-wish="${p.id}">Remove</button></div></div>`:"";}).join(""):'<p class="hint">Empty — tap ♡ to save.</p>';
},
renderAddrs(){
  const box=document.getElementById("addrList");if(!box)return;const list=this.addrs();
  box.innerHTML=list.length?list.map((a,i)=>`<div class="order"><b>${this.esc(a.label||"Address "+(i+1))}</b> ${a.def?'<span class="pill">Default</span>':''}<br><small>${this.esc(a.address)}, ${this.esc(a.city)}, ${this.esc(a.state)}</small><br><button class="btn btn-ghost btn-sm" data-addrdef="${a.id}">Default</button> <button class="btn btn-ghost btn-sm" data-addrdel="${a.id}">Delete</button></div>`).join(""):'<p class="hint">No saved addresses yet.</p>';
},
setTab(t){this.tab=t;document.querySelectorAll("#acctTabs .chip").forEach(c=>c.classList.toggle("active",c.dataset.tab===t));document.getElementById("acctOverview").style.display=t==="overview"?"":"none";["info","addresses","wishlist","orders"].forEach(k=>document.getElementById("pane-"+k).hidden=k!==t);document.getElementById("acctCrumb").textContent="/ "+t;},
async renderPage(sub){
  const S=window.Store,U=window.UI;
  this.setTab(sub&&["info","addresses","wishlist","orders"].includes(sub)?sub:(sub&&sub.startsWith("VE-")?"orders":this.tab||"overview"));
  if(!S.user){document.getElementById("acctTitle").textContent="Sign in required";document.getElementById("acctStats").innerHTML='<button class="btn btn-primary" id="goLogin">Sign in →</button>';document.getElementById("goLogin")?.addEventListener("click",()=>this.openAuth());document.getElementById("acctRecent").textContent="—";document.getElementById("acctOrders").textContent="Sign in to see orders.";this.renderWish();this.renderAddrs();return;}
  document.getElementById("acctTitle").textContent="Hi, "+(S.user.name||S.user.email).split(" ")[0];
  const f=document.getElementById("infoForm");f.elements.namedItem("name").value=S.user.name||"";f.elements.namedItem("email").value=S.user.email||"";f.elements.namedItem("phone").value=S.user.phone||"";
  this.renderWish();this.renderAddrs();
  try{
    const orders=await window.Api.orders();
    document.getElementById("acctStats").innerHTML=`<b>${this.esc(S.user.name)}</b><br><small>${this.esc(S.user.email)}<br>${this.esc(S.user.phone)}</small><br><br><span class="pill">${orders.length} orders</span> <span class="pill">${S.wish.length} wishlist</span> <span class="pill">${this.addrs().length} addresses</span>`;
    document.getElementById("acctRecent").innerHTML=orders[0]?`<b>${this.esc(orders[0].id)}</b> • ${U.fmtN(orders[0].total)}<br><small>${new Date(orders[0].date).toLocaleString()}</small><br><a href="#/account/orders/${encodeURIComponent(orders[0].id)}" style="color:var(--brand-600);font-weight:700">View →</a>`:"No orders yet.";
    document.getElementById("acctOrders").innerHTML=orders.length?orders.map(o=>`<div class="order"><b>${this.esc(o.id)}</b> • ${new Date(o.date).toLocaleDateString()} • ${o.items.length} items • <b>${U.fmtN(o.total)}</b> • <span class="pill">${this.esc(o.status)}</span><br><small>${this.esc(o.name)} • ${this.esc(o.city)}, ${this.esc(o.state)} • ${this.esc(o.shipLabel)}</small><br><a href="#/account/orders/${encodeURIComponent(o.id)}" style="color:var(--brand-600);font-weight:700">View details →</a></div>`).join(""):'No orders yet.';
    const det=sub&&sub.startsWith("VE-")?sub:null;const od=document.getElementById("orderDetail");
    if(det){const o=orders.find(x=>x.id===det);od.hidden=false;od.innerHTML=o?`<h4>Order ${this.esc(o.id)}</h4>`+o.items.map(i=>`<div class="d-item"><img src="${i.img}" alt="${this.esc(i.n)}"><div><b style="font-size:.85rem">${this.esc(i.n)} × ${i.qty}</b></div><b>${U.fmtN(i.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*i.qty)}</b></div>`).join("")+`<div class="t-row"><span>Subtotal</span><b>${U.fmtN(o.sub)}</b></div><div class="t-row"><span>Shipping (${this.esc(o.shipLabel)})</span><span>${U.fmtN(o.ship)}</span></div><div class="t-row grand"><span>Total</span><b>${U.fmtN(o.total)}</b></div><small>Deliver to ${this.esc(o.address)}, ${this.esc(o.city)}, ${this.esc(o.state)} • ETA ${this.esc(o.eta)}</small>`:'Order not found.';}else od.hidden=true;
  }catch(error){window.UI.toast("Could not load orders: "+(error.message||"Supabase error"));}
},
bind(){
  document.getElementById("accountBtn")?.addEventListener("click",()=>this.openAuth());document.getElementById("signinBtn")?.addEventListener("click",()=>this.openAuth());
  document.getElementById("sheetClose")?.addEventListener("click",()=>window.UI.closeSheet());document.getElementById("sheet")?.addEventListener("click",e=>{if(e.target.id==="sheet")window.UI.closeSheet();});
  document.getElementById("logoutBtn")?.addEventListener("click",async()=>{if(!window.Api.isLive())return;try{const {error}=await window.SB.auth.signOut({scope:"local"});if(error)throw error;location.hash="#/";window.UI.toast("Signed out");}catch(error){window.UI.toast(error.message||"Could not sign out.");}});
  document.getElementById("acctTabs")?.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)this.setTab(b.dataset.tab);});
  document.getElementById("infoForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);try{const profile=await window.Api.saveProfile({full_name:f.get("name"),phone:f.get("phone")});const nextEmail=String(f.get("email")||"").trim();if(nextEmail&&nextEmail!==window.Store.user.email){const {error}=await window.SB.auth.updateUser({email:nextEmail});if(error)throw error;window.UI.toast("Profile saved. Confirm the email change from your inbox.");}else window.UI.toast("Profile saved ✓");window.Store.setUser({...window.Store.user,name:profile.full_name,phone:profile.phone});this.renderPage();}catch(error){window.UI.toast(error.message||"Could not save profile.");}});
  document.getElementById("addrForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);try{const row=await window.Api.addAddress({label:f.get("label"),name:f.get("name"),phone:f.get("phone"),address:f.get("address"),city:f.get("city"),state:f.get("state"),def:!this.addrs().length});this.addressRows.push(row);e.target.reset();this.renderAddrs();window.UI.toast("Address saved ✓");}catch(error){window.UI.toast(error.message||"Could not save address.");}});
  document.addEventListener("click",async e=>{
    const d=e.target.closest("[data-addrdef]");if(d){try{await window.Api.setDefaultAddress(d.dataset.addrdef);this.addressRows=this.addressRows.map(a=>({...a,def:String(a.id)===d.dataset.addrdef}));this.renderAddrs();}catch(error){window.UI.toast(error.message||"Could not update address.");}}
    const x=e.target.closest("[data-addrdel]");if(x){try{await window.Api.deleteAddress(x.dataset.addrdel);this.addressRows=this.addressRows.filter(a=>String(a.id)!==x.dataset.addrdel);if(this.addressRows.length&&!this.addressRows.some(a=>a.def)){await window.Api.setDefaultAddress(this.addressRows[0].id);this.addressRows[0].def=true;}this.renderAddrs();}catch(error){window.UI.toast(error.message||"Could not delete address.");}}
  });
}
};
