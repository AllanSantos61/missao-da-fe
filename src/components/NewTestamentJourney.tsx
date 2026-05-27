"use client";

import { ChallengeActionBar } from "@/components/ChallengeActionBar";
import { ChallengeStatusStrip } from "@/components/ChallengeStatusStrip";
import { XPJourneyCalendar } from "@/components/XPJourneyCalendar";
import { readingXP } from "@/services/bibleJourneyService";
import type { DailyChallengeResult, DayHistory, UserProgress } from "@/types/dailyProgress";
import type { CurrentReadingState } from "@/types/bibleJourney";

type NewTestamentJourneyProps = {
  journey: CurrentReadingState;
  savedResult?: DailyChallengeResult;
  progress: UserProgress;
  todayHistory: DayHistory;
  isCompleting: boolean;
  onCompleteReading: () => Promise<unknown>;
  onCompleteDaily: (result: DailyChallengeResult) => void;
  onNextMission: () => void;
  nextMissionLabel: string;
  onBack: () => void;
};

export function NewTestamentJourney({
  journey,
  savedResult,
  progress,
  todayHistory,
  isCompleting,
  onCompleteReading,
  onCompleteDaily,
  onNextMission,
  nextMissionLabel,
  onBack
}: NewTestamentJourneyProps) {
  const completedToday = Boolean(savedResult);
  const percent = Math.min(100, Math.round((journey.progress.completedReadings / journey.progress.totalReadings) * 100));

  async function handleCompleteReading() {
    if (completedToday || isCompleting) return;

    await onCompleteReading();
    onCompleteDaily({
      id: "gospel",
      completedAt: new Date().toISOString(),
      xpEarned: readingXP,
      scoreLabel: `${journey.progress.completedReadings + 1}/${journey.progress.totalReadings}`,
      gospel: { completed: true }
    });
  }

  return (
    <section className="rounded-[1.75rem] bg-altar p-5 shadow-card">
      <ChallengeActionBar
        isCompleted={completedToday}
        nextMissionLabel={nextMissionLabel}
        onBack={onBack}
        onNextMission={onNextMission}
      />

      <div className="mt-4">
        <ChallengeStatusStrip challengeId="gospel" xp={readingXP} progress={progress} todayHistory={todayHistory} />
      </div>

      {journey.missedDaysSinceLastVisit > 0 ? (
        <div className="mt-5 rounded-3xl bg-gold/15 p-4 text-sm font-bold leading-6 text-navy">
          Você ficou alguns dias sem concluir sua missão. Tudo bem, sua jornada continua de onde parou.
        </div>
      ) : null}

      <p className="mt-5 text-xs font-black uppercase tracking-wide text-gold">Jornada do Novo Testamento</p>
      <h2 className="mt-2 text-3xl font-black text-ink">{journey.reading.reference}</h2>
      <p className="mt-1 font-bold text-navy">{journey.reading.title}</p>

      <div className="mt-5 rounded-3xl bg-navy p-5 text-white">
        <div className="flex items-center justify-between gap-3 text-sm font-bold text-white/75">
          <span>Progresso total</span>
          <span>
            {journey.progress.completedReadings}/{journey.progress.totalReadings}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-white/60">Tempo</p>
            <p className="font-black">{journey.reading.estimatedMinutes} min</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-white/60">XP</p>
            <p className="font-black">+{readingXP}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-white/60">Fonte</p>
            <p className="font-black">{journey.source === "supabase" ? "Online" : "Local"}</p>
          </div>
        </div>
      </div>

      <article className="mt-5 rounded-3xl border border-navy/10 bg-parchment p-5">
        <p className="text-lg leading-8 text-ink/78">{journey.reading.content}</p>
      </article>

      <div className="mt-5">
        <XPJourneyCalendar calendar={journey.calendar} progress={journey.progress} />
      </div>

      {completedToday ? (
        <div className="mt-5 rounded-2xl bg-faithGreen/12 px-4 py-4 text-center font-black text-faithGreen">
          Leitura concluída hoje · +{savedResult?.xpEarned} XP
        </div>
      ) : (
        <button
          onClick={handleCompleteReading}
          disabled={isCompleting}
          className="mt-5 w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card transition enabled:hover:-translate-y-0.5 enabled:hover:bg-ink disabled:cursor-wait disabled:bg-stone"
        >
          {isCompleting ? "Salvando leitura..." : "Concluir leitura"}
        </button>
      )}
    </section>
  );
}
