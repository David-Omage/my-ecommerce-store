// Supabase client bootstrap — safe no-op until APP_CONFIG is filled.
// Loaded AFTER the supabase-js UMD <script> (window.supabase) and AFTER config.js.
// Exposes window.SB (client or null) and window.SB_READY (boolean).
(function(){
const c=window.APP_CONFIG||{};
window.SB=null;
window.SB_READY=false;
if(c.USE_SUPABASE&&c.SUPABASE_URL&&c.SUPABASE_ANON_KEY&&window.supabase&&window.supabase.createClient){
  try{
    window.SB=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);
    window.SB_READY=true;
    console.info("[VoltEdge] Supabase client ready:",c.SUPABASE_URL);
  }catch(e){console.warn("[VoltEdge] Supabase init failed:",e.message);}
}
if(!window.SB_READY)console.info("[VoltEdge] Supabase not configured — running on MOCK data.");
})();
