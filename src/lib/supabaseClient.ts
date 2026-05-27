import { createClient } from "@supabase/supabase-js";

type SupabaseClientConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseClientConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

const supabaseConfig = getSupabaseConfig();

export const supabaseClient = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;
