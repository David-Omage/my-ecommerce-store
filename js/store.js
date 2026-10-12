// Shared storefront state. Only the cart is kept in localStorage; account data
// and the auth session are managed by Supabase.
window.Store={
cart:JSON.parse(localStorage.getItem("ve_cart")||"{}"),
wish:[],
user:null,
save(previous={}){localStorage.setItem("ve_cart",JSON.stringify(this.cart));window.CartSync?.localChanged(previous,{...this.cart});},
cartCount(){return Object.values(this.cart).reduce((a,b)=>a+b,0);},
cartLines(){return Object.entries(this.cart).map(([id,qty])=>{const p=window.MOCK_PRODUCTS.find(x=>x.id===+id);return p?{...p,qty}:null;}).filter(Boolean);},
subtotal(){const c=window.APP_CONFIG;const raw=this.cartLines().reduce((s,l)=>s+l.p*c.RATE*c.DISCOUNT*l.qty,0);return Math.round(raw*100)/100;},
add(id,q=1){if(this.user&&!window.CartSync?.ready){window.UI?.toast("Your shared cart is still loading. Try again shortly.");return;}id=String(id);q=Number(q);if(!/^\d+$/.test(id)||+id<1||!Number.isInteger(q)||q<1)return;this.setQty(id,Number(this.cart[id]||0)+q);},
setQty(id,q){if(this.user&&!window.CartSync?.ready){window.UI?.toast("Your shared cart is still loading. Try again shortly.");return;}id=String(id);q=Number(q);if(!/^\d+$/.test(id)||+id<1||!Number.isInteger(q))return;if(q>99){window.UI?.toast("You can add up to 99 of one product.");return;}const previous={...this.cart};if(q<=0)delete this.cart[id];else this.cart[id]=q;this.save(previous);},
clearCart(){const previous={...this.cart};this.cart={};this.save(previous);},
setUser(user){this.user=user||null;},
setWish(ids){this.wish=[...new Set((ids||[]).map(Number))];},
toggleWishLocal(id){id=+id;const i=this.wish.indexOf(id);if(i>=0)this.wish.splice(i,1);else this.wish.push(id);return this.wish.includes(id);},
isWished(id){return this.wish.includes(+id);}
};
