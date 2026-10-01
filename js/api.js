// Api layer — MOCK by default; live Supabase when APP_CONFIG.USE_SUPABASE=true.
// The app only depends on these methods + their return shapes, so switching data
// sources never touches the UI (ui.card / store / shop / checkout stay unchanged).
(function(){
const cfg=()=>window.APP_CONFIG||{};
const live=()=>!!(cfg().USE_SUPABASE&&window.SB_READY&&window.SB);

// "2100" -> "2.1k", "12000" -> "12k", "890" -> "890"
const kTxt=n=>{n=+n||0;return n>=1000?(Math.round(n/100)/10).toString().replace(/\.0$/,"")+"k":String(n);};
const ratingTxt=(r,c)=>r!=null?`${r}${c?` (${kTxt(c)})`:""}`:"";

// DB row (snake_case) -> app product shape {id,n,c,b,p,o,r,f,img}
function mapProduct(row){
  return {
    id:row.id,
    n:row.name,
    c:(row.categories&&row.categories.slug)||row.category||"",
    b:(row.brands&&row.brands.name)||row.brand||"",
    p:Number(row.price),
    o:Number(row.compare_at!=null?row.compare_at:row.price),
    r:ratingTxt(row.rating,row.rating_count),
    f:row.flag||"",
    img:row.image_url||""
  };
}
const PRODUCT_SELECT="id,name,price,compare_at,rating,rating_count,flag,image_url,slug,categories(slug),brands(name)";

window.Api={
  async products(){
    if(live()){
      try{
        const {data,error}=await window.SB.from("products").select(PRODUCT_SELECT).eq("is_active",true).order("id");
        if(!error&&data&&data.length)return data.map(mapProduct);
        if(error)console.warn("[VoltEdge] products() ->",error.message);
      }catch(e){console.warn("[VoltEdge] products() threw:",e.message);}
    }
    return window.MOCK_PRODUCTS;
  },
  async product(id){
    if(live()){
      try{
        const {data,error}=await window.SB.from("products").select(PRODUCT_SELECT).eq("id",id).maybeSingle();
        if(!error&&data)return mapProduct(data);
        if(error)console.warn("[VoltEdge] product() ->",error.message);
      }catch(e){console.warn("[VoltEdge] product() threw:",e.message);}
    }
    return window.MOCK_PRODUCTS.find(p=>p.id===+id);
  },
  // create_order RPC recomputes totals from catalog prices + coupon and writes
  // orders/order_items atomically, returning an app-shaped order object.
  async createOrder(order){
    if(live()){
      try{
        const {data,error}=await window.SB.rpc("create_order",{payload:order});
        if(!error&&data)return Array.isArray(data)?data[0]:data;
        if(error)console.warn("[VoltEdge] create_order ->",error.message);
      }catch(e){console.warn("[VoltEdge] create_order threw:",e.message);}
    }
    // Local fallback (mock) — mirrors the original behaviour.
    const orders=JSON.parse(localStorage.getItem("ve_orders")||"[]");
    order.id="VE-"+Date.now().toString().slice(-6);
    order.date=new Date().toISOString();
    orders.unshift(order);
    localStorage.setItem("ve_orders",JSON.stringify(orders));
    return order;
  },
  async orders(){
    // TODO(supabase): map orders+order_items rows to the app shape once auth/RLS
    // are wired. Until then orders stay local so the account UI keeps working.
    return JSON.parse(localStorage.getItem("ve_orders")||"[]");
  }
};
})();