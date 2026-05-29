"use client";

import { ChallengeActionBar } from "@/components/ChallengeActionBar";
import { ChallengeStatusStrip } from "@/components/ChallengeStatusStrip";
import { JourneyCalendar365 } from "@/components/JourneyCalendar365";
import { useBibleApiReading } from "@/hooks/useBibleApiReading";
import { trackEvent } from "@/services/analyticsService";
import { readingXP } from "@/services/bibleJourneyService";
import type { CurrentReadingState, JourneyDayStatus } from "@/types/bibleJourney";
import type { DailyChallengeResult, DayHistory, UserProgress } from "@/types/dailyProgress";

type NewTestamentJourneyProps = {
  journey: CurrentReadingState;
  savedResult?: DailyChallengeResult;
  progress: UserProgress;
  todayHistory: DayHistory;
  isCompleting: boolean;
  onSelectDay: (dayNumber: number) => void;
  onCompleteReading: (dayNumber?: number) => Promise<CurrentReadingState>;
  onCompleteDaily: (result: DailyChallengeResult) => void;
  onNextMission: () => void;
  nextMissionLabel: string;
  onBack: () => void;
};

function getLockedMessage(status: JourneyDayStatus) {
  if (status === "locked") return "Essa missão ainda não foi liberada. Continue sua jornada dia após dia.";
  return null;
}

export function NewTestamentJourney({
  journey,
  savedResult,
  progress,
  todayHistory,
  isCompleting,
  onSelectDay,
  onCompleteReading,
  onCompleteDaily,
  onNextMission,
  nextMissionLabel,
  onBack
}: NewTestamentJourneyProps) {
  const selectedCalendarDay = journey.calendar.find((day) => day.dayNumber === journey.selectedDay);
  const selectedStatus = selectedCalendarDay?.status ?? "locked";
  const isLocked = selectedStatus === "locked";
  const isCompleted = Boolean(selectedCalendarDay?.readingCompleted);
  const bibleText = useBibleApiReading(journey.reading);
  const percent = Math.min(
    100,
    Math.round((journey.progress.completedReadings / journey.progress.totalReadings) * 100)
  );
  const completedAllAvailable = journey.progress.pendingCount === 0;
  const actionLabel = completedAllAvailable
    ? "Missão de hoje concluída. A próxima leitura será liberada amanhã."
    : journey.progress.pendingCount > 1
      ? `Você ainda tem ${journey.progress.pendingCount} missões disponíveis para recuperar.`
      : "Você tem uma missão disponível para concluir.";

  async function handleCompleteReading() {
    if (isCompleted || isLocked || isCompleting) return;

    const nextState = await onCompleteReading(journey.selectedDay);
    onCompleteDaily({
      id: "gospel",
      completedAt: new Date().toISOString(),
      xpEarned: journey.reading.xpReward ?? readingXP,
      scoreLabel: `${nextState.progress.completedReadings}/${nextState.progress.totalReadings}`,
      gospel: { completed: true }
    });
  }

  return (
    <section className="rounded-[1.75rem] bg-altar p-5 shadow-card">
      <ChallengeActionBar
        isCompleted={isCompleted}
        nextMissionLabel={nextMissionLabel}
        onBack={onBack}
        onNextMission={onNextMission}
      />

      <div className="mt-4">
        <ChallengeStatusStrip challengeId="gospel" xp={journey.reading.xpReward ?? readingXP} progress={progress} todayHistory={todayHistory} />
      </div>

      {journey.notice ? (
        <div className="mt-5 rounded-3xl bg-gold/15 p-4 text-sm font-bold leading-6 text-navy">
          {journey.notice}
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl bg-navy p-5 text-white">
        <p className="text-xs font-black uppercase tracking-wide text-gold">Jornada da Fé</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">Dia {journey.selectedDay}</h2>
        <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-white/75">
          Leia o Novo Testamento em 365 dias, no seu ritmo, sem perder a sequência da missão.
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold text-white/75">
          <span>Progresso total</span>
          <span>
            {journey.progress.completedReadings}/{journey.progress.totalReadings}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-white/60">Liberado</p>
            <p className="font-black">Dia {journey.progress.availableJourneyDay}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-white/60">Pendentes</p>
            <p className="font-black">{journey.progress.pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-white/60">Sequência</p>
            <p className="font-black">{journey.progress.currentStreak}</p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <JourneyCalendar365
          days={journey.calendar}
          selectedDay={journey.selectedDay}
          onSelectDay={(dayNumber) => {
            void trackEvent({
              eventName: "calendar_opened",
              userId: progress.anonymousUserId,
              playerName: progress.playerName,
              metadata: { dayNumber }
            });
            onSelectDay(dayNumber);
          }}
        />
      </div>

      <article className="mt-5 rounded-3xl border border-navy/10 bg-parchment p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gold">{journey.reading.reference}</p>
            <h3 className="mt-2 text-2xl font-black text-ink">{journey.reading.title}</h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-navy shadow-sm">
            {journey.reading.estimatedMinutes} min · +{journey.reading.xpReward ?? readingXP} XP
          </span>
        </div>

        {getLockedMessage(selectedStatus) ? (
          <div className="mt-5 rounded-2xl bg-stone/15 p-4 text-sm font-bold leading-6 text-ink/70">
            {getLockedMessage(selectedStatus)}
          </div>
        ) : bibleText.isLoading ? (
          <div className="mt-5 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-navy/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-navy/10" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-navy/10" />
            <p className="pt-2 text-sm font-bold text-navy/65">Carregando leitura pela Bible API...</p>
          </div>
        ) : (
          <>
            {bibleText.reading?.errorMessage ? (
              <div className="mt-5 rounded-2xl bg-gold/15 p-4 text-sm font-bold leading-6 text-navy">
                {bibleText.reading.errorMessage}
              </div>
            ) : null}
            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-ink/78">{bibleText.reading?.text}</p>
          </>
        )}
      </article>

      <div className="mt-5 rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-navy shadow-sm">
        {isCompleted ? `Dia ${journey.selectedDay} concluído · +${selectedCalendarDay?.xpEarned ?? readingXP} XP` : actionLabel}
      </div>

      {!isCompleted && !isLocked ? (
        <button
          onClick={handleCompleteReading}
          disabled={isCompleting}
          className="mt-4 w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card transition enabled:hover:-translate-y-0.5 enabled:hover:bg-ink disabled:cursor-wait disabled:bg-stone"
        >
          {isCompleting ? "Salvando leitura..." : "Concluir leitura"}
        </button>
      ) : null}
    </section>
  );
}
