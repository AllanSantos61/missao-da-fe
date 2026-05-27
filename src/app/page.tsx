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
import { dailyChallengeData } from "@/data/dailyChallengeData";
import { useBibleJourney } from "@/hooks/useBibleJourney";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useVisitCounter } from "@/hooks/useVisitCounter";
import { readingXP } from "@/services/bibleJourneyService";
import type { ChallengeId, DailyChallengeResult } from "@/types/dailyProgress";

const challengeCards = [
  {
    id: "gospel" as const,
    description: "Leia o Novo Testamento inteiro, um trecho por dia, no seu ritmo."
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
  const { progress, todayHistory, isLoaded, refreshDay, completeChallenge, updatePlayerName } =
    useDailyProgress();
  const {
    journey,
    isLoading: isJourneyLoading,
    isCompleting: isJourneyCompleting,
    completeReading
  } = useBibleJourney(progress?.playerName ?? "");

  useEffect(() => {
    refreshDay();
  }, [refreshDay]);

  const completedCount = todayHistory?.completedChallenges.length ?? 0;

  const challengeXp = useMemo(
    () => ({
      gospel: readingXP,
      quiz: dailyChallengeData.quiz.xp,
      word: dailyChallengeData.word.xp
    }),
    []
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
            data={dailyChallengeData.quiz}
            savedResult={selectedResult}
            progress={progress}
            todayHistory={todayHistory}
            onComplete={handleComplete}
            onNextMission={() => goToNextMission("quiz")}
            nextMissionLabel={getNextMissionLabel("quiz")}
            onBack={goHome}
          />
        ) : null}

        {selectedChallenge === "word" ? (
          <WordFaithGame
            data={dailyChallengeData.word}
            savedResult={selectedResult}
            progress={progress}
            todayHistory={todayHistory}
            onComplete={handleComplete}
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
