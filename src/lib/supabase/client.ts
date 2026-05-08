import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _instance: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

    const noopStorage = {
      getItem: () => null as string | null,
      setItem: () => {},
      removeItem: () => {},
    };

    _instance = createClient(url, key, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        storageKey: "mvp-builder-ai-auth",
        storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
      },
    });
  }
  return _instance;
}

// Lazy proxy: createClient is only called when a property is actually accessed,
// NOT during module evaluation. This prevents crashes during Vercel static builds.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
