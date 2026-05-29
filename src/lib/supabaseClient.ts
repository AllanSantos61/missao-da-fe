import { createClient } from "@supabase/supabase-js";

type SupabaseClientConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseClientConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (typeof window !== "undefined") {
      console.warn("Supabase not initialized: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    return null;
  }

  return { url, anonKey };
}

const supabaseConfig = getSupabaseConfig();

export const supabaseClient = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

if (typeof window !== "undefined" && supabaseConfig) {
  console.info("Supabase initialized", {
    url: supabaseConfig.url
  });
}
