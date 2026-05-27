"use client";

import { useEffect, useMemo, useState } from "react";
import { AppTopBar } from "@/components/AppTopBar";
import { ChallengeCard } from "@/components/ChallengeCard";
import { DailyProgressHeader } from "@/components/DailyProgressHeader";
import { GospelChallenge } from "@/components/GospelChallenge";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { PlayerNameModal } from "@/components/PlayerNameModal";
import { QuizFaith } from "@/components/QuizFaith";
import { RankingModal } from "@/components/RankingModal";
import { ShareResultButton } from "@/components/ShareResultButton";
import { WordFaithGame } from "@/components/WordFaithGame";
import { dailyChallengeData } from "@/data/dailyChallengeData";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import type { ChallengeId, DailyChallengeResult } from "@/types/dailyProgress";

const challengeCards = [
  {
    id: "gospel" as const,
    title: "Evangelho",
    description: "Leitura curta, reflexão e prática do dia."
  },
  {
    id: "quiz" as const,
    title: "Quiz da Fé",
    description: "Três perguntas rápidas sobre a mensagem."
  },
  {
    id: "word" as const,
    title: "Palavra da Fé",
    description: "Descubra a palavra cristã de 5 letras."
  }
];

export default function Home() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const { progress, todayHistory, isLoaded, refreshDay, completeChallenge, updatePlayerName } =
    useDailyProgress();

  useEffect(() => {
    refreshDay();
  }, [refreshDay]);

  const completedCount = todayHistory?.completedChallenges.length ?? 0;

  const challengeXp = useMemo(
    () => ({
      gospel: dailyChallengeData.gospel.xp,
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
                  title={card.title}
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
                <p className="text-2xl font-black text-navy">Hoje voce completou sua missao.</p>
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

        {selectedChallenge === "gospel" ? (
          <GospelChallenge
            data={dailyChallengeData.gospel}
            savedResult={selectedResult}
            progress={progress}
            todayHistory={todayHistory}
            onComplete={handleComplete}
            onBack={goHome}
          />
        ) : null}

        {selectedChallenge === "quiz" ? (
          <QuizFaith
            data={dailyChallengeData.quiz}
            savedResult={selectedResult}
            progress={progress}
            todayHistory={todayHistory}
            onComplete={handleComplete}
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
