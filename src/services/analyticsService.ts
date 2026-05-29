import { supabaseClient } from "@/lib/supabaseClient";

export type AnalyticsEventName =
  | "app_opened"
  | "onboarding_started"
  | "onboarding_completed"
  | "player_name_saved"
  | "journey_started"
  | "reading_started"
  | "reading_completed"
  | "quiz_started"
  | "quiz_completed"
  | "word_started"
  | "word_completed"
  | "mission_completed"
  | "whatsapp_shared"
  | "ranking_opened"
  | "calendar_opened"
  | "community_saved"
  | "ranking_filter_changed"
  | "calendar_milestone_clicked"
  | "pwa_install_clicked"
  | "reminder_saved"
  | "public_result_opened"
  | "public_result_shared";

type TrackEventParams = {
  eventName: AnalyticsEventName;
  userId?: string;
  playerName?: string;
  metadata?: Record<string, unknown>;
};

function isMissingEventsTable(error: unknown) {
  const supabaseError = error as { code?: string; message?: string };
  return supabaseError.code === "42P01" || supabaseError.code === "PGRST205";
}

export async function trackEvent({ eventName, userId, playerName, metadata = {} }: TrackEventParams) {
  const payload = {
    event_name: eventName,
    user_id: userId ?? null,
    player_name: playerName ?? null,
    metadata
  };

  if (process.env.NODE_ENV !== "production") {
    console.info("[Analytics]", payload);
  }

  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient.from("app_events").insert(payload);
    if (error) throw error;
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && !isMissingEventsTable(error)) {
      console.info("[Analytics] Event persistence skipped", { eventName });
    }
  }
}
