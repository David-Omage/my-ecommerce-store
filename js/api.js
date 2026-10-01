// Api layer — swap MOCK branch for Supabase without touching UI.
// Supabase plan:
// products -> supabase.from('products').select('*')
// profiles/orders/wishlist -> supabase.from(...).select/insert/update + auth.getUser()
window.Api={
async products(){return window.MOCK_PRODUCTS;},
async product(id){return window.MOCK_PRODUCTS.find(p=>p.id===+id);},
async createOrder(order){
const orders=JSON.parse(localStorage.getItem("ve_orders")||"[]");
order.id="VE-"+Date.now().toString().slice(-6);
order.date=new Date().toISOString();
orders.unshift(order);
localStorage.setItem("ve_orders",JSON.stringify(orders));
return order;
},
async orders(){return JSON.parse(localStorage.getItem("ve_orders")||"[]");}
};