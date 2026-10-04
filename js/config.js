// VoltEdge config — single place for env-like settings.
// Live Supabase credentials are injected at build time by scripts/build-env.mjs
// into js/env.js (git-ignored) as window.__ENV__, so no key is ever committed.
// Everything downstream (js/supabase.js, js/api.js, the UI) keeps reading the
// same window.APP_CONFIG shape — only the source of the two Supabase values moved.
// With no credentials present the app stays 100% on MOCK data.
(function(){
  var env=Object.assign({},window.__ENV__||{},window.ENV||{});
  var url=env.SUPABASE_URL||"";
  var key=env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY||"";
  // USE_SUPABASE is explicit when set, otherwise auto-on once both values exist.
  var use=env.USE_SUPABASE!=null?String(env.USE_SUPABASE)!=="false":!!(url&&key);
  window.APP_CONFIG={RATE:1400,DISCOUNT:0.9,PER:8,FREE_SHIP:124740,STANDARD_SHIP:4410,
    standardShipping(subtotal){return Number(subtotal)>=this.FREE_SHIP?0:this.STANDARD_SHIP;},
    SUPABASE_URL:url,SUPABASE_ANON_KEY:key,USE_SUPABASE:!!(use&&url&&key)};
})();
