// Boot — wire modules, restore Supabase auth, render storefront and start router.
(async function(){
const dealRow=document.getElementById("dealRow");
if(dealRow)dealRow.innerHTML=window.MOCK_PRODUCTS.slice(8,13).map(p=>window.UI.card(p)).join("");
window.Shop.bind();window.Cart.bind();window.Account.bind();window.Checkout.bind();window.Router.bind();
window.Shop.render();window.UI.badges();window.Cart.render();
try{await window.Account.init();}catch(error){console.error("[VoltEdge] auth session restore failed:",error.message);window.UI.toast("Could not restore your Supabase session.");}
// Live data hydration — swaps MOCK for catalog rows when Supabase is configured.
window.Api.products().then(list=>{
  if(Array.isArray(list)&&list!==window.MOCK_PRODUCTS){window.MOCK_PRODUCTS=list;window.PRODUCTS=list;window.Shop.list=list;const dr=document.getElementById("dealRow");if(dr)dr.innerHTML=list.slice(8,13).map(p=>window.UI.card(p)).join("");window.Shop.render();window.UI.badges();window.Cart.render();}
}).catch(error=>console.warn("[VoltEdge] product hydration failed:",error.message));
let s=14*3600+32*60+10;setInterval(()=>{s=Math.max(0,s-1);const h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");const hh=document.getElementById("hh"),mm=document.getElementById("mm"),sx=document.getElementById("ss");if(hh)hh.textContent=h;if(mm)mm.textContent=m;if(sx)sx.textContent=ss;},1000);
window.Router.route();
})();
