import { supabaseClient } from "@/lib/supabaseClient";
import type { DayHistory, PublicResult, UserProgress } from "@/types/dailyProgress";
import { getTodayKey } from "@/utils/dateUtils";

const LOCAL_RESULTS_KEY = "missaoDaFePublicResults";

function createSlug(userId: string, date: string) {
  return `${userId.slice(0, 8)}-${date.replaceAll("-", "")}`;
}

function readLocalResults(): Record<string, PublicResult> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_RESULTS_KEY) ?? "{}") as Record<string, PublicResult>;
  } catch {
    return {};
  }
}

function saveLocalResult(result: PublicResult) {
  if (typeof window === "undefined") return;
  const results = readLocalResults();
  window.localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify({ ...results, [result.shareSlug]: result }));
}

export function buildPublicResult(progress: UserProgress, todayHistory: DayHistory): PublicResult {
  const date = todayHistory.date || getTodayKey();
  const journeyScore = Number(todayHistory.results.gospel?.scoreLabel?.split("/")[0] ?? 1);

  return {
    userId: progress.anonymousUserId,
    playerName: progress.playerName || "Peregrino",
    resultDate: date,
    journeyDay: Number.isFinite(journeyScore) ? journeyScore : 1,
    readingCompleted: Boolean(todayHistory.results.gospel),
    quizScore: todayHistory.results.quiz?.quiz?.score ?? 0,
    quizTotal: todayHistory.results.quiz?.quiz?.total ?? 3,
    wordAttempts: todayHistory.results.word?.word?.attempts ?? 0,
    wordSolved: Boolean(todayHistory.results.word?.word?.solved),
    dailyXp: todayHistory.xpEarned,
    streak: progress.currentStreak,
    shareSlug: createSlug(progress.anonymousUserId, date)
  };
}

export async function savePublicResult(progress: UserProgress, todayHistory: DayHistory) {
  const result = buildPublicResult(progress, todayHistory);
  saveLocalResult(result);

  if (!supabaseClient) return result;

  const payload = {
    user_id: result.userId,
    player_name: result.playerName,
    result_date: result.resultDate,
    journey_day: result.journeyDay,
    reading_completed: result.readingCompleted,
    quiz_score: result.quizScore,
    word_attempts: result.wordAttempts,
    daily_xp: result.dailyXp,
    streak: result.streak,
    share_slug: result.shareSlug
  };

  const { error } = await supabaseClient.from("public_results").upsert(payload, { onConflict: "share_slug" });
  if (error) return result;
  return result;
}

export async function getPublicResult(slug: string): Promise<PublicResult | null> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("public_results")
      .select("*")
      .eq("share_slug", slug)
      .limit(1);

    if (!error && data?.[0]) {
      const row = data[0] as {
        user_id: string;
        player_name: string;
        result_date: string;
        journey_day: number;
        reading_completed: boolean;
        quiz_score: number;
        word_attempts: number;
        daily_xp: number;
        streak: number;
        share_slug: string;
      };

      return {
        userId: row.user_id,
        playerName: row.player_name,
        resultDate: row.result_date,
        journeyDay: row.journey_day,
        readingCompleted: row.reading_completed,
        quizScore: row.quiz_score,
        quizTotal: 3,
        wordAttempts: row.word_attempts,
        wordSolved: row.word_attempts > 0,
        dailyXp: row.daily_xp,
        streak: row.streak,
        shareSlug: row.share_slug
      };
    }
  }

  return readLocalResults()[slug] ?? null;
}
