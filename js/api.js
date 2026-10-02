// Supabase data access. Account data is always scoped by the existing RLS
// policies; the UI never supplies a user_id for writes.
(function(){
const cfg=()=>window.APP_CONFIG||{};
const live=()=>!!(cfg().USE_SUPABASE&&window.SB_READY&&window.SB);
const requireUser=()=>{
  const user=window.Store.user;
  if(!live()||!user?.id)throw new Error("Sign in to use your account.");
  return user;
};
const fail=error=>{if(error)throw error;};
const kTxt=n=>{n=+n||0;return n>=1000?(Math.round(n/100)/10).toString().replace(/\.0$/ ,"")+"k":String(n);};
const ratingTxt=(r,c)=>r!=null?`${r}${c?` (${kTxt(c)})`:""}`:"";
function mapProduct(row){return {id:row.id,n:row.name,c:(row.categories&&row.categories.slug)||row.category||"",b:(row.brands&&row.brands.name)||row.brand||"",p:Number(row.price),o:Number(row.compare_at!=null?row.compare_at:row.price),r:ratingTxt(row.rating,row.rating_count),f:row.flag||"",img:row.image_url||""};}
const PRODUCT_SELECT="id,name,price,compare_at,rating,rating_count,flag,image_url,slug,categories(slug),brands(name)";
function mapOrder(row){
  const items=(row.order_items||[]).map(i=>({id:i.product_id,n:i.name,img:i.products?.image_url||"",p:Number(i.unit_price),qty:Number(i.qty)}));
  return {id:row.order_no,date:row.created_at,status:row.status,items,sub:Number(row.subtotal),disc:Number(row.discount),ship:Number(row.shipping),total:Number(row.total),name:row.contact_name,email:row.email,phone:row.phone,address:row.address,city:row.city,state:row.state,note:row.note,shipOpt:row.ship_opt,shipLabel:row.ship_label,eta:row.eta,pay:row.pay_method,coupon:row.coupon};
}
const ORDER_SELECT="id,order_no,email,contact_name,phone,address,city,state,note,ship_opt,ship_label,eta,pay_method,coupon,subtotal,discount,shipping,total,status,created_at,order_items(id,product_id,name,unit_price,qty,line_total,products(image_url))";

window.Api={
  isLive:live,
  async products(){if(live()){const {data,error}=await window.SB.from("products").select(PRODUCT_SELECT).eq("is_active",true).order("id");if(error)throw error;if(data?.length)return data.map(mapProduct);}return window.MOCK_PRODUCTS;},
  async product(id){if(live()){const {data,error}=await window.SB.from("products").select(PRODUCT_SELECT).eq("id",id).maybeSingle();if(error)throw error;if(data)return mapProduct(data);}return window.MOCK_PRODUCTS.find(p=>p.id===+id);},
  async profile(userId){requireUser();const {data,error}=await window.SB.from("profiles").select("id,full_name,phone").eq("id",userId).maybeSingle();fail(error);return data;},
  async saveProfile(profile){const user=requireUser();const {data,error}=await window.SB.from("profiles").upsert({id:user.id,full_name:profile.full_name||"",phone:profile.phone||""},{onConflict:"id"}).select("id,full_name,phone").single();fail(error);return data;},
  async addresses(){const user=requireUser();const {data,error}=await window.SB.from("addresses").select("id,label,recipient,phone,line1,city,state,is_default,created_at").eq("user_id",user.id).order("created_at");fail(error);return (data||[]).map(a=>({id:a.id,label:a.label||"",name:a.recipient||"",phone:a.phone||"",address:a.line1,city:a.city,state:a.state,def:a.is_default}));},
  async addAddress(a){const user=requireUser();const {data,error}=await window.SB.from("addresses").insert({user_id:user.id,label:a.label||"",recipient:a.name||user.name||"",phone:a.phone||user.phone||"",line1:a.address,city:a.city,state:a.state,is_default:!!a.def}).select("id,label,recipient,phone,line1,city,state,is_default").single();fail(error);return {id:data.id,label:data.label,name:data.recipient,phone:data.phone,address:data.line1,city:data.city,state:data.state,def:data.is_default};},
  async updateAddress(id,updates){const user=requireUser();const row={};if("label" in updates)row.label=updates.label;if("name" in updates)row.recipient=updates.name;if("phone" in updates)row.phone=updates.phone;if("address" in updates)row.line1=updates.address;if("city" in updates)row.city=updates.city;if("state" in updates)row.state=updates.state;if("def" in updates)row.is_default=updates.def;const {error}=await window.SB.from("addresses").update(row).eq("id",id).eq("user_id",user.id);fail(error);},
  async setDefaultAddress(id){const user=requireUser();const {error:clearError}=await window.SB.from("addresses").update({is_default:false}).eq("user_id",user.id);fail(clearError);const {error}=await window.SB.from("addresses").update({is_default:true}).eq("id",id).eq("user_id",user.id);fail(error);},
  async deleteAddress(id){const user=requireUser();const {error}=await window.SB.from("addresses").delete().eq("id",id).eq("user_id",user.id);fail(error);},
  async wishlists(){const user=requireUser();const {data,error}=await window.SB.from("wishlists").select("product_id").eq("user_id",user.id);fail(error);return (data||[]).map(x=>x.product_id);},
  async addWish(id){const user=requireUser();const {error}=await window.SB.from("wishlists").upsert({user_id:user.id,product_id:+id},{onConflict:"user_id,product_id",ignoreDuplicates:true});fail(error);},
  async removeWish(id){const user=requireUser();const {error}=await window.SB.from("wishlists").delete().eq("user_id",user.id).eq("product_id",+id);fail(error);},
  async createOrder(order){
    if(live()){
      const payload={...order,items:order.items.map(i=>({id:i.id,qty:i.qty}))};
      const {data,error}=await window.SB.rpc("create_order",{payload});fail(error);
      return Array.isArray(data)?data[0]:data;
    }
    const orders=JSON.parse(localStorage.getItem("ve_orders")||"[]");order.id="VE-"+Date.now().toString().slice(-6);order.date=new Date().toISOString();orders.unshift(order);localStorage.setItem("ve_orders",JSON.stringify(orders));return order;
  },
  async orders(){
    if(live()){
      if(!window.Store.user?.id)return [];
      const {data,error}=await window.SB.from("orders").select(ORDER_SELECT).order("created_at",{ascending:false});fail(error);return (data||[]).map(mapOrder);
    }
    return JSON.parse(localStorage.getItem("ve_orders")||"[]");
  }
};
})();
