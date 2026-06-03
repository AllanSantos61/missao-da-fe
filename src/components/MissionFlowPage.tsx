"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FocusedQuizMission } from "@/components/FocusedQuizMission";
import { FocusedReadingMission } from "@/components/FocusedReadingMission";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { ShareResultButton } from "@/components/ShareResultButton";
import { WordFaithGame } from "@/components/WordFaithGame";
import { useBibleJourney } from "@/hooks/useBibleJourney";
import { useDailyChallengeContent } from "@/hooks/useDailyChallengeContent";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useJourneyMissionState } from "@/hooks/useJourneyMissionState";
import { trackEvent } from "@/services/analyticsService";
import type { DailyChallengeResult, DayHistory } from "@/types/dailyProgress";
import { formatDias } from "@/utils/pluralize";

type MissionFlowStep = "reading" | "quiz" | "word" | "result";

type MissionFlowPageProps = {
  step: MissionFlowStep;
  day: number;
};

function safeDay(day: number) {
  return Number.isFinite(day) && day >= 1 ? Math.min(365, Math.round(day)) : 1;
}

function createEmptyHistory(activeDate: string): DayHistory {
  return {
    date: activeDate,
    completedChallenges: [],
    xpEarned: 0,
    results: {}
  };
}

export function MissionFlowPage({ step, day }: MissionFlowPageProps) {
  const router = useRouter();
  const targetDay = safeDay(day);
  const dailyChallengeContent = useDailyChallengeContent();
  const {
    progress,
    todayHistory,
    isLoaded,
    completeChallenge
  } = useDailyProgress();
  const {
    journey,
    isLoading,
    isCompleting,
    selectJourneyDay,
    completeReading,
    completeJourneyPart
  } = useBibleJourney(
    progress?.localUserId || progress?.anonymousUserId || "",
    progress?.playerName ?? "visitante",
    progress?.anonymousUserId
  );
  const renderedTodayHistory = useMemo(
    () => todayHistory ?? createEmptyHistory(progress?.activeDate ?? new Date().toISOString().slice(0, 10)),
    [progress?.activeDate, todayHistory]
  );
  const missionState = useJourneyMissionState(journey, renderedTodayHistory);

  useEffect(() => {
    if (!journey || journey.selectedDay === targetDay) return;
    if (targetDay > journey.progress.availableJourneyDay) return;
    void selectJourneyDay(targetDay);
  }, [journey, selectJourneyDay, targetDay]);

  useEffect(() => {
    if (!progress) return;
    const eventName =
      step === "reading"
        ? "reading_started"
        : step === "quiz"
          ? "quiz_started"
          : step === "word"
            ? "word_started"
            : "mission_completed";
    void trackEvent({
      eventName,
      userId: progress.anonymousUserId,
      playerName: progress.playerName,
      metadata: { journeyDay: targetDay, route: `/${step}/${targetDay}` }
    });
  }, [progress, step, targetDay]);

  if (!isLoaded || !progress || isLoading || !journey) {
    return (
      <main className="grid min-h-screen place-items-center bg-parchment px-4 text-ink">
        <section className="w-full max-w-md rounded-[1.75rem] bg-white p-6 text-center shadow-card">
          <div className="flex justify-center">
            <MissaoDaFeLogo size="loading" />
          </div>
          <p className="mt-4 font-bold text-navy">Carregando sua missão...</p>
        </section>
      </main>
    );
  }

  const activeDay = journey.selectedDay;
  const selectedDay = journey.calendar.find((calendarDay) => calendarDay.dayNumber === activeDay);
  const selectedStatus = missionState.getMissionStatus(activeDay);
  const readingXp = journey.reading.xpReward;
  const quizXp = journey.mission?.quizXp ?? dailyChallengeContent.quiz.xp;
  const wordXp = journey.mission?.wordXp ?? dailyChallengeContent.word.xp;
  const dailyXp = (selectedStatus.readingCompleted ? readingXp : 0) +
    (selectedStatus.quizCompleted ? quizXp : 0) +
    (selectedStatus.wordCompleted ? wordXp : 0);

  const readingResult = selectedStatus.readingCompleted
    ? {
        id: "gospel" as const,
        completedAt: selectedDay?.completedDate ?? new Date().toISOString(),
        xpEarned: readingXp,
        scoreLabel: "Concluído",
        gospel: { completed: true }
      }
    : undefined;
  const quizResult = selectedStatus.quizCompleted
    ? {
        id: "quiz" as const,
        completedAt: selectedDay?.completedDate ?? new Date().toISOString(),
        xpEarned: quizXp,
        scoreLabel: "Concluído",
        quiz: { score: 3, total: 3, answers: {} }
      }
    : undefined;
  const wordResult = selectedStatus.wordCompleted
    ? {
        id: "word" as const,
        completedAt: selectedDay?.completedDate ?? new Date().toISOString(),
        xpEarned: wordXp,
        scoreLabel: selectedDay?.wordAttempts ? `${selectedDay.wordAttempts}/6` : "Concluído",
        word: {
          solved: Boolean(selectedDay?.wordResult?.solved ?? true),
          attempts: selectedDay?.wordAttempts ?? 0,
          guesses: selectedDay?.wordAttemptsHistory?.map((item) => item.guess) ?? [],
          attemptsHistory: selectedDay?.wordAttemptsHistory ?? [],
          correctWord: selectedDay?.wordResult?.correctWord ?? journey.mission?.normalizedFaithWord
        }
      }
    : undefined;

  async function handleReadingComplete() {
    if (readingResult) return;
    const nextState = await completeReading(activeDay);
    const result: DailyChallengeResult = {
      id: "gospel",
      completedAt: new Date().toISOString(),
      xpEarned: readingXp,
      scoreLabel: `${nextState.progress.completedReadings}/${nextState.progress.totalReadings}`,
      gospel: { completed: true }
    };
    completeChallenge("gospel", result);
  }

  async function handleQuizComplete(result: DailyChallengeResult) {
    completeChallenge("quiz", result);
    await completeJourneyPart(activeDay, "quiz", result.xpEarned, result);
    router.push(`/word/${activeDay}`);
  }

  async function handleWordComplete(result: DailyChallengeResult) {
    completeChallenge("word", result);
    await completeJourneyPart(activeDay, "word", result.xpEarned, result);
    router.push(`/result/${activeDay}`);
  }

  if (step === "reading") {
    return (
      <FocusedReadingMission
        journey={journey}
        isCompleting={isCompleting}
        isCompleted={Boolean(readingResult)}
        onComplete={handleReadingComplete}
      />
    );
  }

  if (step === "quiz") {
    const quizData = journey.mission
      ? {
          title: `Quiz do Dia ${activeDay}`,
          xp: quizXp,
          questions: journey.mission.quizQuestions.map((question) => ({
            id: question.id,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation
          }))
        }
      : dailyChallengeContent.quiz;

    return (
      <FocusedQuizMission
        dayNumber={activeDay}
        data={quizData}
        savedResult={quizResult}
        onComplete={handleQuizComplete}
      />
    );
  }

  if (step === "word") {
    const wordData = journey.mission
      ? {
          title: `Palavra do Dia ${activeDay}`,
          secret: journey.mission.normalizedFaithWord,
          xp: wordXp
        }
      : dailyChallengeContent.word;

    return (
      <main className="min-h-screen bg-parchment px-4 py-5 text-ink">
        <div className="mx-auto max-w-2xl">
          <WordFaithGame
            data={wordData}
            savedResult={wordResult}
            progress={progress}
            todayHistory={renderedTodayHistory}
            wordMode="mission"
            autoAdvanceOnComplete
            onComplete={handleWordComplete}
            onNextMission={() => router.push(`/result/${activeDay}`)}
            nextMissionLabel="Ver resultado"
            onBack={() => router.push("/")}
          />
        </div>
      </main>
    );
  }

  const completedCount = [selectedStatus.readingCompleted, selectedStatus.quizCompleted, selectedStatus.wordCompleted].filter(Boolean).length;
  const journeyPercent = Math.min(100, Math.round((journey.progress.completedReadings / journey.progress.totalReadings) * 100));

  return (
    <main className="min-h-screen bg-parchment px-4 py-6 text-ink">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 text-center shadow-card">
        <div className="flex justify-center">
          <MissaoDaFeLogo size="home" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gold">Resultado da missão</p>
        <h1 className="mt-2 text-3xl font-black text-navy">Dia {activeDay} de 365</h1>
        <p className="mt-2 font-bold leading-7 text-ink/65">
          {completedCount === 3
            ? "Missão concluída. Amanhã tem uma nova etapa da sua caminhada."
            : "Sua missão ainda está em andamento. Você pode continuar de onde parou."}
        </p>

        <div className="mt-6 grid gap-3 text-left">
          <ResultItem label="Leitura" completed={selectedStatus.readingCompleted} />
          <ResultItem label="Quiz" completed={selectedStatus.quizCompleted} />
          <ResultItem label="Palavra da Fé" completed={selectedStatus.wordCompleted} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultMetric label="XP ganho" value={dailyXp} />
          <ResultMetric label="Sequência" value={formatDias(journey.progress.currentStreak)} />
          <ResultMetric label="Jornada" value={`${journeyPercent}%`} />
        </div>

        <div className="mt-6 rounded-2xl bg-parchment p-4">
          <div className="flex items-center justify-between text-sm font-black text-navy">
            <span>Progresso da Jornada</span>
            <span>{journey.progress.completedReadings}/365</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gold" style={{ width: `${journeyPercent}%` }} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {completedCount < 3 ? (
            <button
              onClick={() => {
                if (!selectedStatus.readingCompleted) router.push(`/reading/${activeDay}`);
                else if (!selectedStatus.quizCompleted) router.push(`/quiz/${activeDay}`);
                else router.push(`/word/${activeDay}`);
              }}
              className="rounded-2xl bg-navy px-5 py-4 font-black text-white"
            >
              Continuar missão
            </button>
          ) : (
            <ShareResultButton progress={progress} todayHistory={renderedTodayHistory} />
          )}
          <button onClick={() => router.push("/")} className="rounded-2xl bg-gold px-5 py-4 font-black text-navy">
            Voltar para Home
          </button>
        </div>
      </section>
    </main>
  );
}

function ResultItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 font-black ${completed ? "bg-faithGreen/12 text-faithGreen" : "bg-parchment text-ink/60"}`}>
      {completed ? "✓" : "○"} {label}
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-parchment p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gold">{label}</p>
      <p className="mt-1 text-xl font-black text-navy">{value}</p>
    </div>
  );
}
