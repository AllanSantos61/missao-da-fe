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
  | "calendar_opened";

type TrackEventParams = {
  eventName: AnalyticsEventName;
  userId?: string;
  playerName?: string;
  metadata?: Record<string, unknown>;
};

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
    await supabaseClient.from("app_events").insert(payload);
  } catch (error) {
    console.warn("[Analytics] Event persistence failed", { eventName, error });
  }
}
