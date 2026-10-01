// scripts/load-env.mjs
// Tiny dependency-free .env loader shared by the build + check scripts.
// Real process environment variables win over values in the .env file.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// KEY=VALUE lines, "#" comments, optional surrounding quotes.
export function parseDotEnv(text){
  const out = {};
  for (const raw of text.split(/\r?\n/)){
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

// Returns a getter: get("SUPABASE_URL") -> string (or "").
export function loadEnv(){
  const p = join(ROOT, ".env");
  const fileVars = existsSync(p) ? parseDotEnv(readFileSync(p, "utf8")) : {};
  return (k) => (process.env[k] != null && process.env[k] !== "" ? process.env[k] : (fileVars[k] ?? ""));
}

// Normalises the Supabase values used across the app.
export function supabaseConfig(get){
  const url = String(get("SUPABASE_URL")).trim().replace(/\/+$/, "");
  const key = String(get("SUPABASE_PUBLISHABLE_KEY") || get("SUPABASE_ANON_KEY")).trim();
  const useFlag = String(get("USE_SUPABASE")).trim();
  return { url, key, useFlag };
}

// True when the value looks like a privileged key that must never reach a browser.
export function looksPrivileged(key){
  return /service_role/i.test(key) || key.startsWith("sb_secret_");
}