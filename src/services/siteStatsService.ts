import { supabaseClient } from "@/lib/supabaseClient";

const LOCAL_VISITS_KEY = "missaoDaFeLocalVisits";
const GLOBAL_STATS_ID = "global";

function getLocalVisits() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(LOCAL_VISITS_KEY) ?? "0");
}

function incrementLocalVisits() {
  if (typeof window === "undefined") return 0;
  const nextVisits = getLocalVisits() + 1;
  window.localStorage.setItem(LOCAL_VISITS_KEY, String(nextVisits));
  return nextVisits;
}

function isMissingStatsTable(error: unknown) {
  const supabaseError = error as { code?: string; message?: string };
  return supabaseError.code === "42P01" || supabaseError.code === "PGRST205";
}

export async function incrementVisitCounter() {
  if (!supabaseClient) {
    return incrementLocalVisits();
  }

  try {
    const currentStats = await supabaseClient
      .from("site_stats")
      .select("id, total_visits")
      .eq("id", GLOBAL_STATS_ID)
      .maybeSingle();

    if (currentStats.error) throw currentStats.error;

    if (currentStats.data?.id) {
      const nextVisits = Number(currentStats.data.total_visits ?? 0) + 1;
      const { error } = await supabaseClient
        .from("site_stats")
        .update({
          total_visits: nextVisits,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentStats.data.id);

      if (error) throw error;
      return nextVisits;
    }

    const { data, error } = await supabaseClient
      .from("site_stats")
      .insert({
        id: GLOBAL_STATS_ID,
        total_visits: 1,
        updated_at: new Date().toISOString()
      })
      .select("total_visits")
      .single();

    if (error) throw error;
    return Number(data.total_visits ?? 1);
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && !isMissingStatsTable(error)) {
      console.info("[VisitCounter] Supabase unavailable; using local fallback.");
    }
    return incrementLocalVisits();
  }
}
