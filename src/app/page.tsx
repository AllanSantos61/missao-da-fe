"use client";

import { useEffect, useMemo, useState } from "react";
import { AppTopBar } from "@/components/AppTopBar";
import { ChallengeCard } from "@/components/ChallengeCard";
import { DailyProgressHeader } from "@/components/DailyProgressHeader";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { NewTestamentJourney } from "@/components/NewTestamentJourney";
import { PlayerNameModal } from "@/components/PlayerNameModal";
import { QuizFaith } from "@/components/QuizFaith";
import { RankingModal } from "@/components/RankingModal";
import { ShareResultButton } from "@/components/ShareResultButton";
import { WordFaithGame } from "@/components/WordFaithGame";
import { useDailyChallengeContent } from "@/hooks/useDailyChallengeContent";
import { useBibleJourney } from "@/hooks/useBibleJourney";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useVisitCounter } from "@/hooks/useVisitCounter";
import { readingXP } from "@/services/bibleJourneyService";
import type { ChallengeId, DailyChallengeResult } from "@/types/dailyProgress";

const challengeCards = [
  {
    id: "gospel" as const,
    description: "Leia o Novo Testamento em 365 dias, no seu ritmo, sem perder a sequência da missão."
  },
  {
    id: "quiz" as const,
    description: "Três perguntas rápidas sobre a mensagem."
  },
  {
    id: "word" as const,
    description: "Descubra a palavra cristã de 5 letras."
  }
];

export default function Home() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const visits = useVisitCounter();
  const dailyChallengeContent = useDailyChallengeContent();
  const { progress, todayHistory, isLoaded, refreshDay, completeChallenge, updatePlayerName } =
    useDailyProgress();
  const {
    journey,
    isLoading: isJourneyLoading,
    isCompleting: isJourneyCompleting,
    selectJourneyDay,
    completeReading,
    completeJourneyPart
  } = useBibleJourney(progress?.playerName ?? "");

  useEffect(() => {
    refreshDay();
  }, [refreshDay]);

  const completedCount = todayHistory?.completedChallenges.length ?? 0;

  const challengeXp = useMemo(
    () => ({
      gospel: readingXP,
      quiz: dailyChallengeContent.quiz.xp,
      word: dailyChallengeContent.word.xp
    }),
    [dailyChallengeContent]
  );

  function handleComplete(result: DailyChallengeResult) {
    completeChallenge(result.id, result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setSelectedChallenge(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getNextMission(currentChallenge: ChallengeId) {
    if (!todayHistory) return null;

    const order: ChallengeId[] = ["gospel", "quiz", "word"];
    const currentIndex = order.indexOf(currentChallenge);
    const rotatedOrder = [...order.slice(currentIndex + 1), ...order.slice(0, currentIndex + 1)];

    return rotatedOrder.find((challengeId) => !todayHistory.completedChallenges.includes(challengeId)) ?? null;
  }

  function goToNextMission(currentChallenge: ChallengeId) {
    const nextMission = getNextMission(currentChallenge);

    if (nextMission) {
      setSelectedChallenge(nextMission);
    } else {
      goHome();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getNextMissionLabel(currentChallenge: ChallengeId) {
    return getNextMission(currentChallenge) ? "Avançar para próxima missão" : "Compartilhar missão";
  }

  if (!isLoaded || !progress || !todayHistory) {
    return (
      <main className="min-h-screen bg-parchment px-4 py-6 text-ink">
        <section className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-6 text-center shadow-card">
          <div className="flex justify-center">
            <MissaoDaFeLogo size="loading" />
          </div>
          <p className="mt-4 font-bold text-navy">Carregando sua missão...</p>
        </section>
      </main>
    );
  }

  const selectedResult = selectedChallenge ? todayHistory.results[selectedChallenge] : undefined;
  const selectedJourneyDay = journey?.calendar.find((day) => day.dayNumber === journey.selectedDay);
  const journeyQuizData = journey?.mission
    ? {
        title: `Quiz do Dia ${journey.selectedDay}`,
        xp: journey.mission.quizXp,
        questions: journey.mission.quizQuestions.map((question) => ({
          id: question.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        }))
      }
    : dailyChallengeContent.quiz;
  const journeyWordData = journey?.mission
    ? {
        title: `Palavra do Dia ${journey.selectedDay}`,
        secret: journey.mission.normalizedFaithWord,
        xp: journey.mission.wordXp
      }
    : dailyChallengeContent.word;
  const journeyQuizResult =
    selectedJourneyDay?.quizCompleted
      ? {
          id: "quiz" as const,
          completedAt: selectedJourneyDay.completedDate ?? new Date().toISOString(),
          xpEarned: journey?.mission?.quizXp ?? dailyChallengeContent.quiz.xp,
          scoreLabel: "Concluído",
          quiz: { score: 3, total: 3, answers: {} }
        }
      : undefined;
  const journeyWordResult =
    selectedJourneyDay?.wordCompleted
      ? {
          id: "word" as const,
          completedAt: selectedJourneyDay.completedDate ?? new Date().toISOString(),
          xpEarned: journey?.mission?.wordXp ?? dailyChallengeContent.word.xp,
          scoreLabel: "Concluído",
          word: { solved: true, attempts: 0, guesses: [] }
        }
      : undefined;

  function handleJourneyPartComplete(part: "quiz" | "word", result: DailyChallengeResult) {
    handleComplete(result);
    if (journey) {
      void completeJourneyPart(journey.selectedDay, part, result.xpEarned);
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-4 pb-6 text-ink">
      <AppTopBar
        selectedChallenge={selectedChallenge}
        playerName={progress.playerName}
        visits={visits}
        onHome={goHome}
        onSelectChallenge={setSelectedChallenge}
        onOpenName={() => setShowNameModal(true)}
        onOpenRanking={() => setShowRankingModal(true)}
      />

      <div className="mx-auto mt-4 flex w-full max-w-3xl flex-col gap-5">
        {!selectedChallenge ? (
          <>
            <section className="flex flex-col items-center rounded-[2rem] bg-white/58 px-5 py-7 text-center shadow-[0_18px_50px_rgba(18,53,91,0.08)] ring-1 ring-white/80">
              <MissaoDaFeLogo size="home" />
              <p className="mt-4 max-w-xs text-balance text-lg font-semibold leading-7 text-ink/72">
                O desafio diário da fé em 3 minutos.
              </p>
            </section>

            <DailyProgressHeader progress={progress} todayHistory={todayHistory} />

            {journey ? (
              <section className="rounded-[1.75rem] bg-navy p-5 text-white shadow-soft">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Jornada da Fé</p>
                <h2 className="mt-2 text-3xl font-black leading-tight">Dia {journey.progress.currentJourneyDay}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">
                  Leia o Novo Testamento em 365 dias, no seu ritmo, sem perder a sequência da missão.
                </p>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/12">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-faithGreen transition-all duration-500"
                    style={{ width: `${Math.round((journey.progress.completedReadings / 365) * 100)}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-white/60">Progresso</p>
                    <p className="font-black">{journey.progress.completedReadings}/365</p>
                  </div>
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
                {journey.progress.pendingCount > 1 ? (
                  <div className="mt-5 rounded-2xl bg-gold/15 p-4 text-sm font-bold leading-6 text-white">
                    Você tem {journey.progress.pendingCount} missões pendentes. Tudo bem, sua jornada continua de onde parou.
                  </div>
                ) : null}
                <button
                  onClick={() => setSelectedChallenge("gospel")}
                  className="mt-5 w-full rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card transition hover:-translate-y-0.5"
                >
                  {journey.progress.pendingCount > 1 ? "Recuperar missão pendente" : "Continuar jornada"}
                </button>
              </section>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-3">
              {challengeCards.map((card) => (
                <ChallengeCard
                  key={card.id}
                  id={card.id}
                  description={card.description}
                  xp={challengeXp[card.id]}
                  completed={todayHistory.completedChallenges.includes(card.id)}
                  result={todayHistory.results[card.id]}
                  onOpen={setSelectedChallenge}
                />
              ))}
            </section>

            {completedCount === 3 ? (
              <section className="rounded-[1.75rem] bg-white p-5 text-center shadow-card">
                <p className="text-2xl font-black text-navy">Hoje você completou sua missão.</p>
                <p className="mt-2 leading-7 text-ink/70">
                  Amanhã tem uma nova jornada. Um passo fiel por dia também transforma a alma. 🙏
                </p>
                <div className="mt-5">
                  <ShareResultButton progress={progress} todayHistory={todayHistory} />
                </div>
              </section>
            ) : (
              <section className="rounded-[1.75rem] border border-gold/25 bg-white p-5 shadow-card">
                <p className="font-black text-navy">Progresso do dia: {completedCount}/3</p>
                <p className="mt-2 leading-7 text-ink/68">
                  Escolha uma missão para continuar. Sem pressa: a fé também cresce em pequenos
                  gestos.
                </p>
              </section>
            )}
          </>
        ) : null}

        {selectedChallenge ? <DailyProgressHeader progress={progress} todayHistory={todayHistory} /> : null}

        {selectedChallenge === "gospel" && journey ? (
          <NewTestamentJourney
            journey={journey}
            savedResult={selectedResult}
            progress={progress}
            todayHistory={todayHistory}
            isCompleting={isJourneyCompleting}
            onCompleteReading={completeReading}
            onCompleteDaily={handleComplete}
            onSelectDay={selectJourneyDay}
            onNextMission={() => goToNextMission("gospel")}
            nextMissionLabel={getNextMissionLabel("gospel")}
            onBack={goHome}
          />
        ) : null}

        {selectedChallenge === "gospel" && isJourneyLoading ? (
          <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-card">
            <p className="font-black text-navy">Carregando sua Jornada do Novo Testamento...</p>
          </section>
        ) : null}

        {selectedChallenge === "quiz" ? (
          <QuizFaith
            data={journeyQuizData}
            savedResult={journeyQuizResult}
            progress={progress}
            todayHistory={todayHistory}
            onComplete={(result) => handleJourneyPartComplete("quiz", result)}
            onNextMission={() => goToNextMission("quiz")}
            nextMissionLabel={getNextMissionLabel("quiz")}
            onBack={goHome}
          />
        ) : null}

        {selectedChallenge === "word" ? (
          <WordFaithGame
            data={journeyWordData}
            savedResult={journeyWordResult}
            progress={progress}
            todayHistory={todayHistory}
            onComplete={(result) => handleJourneyPartComplete("word", result)}
            onNextMission={() => goToNextMission("word")}
            nextMissionLabel={getNextMissionLabel("word")}
            onBack={goHome}
          />
        ) : null}
      </div>

      {showNameModal ? (
        <PlayerNameModal
          currentName={progress.playerName}
          onSave={updatePlayerName}
          onClose={() => setShowNameModal(false)}
        />
      ) : null}

      {showRankingModal ? (
        <RankingModal progress={progress} onClose={() => setShowRankingModal(false)} />
      ) : null}
    </main>
  );
}
