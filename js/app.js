// Boot — wire modules, render home grids, start router.
(function(){
const dealRow=document.getElementById("dealRow");
if(dealRow)dealRow.innerHTML=window.MOCK_PRODUCTS.slice(8,13).map(p=>window.UI.card(p)).join("");
window.Shop.bind();window.Cart.bind();window.Account.bind();window.Checkout.bind();window.Router.bind();
window.Shop.render();window.UI.badges();window.Cart.render();
// countdown (home deals)
let s=14*3600+32*60+10;setInterval(()=>{s=Math.max(0,s-1);
const h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");
const hh=document.getElementById("hh"),mm=document.getElementById("mm"),sx=document.getElementById("ss");
if(hh)hh.textContent=h;if(mm)mm.textContent=m;if(sx)sx.textContent=ss;},1000);
window.Router.route();
})();
