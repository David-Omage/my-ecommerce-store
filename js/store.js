// Central store — single source of truth, persisted to localStorage.
// Keys: ve_cart {id:qty}, ve_wish [ids], ve_user {name,email,phone,...}
window.Store={
cart:JSON.parse(localStorage.getItem("ve_cart")||"{}"),
wish:JSON.parse(localStorage.getItem("ve_wish")||"[]"),
user:JSON.parse(localStorage.getItem("ve_user")||"null"),
save(){localStorage.setItem("ve_cart",JSON.stringify(this.cart));localStorage.setItem("ve_wish",JSON.stringify(this.wish));if(this.user)localStorage.setItem("ve_user",JSON.stringify(this.user));else localStorage.removeItem("ve_user");},
cartCount(){return Object.values(this.cart).reduce((a,b)=>a+b,0);},
cartLines(){return Object.entries(this.cart).map(([id,qty])=>{const p=window.MOCK_PRODUCTS.find(x=>x.id===+id);return p?{...p,qty}:null;}).filter(Boolean);},
subtotal(){const c=window.APP_CONFIG;return this.cartLines().reduce((s,l)=>s+l.p*c.RATE*c.DISCOUNT*l.qty,0);},
add(id,q=1){this.cart[id]=(this.cart[id]||0)+q;this.save();},
setQty(id,q){if(q<=0)delete this.cart[id];else this.cart[id]=q;this.save();},
clearCart(){this.cart={};this.save();},
toggleWish(id){id=+id;const i=this.wish.indexOf(id);if(i>=0)this.wish.splice(i,1);else this.wish.push(id);this.save();return this.wish.includes(id);},
isWished(id){return this.wish.includes(+id);},
login(u){this.user=u;this.save();},
logout(){this.user=null;localStorage.removeItem("ve_user");}
};