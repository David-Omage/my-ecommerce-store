// Shared storefront state. Only the cart is kept in localStorage; account data
// and the auth session are managed by Supabase.
window.Store={
cart:JSON.parse(localStorage.getItem("ve_cart")||"{}"),
wish:[],
user:null,
save(){localStorage.setItem("ve_cart",JSON.stringify(this.cart));},
cartCount(){return Object.values(this.cart).reduce((a,b)=>a+b,0);},
cartLines(){return Object.entries(this.cart).map(([id,qty])=>{const p=window.MOCK_PRODUCTS.find(x=>x.id===+id);return p?{...p,qty}:null;}).filter(Boolean);},
subtotal(){const c=window.APP_CONFIG;const raw=this.cartLines().reduce((s,l)=>s+l.p*c.RATE*c.DISCOUNT*l.qty,0);return Math.round(raw*100)/100;},
add(id,q=1){this.cart[id]=(this.cart[id]||0)+q;this.save();},
setQty(id,q){if(q<=0)delete this.cart[id];else this.cart[id]=q;this.save();},
clearCart(){this.cart={};this.save();},
setUser(user){this.user=user||null;},
setWish(ids){this.wish=[...new Set((ids||[]).map(Number))];},
toggleWishLocal(id){id=+id;const i=this.wish.indexOf(id);if(i>=0)this.wish.splice(i,1);else this.wish.push(id);return this.wish.includes(id);},
isWished(id){return this.wish.includes(+id);}
};
