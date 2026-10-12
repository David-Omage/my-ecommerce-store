// Cross-device cart persistence for signed-in users. Anonymous carts stay local.
(function(){
const OWNER_KEY="ve_cart_user_id",PENDING_KEY="ve_cart_pending_merges",WRITE_KEY="ve_cart_pending_writes";
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function normalize(value){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Cart data is invalid; it was kept on this device.");
  const out={};
  for(const [id,qty] of Object.entries(value)){
    if(!/^\d+$/.test(id)||+id<1||!Number.isInteger(Number(qty))||Number(qty)<1||Number(qty)>99)throw new Error("Cart contains an invalid product or quantity; it was kept on this device.");
    out[String(+id)]=Number(qty);
  }
  return out;
}
function token(){if(window.crypto?.randomUUID)return window.crypto.randomUUID();return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16);});}
function readPending(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||"{}");}catch{return {};}}
function readWrites(){try{return JSON.parse(localStorage.getItem(WRITE_KEY)||"{}");}catch{return {};}}
function writeJournal(uid,previous,next){const all=readWrites(),entry=all[uid]||{};for(const id of new Set([...Object.keys(previous),...Object.keys(next)])){if(previous[id]!==next[id])entry[id]=next[id]||0;}all[uid]=entry;localStorage.setItem(WRITE_KEY,JSON.stringify(all));}
function overlayWrites(remote,entry){const out={...remote};for(const [id,qty] of Object.entries(entry||{})){if(qty===0)delete out[id];else out[id]=qty;}return out;}
function acknowledge(uid,snapshot){const all=readWrites(),entry=all[uid]||{};for(const [id,qty] of Object.entries(snapshot)){if(entry[id]===qty)delete entry[id];}if(Object.keys(entry).length)all[uid]=entry;else delete all[uid];localStorage.setItem(WRITE_KEY,JSON.stringify(all));}
async function ensurePending(userId,cart){
  const create=()=>{const all=readPending();if(!all[userId]&&Object.keys(cart).length){all[userId]={token:token(),cart};localStorage.setItem(PENDING_KEY,JSON.stringify(all));}return {all,pending:all[userId]||null};};
  if(navigator.locks?.request)return navigator.locks.request("voltedge-cart-merge-"+userId,create);
  return create();
}
function rowsToCart(rows){const out={};for(const row of rows||[]){const id=String(row.product_id),q=Number(row.quantity);if(!/^\d+$/.test(id)||+id<1||!Number.isInteger(q)||q<1||q>99)throw new Error("Supabase returned invalid cart data.");out[String(+id)]=q;}return out;}
function mergeDeltas(base,current,remote){const out={...remote},ids=new Set([...Object.keys(base),...Object.keys(current)]);for(const id of ids){const next=(out[id]||0)+(current[id]||0)-(base[id]||0);if(next<=0)delete out[id];else if(next>99)throw new Error("A cart quantity would exceed 99. Review the cart and retry.");else out[id]=next;}return out;}

window.CartSync={
  userId:null,ready:false,message:"Cart is saved on this device. Sign in to sync across devices.",error:false,
  generation:0,revision:0,channel:null,writeQueue:Promise.resolve(),writing:false,remoteDirty:false,timer:null,suppress:false,activation:null,
  setMessage(message,isError=false){this.message=message;this.error=isError;this.renderStatus();},
  renderStatus(){const el=document.getElementById("cartSyncStatus");if(!el)return;el.textContent=this.message;el.classList.toggle("error",this.error);el.classList.toggle("ok",!this.error&&this.ready);const retry=document.getElementById("cartSyncRetry");if(retry)retry.hidden=!(this.error&&this.userId);},
  applyLocal(cart){this.suppress=true;window.Store.cart=cart;window.Store.save();this.suppress=false;window.UI?.badges();window.Cart?.render();},
  localChanged(previous,next){if(this.suppress)return;this.revision++;if(!this.userId){this.setMessage("Cart is saved on this device. Sign in to sync across devices.");return;}writeJournal(this.userId,normalize(previous),normalize(next));if(!this.ready)return;this.enqueueWrite(previous,next);},
  async fetchCart(userId){const {data,error}=await window.SB.from("cart_items").select("product_id,quantity").eq("user_id",userId).is("deleted_at",null);if(error)throw error;return rowsToCart(data);},
  async persist(userId,previous,next){
    previous=normalize(previous);next=normalize(next);
    const ids=new Set([...Object.keys(previous),...Object.keys(next)]),upserts=[],deletes=[];
    for(const id of ids){if(previous[id]===next[id])continue;if(next[id])upserts.push({user_id:userId,product_id:Number(id),quantity:next[id],deleted_at:null});else deletes.push(Number(id));}
    if(upserts.length){const {error}=await window.SB.from("cart_items").upsert(upserts,{onConflict:"user_id,product_id"});if(error)throw error;}
    if(deletes.length){const {error}=await window.SB.from("cart_items").update({deleted_at:new Date().toISOString()}).eq("user_id",userId).in("product_id",deletes).is("deleted_at",null);if(error)throw error;}
  },
  enqueueWrite(previous,next){
    if(!this.ready||!this.userId)return;
    const uid=this.userId,gen=this.generation;
    const before=normalize(previous),after=normalize(next);
    this.writeQueue=this.writeQueue.catch(()=>{}).then(async()=>{
      if(!this.ready||uid!==this.userId||gen!==this.generation)return;
      this.writing=true;this.setMessage("Saving your cart…");
      try{await this.persist(uid,before,after);if(uid!==this.userId||gen!==this.generation)return;acknowledge(uid,Object.fromEntries([...new Set([...Object.keys(before),...Object.keys(after)])].map(id=>[id,after[id]||0])));this.setMessage("Cart synced.");}
      catch(error){if(uid===this.userId&&gen===this.generation)this.setMessage("Cart sync failed: "+(error.message||"Supabase error"),true);}
      finally{this.writing=false;if(this.remoteDirty){this.remoteDirty=false;void this.refresh(uid,gen);}}
    });
  },
  async refresh(uid,gen){
    if(!this.ready||uid!==this.userId||gen!==this.generation)return;
    if(this.writing){this.remoteDirty=true;return;}
    const revision=this.revision;
    try{const remote=await this.fetchCart(uid);if(!this.ready||uid!==this.userId||gen!==this.generation)return;if(revision!==this.revision)return;const journal=readWrites()[uid]||{};for(const [id,qty] of Object.entries(journal)){if((remote[id]||0)===qty)acknowledge(uid,{[id]:qty});}const remaining=readWrites()[uid]||{};const cart=overlayWrites(remote,remaining);this.applyLocal(cart);this.setMessage("Cart synced.");if(Object.keys(remaining).length)this.enqueueWrite(remote,cart);}
    catch(error){if(uid===this.userId&&gen===this.generation)this.setMessage("Could not refresh shared cart: "+(error.message||"Supabase error"),true);}
  },
  remoteChanged(uid,gen){if(!this.ready||uid!==this.userId||gen!==this.generation)return;if(this.writing){this.remoteDirty=true;return;}clearTimeout(this.timer);this.timer=setTimeout(()=>void this.refresh(uid,gen),60);},
  stop(){clearTimeout(this.timer);this.timer=null;if(this.channel){window.SB.removeChannel(this.channel);this.channel=null;}},
  async setUser(userId,force=false){
    userId=userId||null;
    if(this.activation){try{await this.activation;}catch{}}
    if(this.userId===userId&&this.ready&&!force)return;
    if(this.userId&&this.ready){try{await this.writeQueue;}catch{}}
    const previousUser=this.userId;this.generation++;const gen=this.generation;this.stop();this.ready=false;this.userId=userId;
    if(!userId){
      const owner=localStorage.getItem(OWNER_KEY);
      if(owner||previousUser){localStorage.removeItem(OWNER_KEY);this.applyLocal({});}
      this.setMessage("Cart is saved on this device. Sign in to sync across devices.");return;
    }
    const task=(async()=>{
      const owner=localStorage.getItem(OWNER_KEY),pendingAll=readPending(),pending=pendingAll[userId]||null;
      let base,start;
      if(owner===userId){base=pending?normalize(pending.cart):normalize(window.Store.cart);start=pending?base:normalize(window.Store.cart);}
      else if(owner){base=pending?normalize(pending.cart):{};start=base;this.applyLocal({...base});}
      else{base=pending?normalize(pending.cart):normalize(window.Store.cart);start=pending?base:normalize(window.Store.cart);}
      let activePending=pendingAll[userId]||null;
      if(!activePending&&owner!==userId&&Object.keys(base).length){const result=await ensurePending(userId,base);pendingAll=result.all;activePending=result.pending;}
      const channel=window.SB.channel("cart:"+userId+":"+gen).on("postgres_changes",{event:"INSERT",schema:"public",table:"cart_items",filter:"user_id=eq."+userId},()=>this.remoteChanged(userId,gen)).on("postgres_changes",{event:"UPDATE",schema:"public",table:"cart_items",filter:"user_id=eq."+userId},()=>this.remoteChanged(userId,gen));
      this.channel=channel;channel.subscribe(status=>{if(userId!==this.userId||gen!==this.generation)return;if(status==="SUBSCRIBED"&&this.ready)this.remoteChanged(userId,gen);if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")this.setMessage("Cart sync connection interrupted. Reconnecting…",true);});
      this.setMessage("Loading shared cart…");
      if(activePending){const items=Object.entries(normalize(activePending.cart)).map(([id,quantity])=>({product_id:Number(id),quantity}));const {error}=await window.SB.rpc("merge_guest_cart",{p_merge_id:activePending.token,p_items:items});if(error)throw error;}
      if(userId!==this.userId||gen!==this.generation)return;
      const remote=await this.fetchCart(userId);if(userId!==this.userId||gen!==this.generation)return;
      const current=normalize(window.Store.cart),journal=readWrites()[userId]||{};
      for(const [id,qty] of Object.entries(journal))if((remote[id]||0)===qty)acknowledge(userId,{[id]:qty});
      const merged=overlayWrites(mergeDeltas(start,current,remote),readWrites()[userId]||{});
      localStorage.setItem(OWNER_KEY,userId);
      if(activePending){delete pendingAll[userId];localStorage.setItem(PENDING_KEY,JSON.stringify(pendingAll));}
      this.ready=true;this.applyLocal(merged);this.setMessage("Cart synced.");
      if(!same(remote,merged)){writeJournal(userId,remote,merged);this.enqueueWrite(remote,merged);}
      // Cover writes that occurred between the initial query and channel readiness.
      this.remoteChanged(userId,gen);
    })().catch(error=>{if(userId===this.userId&&gen===this.generation){this.ready=false;this.setMessage("Shared cart unavailable: "+(error.message||"Supabase error"),true);}});
    this.activation=task;await task;if(this.activation===task)this.activation=null;
  },
  retry(){if(this.userId)void this.setUser(this.userId,true);},
  bind(){document.getElementById("cartSyncRetry")?.addEventListener("click",()=>this.retry());}
};
})();
