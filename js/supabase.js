// Supabase client bootstrap — safe no-op until APP_CONFIG is filled.
// Loaded AFTER the supabase-js UMD <script> (window.supabase) and AFTER config.js.
// Exposes window.SB (client or null) and window.SB_READY (boolean).
(function(){
const c=window.APP_CONFIG||{};
const env=Object.assign({},window.__ENV__||{},window.ENV||{});
window.SB=null;
window.SB_READY=false;
window.SUPABASE_ERROR=null;
const explicitlyDisabled=env.USE_SUPABASE!=null&&String(env.USE_SUPABASE)==="false";
const hasAnyConfig=!!(env.SUPABASE_URL||env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY);
const reportError=message=>{window.SUPABASE_ERROR=message;console.warn("[VoltEdge] "+message);};

if(explicitlyDisabled){
  console.info("[VoltEdge] Supabase disabled — running on MOCK data.");
  return;
}
if(!c.USE_SUPABASE){
  if(env.USE_SUPABASE!=null||hasAnyConfig)reportError("Supabase is enabled or partially configured, but its browser configuration is incomplete.");
  else console.info("[VoltEdge] Supabase not configured — running on MOCK data.");
  return;
}
if(!window.supabase){reportError("Supabase SDK did not load.");return;}
if(typeof window.supabase.createClient!=="function"){reportError("Supabase SDK does not expose createClient.");return;}

try{
  const client=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);
  if(!client)throw new Error("empty Supabase client");
  window.SB=client;
  window.SB_READY=true;
  console.info("[VoltEdge] Supabase client ready.");
}catch{
  reportError("Supabase client initialization failed. Check the browser-safe URL/key configuration and SDK version.");
}
})();
