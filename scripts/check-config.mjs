#!/usr/bin/env node
// scripts/check-config.mjs
// Offline self-test of the env -> config -> client wiring. Proves that:
//   * the app constants are untouched,
//   * an empty environment keeps the app on MOCK,
//   * a configured environment flips it LIVE and maps the publishable key,
//   * supabase.js still creates the client, and stays a safe no-op if the CDN
//     script is unavailable.
// No network access required.
//
//   node scripts/check-config.mjs
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./load-env.mjs";
import { join } from "node:path";

const read = (p) => fs.readFileSync(p, "utf8");
const run = (ctx, code) => vm.runInContext(code, ctx);

function boot(envLiteral, opts = {}){
  const ctx = { window: {}, console: { info(){}, warn(){} } };
  vm.createContext(ctx);
  if (envLiteral !== undefined) run(ctx, `window.__ENV__=${JSON.stringify(envLiteral)};`);
  else run(ctx, read(join(ROOT, "js", "env.js")));
  run(ctx, read(join(ROOT, "js", "config.js")));
  if (opts.supabaseJs){
    let calledWith = null;
    if (!opts.noSdk) ctx.window.supabase = { createClient: (u, k) => { calledWith = [u, k]; return { __client: true }; } };
    run(ctx, read(join(ROOT, "js", "supabase.js")));
    return { cfg: ctx.window.APP_CONFIG, ready: ctx.window.SB_READY, sb: ctx.window.SB, calledWith };
  }
  return { cfg: ctx.window.APP_CONFIG };
}

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

const url = "https://demo-ref.supabase.co", key = "sb_publishable_ABC123";

// A) nothing configured -> MOCK, constants unchanged
const a = boot({}).cfg;
eq("A constants preserved", [a.RATE, a.DISCOUNT, a.PER, a.FREE_SHIP], [1400, 0.9, 8, 124740]);
eq("A MOCK: USE_SUPABASE=false", a.USE_SUPABASE, false);
eq("A MOCK: url empty", a.SUPABASE_URL, "");

// B) configured -> LIVE, key mapped onto the field the rest of the app reads
const b = boot({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key }, { supabaseJs: true });
eq("B LIVE: USE_SUPABASE=true", b.cfg.USE_SUPABASE, true);
eq("B LIVE: url passed through", b.cfg.SUPABASE_URL, url);
eq("B LIVE: publishable key -> SUPABASE_ANON_KEY", b.cfg.SUPABASE_ANON_KEY, key);
eq("B LIVE: supabase.js SB_READY", b.ready, true);
eq("B LIVE: createClient(url,key)", b.calledWith, [url, key]);

// C) explicit USE_SUPABASE=false wins over present credentials -> MOCK
eq("C override false: USE_SUPABASE=false", boot({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key, USE_SUPABASE: false }).cfg.USE_SUPABASE, false);

// D) configured but the supabase-js CDN is unavailable -> safe no-op
const d = boot({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key }, { supabaseJs: true, noSdk: true });
eq("D CDN blocked: SB_READY=false", d.ready, false);
eq("D CDN blocked: SB=null", d.sb, null);

console.log(fail === 0 ? "\nRESULT: PASS - env/config/client wiring is correct." : `\nRESULT: ${fail} check(s) failed.`);
process.exit(fail === 0 ? 0 : 1);