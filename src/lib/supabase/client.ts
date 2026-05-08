import { createClient } from "@supabase/supabase-js";

// Fallback to placeholder during static build — real values come from env vars at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// In SSR/build environments window is undefined — provide a no-op storage so GoTrueClient
// does not attempt to access globalThis.localStorage (which is undefined in Node.js)
const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => undefined,
  removeItem: (_key: string) => undefined,
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "mvp-builder-ai-auth",
    storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
  },
});
