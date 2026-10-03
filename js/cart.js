// Cart drawer — qty steppers, remove, totals, free-ship progress.
window.Cart={
render(){const S=window.Store,U=window.UI;const lines=S.cartLines();
document.getElementById("drawerTitle").textContent=`Your cart (${S.cartCount()})`;
const box=document.getElementById("dItems");
box.innerHTML=lines.length?lines.map(l=>`<div class="d-item"><img src="${l.img}" alt="${l.n}"><div><b style="font-size:.9rem">${l.n}</b><br><small style="color:#64748B">${U.moneyUSD(l.p)} each</small><div class="qty"><button data-dec="${l.id}">−</button><b>${l.qty}</b><button data-inc="${l.id}">+</button><button class="link" data-rm="${l.id}">Remove</button></div></div><b>${U.fmtN(l.p*window.APP_CONFIG.RATE*window.APP_CONFIG.DISCOUNT*l.qty)}</b></div>`).join(""):`<div style="text-align:center;padding:24px;color:var(--muted)">Cart is empty.<br><a href="#/shop" style="color:var(--brand-600);font-weight:700">Browse products →</a></div>`;
const sub=S.subtotal(),FREE=window.APP_CONFIG.FREE_SHIP;const ship=sub===0?0:window.APP_CONFIG.standardShipping(sub);
document.getElementById("dFoot").innerHTML=`<div class="ship-bar"><div style="width:${Math.min(100,Math.round(sub/FREE*100))}%"></div></div><small style="color:var(--muted)">${sub>=FREE?"🎉 Free standard shipping unlocked":`Add ${U.fmtN(FREE-sub)} for free shipping`}</small><div style="display:flex;justify-content:space-between"><span>Subtotal</span><b>${U.fmtN(sub)}</b></div><div style="display:flex;justify-content:space-between;color:var(--muted);font-size:.9rem"><span>Shipping</span><span>${ship===0?"Free":U.fmtN(ship)}</span></div><button class="btn btn-primary" id="goCheckout">Checkout →</button><button class="btn btn-ghost" id="contShop">Continue shopping</button>`;
document.getElementById("goCheckout")?.addEventListener("click",()=>{U.closeDrawer();location.hash="#/checkout";});
document.getElementById("contShop")?.addEventListener("click",()=>U.closeDrawer());U.badges();
},
bind(){const S=window.Store,U=window.UI;
document.addEventListener("click",async e=>{
const a=e.target.closest("[data-add]");if(a){S.add(a.dataset.add,1);U.badges();this.render();U.toast(`Added to cart ✓ (${S.cartCount()})`);return;}
const w=e.target.closest("[data-wish]");if(w){try{const on=await window.Account.toggleWish(w.dataset.wish);if(!S.user)return;document.querySelectorAll(`[data-wish="${w.dataset.wish}"]`).forEach(b=>{b.textContent=on?"♥":"♡";b.classList.toggle("on",on)});U.toast(on?"Saved to wishlist ♥":"Removed from wishlist");window.Account.renderWish();}catch{}return;}
const inc=e.target.closest("[data-inc]");if(inc){S.setQty(inc.dataset.inc,(S.cart[inc.dataset.inc]||0)+1);this.render();return;}
const dec=e.target.closest("[data-dec]");if(dec){S.setQty(dec.dataset.dec,(S.cart[dec.dataset.dec]||0)-1);this.render();return;}
const rm=e.target.closest("[data-rm]");if(rm){S.setQty(rm.dataset.rm,0);this.render();return;}
});
document.getElementById("cartBtn")?.addEventListener("click",()=>U.openDrawer());document.getElementById("closeDrawer")?.addEventListener("click",()=>U.closeDrawer());document.getElementById("overlay")?.addEventListener("click",()=>U.closeDrawer());
document.querySelectorAll("[data-mnav]").forEach(b=>b.addEventListener("click",()=>{const m=b.dataset.mnav;if(m==="home")location.hash="#/";else if(m==="shop")location.hash="#/shop";else if(m==="cart")U.openDrawer();else if(m==="wish")window.Account.openWish();else if(m==="you")location.hash="#/account";}));
document.getElementById("wishBtn")?.addEventListener("click",()=>window.Account.openWish());
}
};
