"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/AppTopBar";
import { CommunityModal } from "@/components/CommunityModal";
import { DailyProgressHeader } from "@/components/DailyProgressHeader";
import { JourneyCalendar365 } from "@/components/JourneyCalendar365";
import { MissaoDaFeLogo } from "@/components/MissaoDaFeLogo";
import { NewTestamentJourney } from "@/components/NewTestamentJourney";
import { OnboardingModal } from "@/components/OnboardingModal";
import { PlayerNameModal } from "@/components/PlayerNameModal";
import { QuizFaith } from "@/components/QuizFaith";
import { RankingModal } from "@/components/RankingModal";
import { ReminderCard } from "@/components/ReminderCard";
import { ShareResultButton } from "@/components/ShareResultButton";
import { WordFaithGame } from "@/components/WordFaithGame";
import { useBibleJourney } from "@/hooks/useBibleJourney";
import { useDailyChallengeContent } from "@/hooks/useDailyChallengeContent";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { trackEvent } from "@/services/analyticsService";
import type { ChallengeId, DailyChallengeResult, UserProgress } from "@/types/dailyProgress";

const missionSteps: Array<{ id: ChallengeId; label: string; description: string }> = [
  { id: "gospel", label: "Leitura", description: "Leia o trecho do Novo Testamento de hoje." },
  { id: "quiz", label: "Quiz", description: "Responda 3 perguntas sobre a leitura." },
  { id: "word", label: "Palavra", description: "Descubra a palavra cristã de 5 letras." }
];

const achievements = [
  { day: 7, title: "Primeira Semana" },
  { day: 30, title: "30 Dias" },
  { day: 100, title: "100 Perguntas" },
  { day: 40, title: "Evangelho de Mateus" },
  { day: 365, title: "Novo Testamento Completo" }
];

function getJourneyAvatar(day: number) {
  if (day >= 365) return "🏆";
  if (day >= 180) return "⭐";
  if (day >= 100) return "🌳";
  if (day >= 30) return "🌿";
  return "🌱";
}

export default function Home() {
  const router = useRouter();
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [homeNotice, setHomeNotice] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const dailyChallengeContent = useDailyChallengeContent();
  const {
    progress,
    todayHistory,
    isLoaded,
    refreshDay,
    completeChallenge,
    updatePlayerName,
    updateCommunity,
    updateReminderPreference,
    completeOnboarding
  } = useDailyProgress();
  const {
    journey,
    isLoading: isJourneyLoading,
    isCompleting: isJourneyCompleting,
    selectJourneyDay,
    completeReading,
    completeJourneyPart
  } = useBibleJourney(progress?.anonymousUserId ?? "", progress?.playerName ?? "");

  useEffect(() => {
    refreshDay();
  }, [refreshDay]);

  useEffect(() => {
    if (!progress) return;
    void trackEvent({
      eventName: "app_opened",
      userId: progress.anonymousUserId,
      playerName: progress.playerName
    });
  }, [progress]);

  useEffect(() => {
    if (!progress || progress.onboardingCompleted) return;
    void trackEvent({
      eventName: "onboarding_started",
      userId: progress.anonymousUserId,
      playerName: progress.playerName
    });
  }, [progress]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mission = new URLSearchParams(window.location.search).get("missao");
    if (mission === "gospel" || mission === "quiz" || mission === "word") {
      selectChallenge(mission);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = todayHistory?.completedChallenges.length ?? 0;
  function handleComplete(result: DailyChallengeResult) {
    completeChallenge(result.id, result);
    if (progress) {
      void trackEvent({
        eventName: result.id === "gospel" ? "reading_completed" : result.id === "quiz" ? "quiz_completed" : "word_completed",
        userId: progress.anonymousUserId,
        playerName: progress.playerName,
        metadata: { xpEarned: result.xpEarned, scoreLabel: result.scoreLabel }
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setSelectedChallenge(null);
    setHomeNotice("");
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePlayerNameSave(playerName: string) {
    updatePlayerName(playerName);
    void trackEvent({
      eventName: "player_name_saved",
      userId: progress?.anonymousUserId,
      playerName
    });
  }

  function handleCommunitySave(community: UserProgress["community"]) {
    updateCommunity(community);
    void trackEvent({
      eventName: "community_saved",
      userId: progress?.anonymousUserId,
      playerName: progress?.playerName,
      metadata: community
    });
  }

  function openRanking() {
    setShowRankingModal(true);
    void trackEvent({
      eventName: "ranking_opened",
      userId: progress?.anonymousUserId,
      playerName: progress?.playerName
    });
  }

  function selectChallenge(challengeId: ChallengeId) {
    setHomeNotice("");
    setSelectedChallenge(challengeId);
    void trackEvent({
      eventName: challengeId === "gospel" ? "reading_started" : challengeId === "quiz" ? "quiz_started" : "word_started",
      userId: progress?.anonymousUserId,
      playerName: progress?.playerName,
      metadata: { journeyDay: journey?.selectedDay }
    });
    if (challengeId === "gospel") {
      void trackEvent({
        eventName: "journey_started",
        userId: progress?.anonymousUserId,
        playerName: progress?.playerName,
        metadata: { journeyDay: journey?.selectedDay }
      });
    }
  }

  function getNextMission(currentChallenge: ChallengeId) {
    const order: ChallengeId[] = ["gospel", "quiz", "word"];
    if (!todayHistory) return null;
    const currentIndex = order.indexOf(currentChallenge);
    const rotatedOrder = [...order.slice(currentIndex + 1), ...order.slice(0, currentIndex + 1)];
    return rotatedOrder.find((challengeId) => isMissionPending(challengeId)) ?? null;
  }

  function isMissionPending(challengeId: ChallengeId) {
    if (!todayHistory) return true;
    const calendarDay = journey?.calendar.find((day) => day.dayNumber === (journey?.selectedDay ?? journey?.progress.currentJourneyDay ?? 1));

    if (challengeId === "gospel") {
      return !Boolean(calendarDay?.readingCompleted || todayHistory.results.gospel);
    }

    if (challengeId === "quiz") {
      return !Boolean(calendarDay?.quizCompleted || todayHistory.results.quiz);
    }

    return !Boolean(calendarDay?.wordCompleted || todayHistory.results.word);
  }

  function getFirstPendingMission() {
    const order: ChallengeId[] = ["gospel", "quiz", "word"];
    return order.find((challengeId) => isMissionPending(challengeId)) ?? null;
  }

  function openMission(challengeId: ChallengeId) {
    selectChallenge(challengeId);
    router.push(`/?missao=${challengeId}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueDailyMission() {
    try {
      if (!progress || !todayHistory) {
        setHomeNotice("Estamos carregando sua missão. Tente novamente em instantes.");
        return;
      }

      const nextMission = getFirstPendingMission();
      if (!nextMission) {
        setHomeNotice("Missão de hoje concluída.");
        return;
      }

      if (nextMission !== "gospel" && !journey?.mission) {
        openMission("gospel");
        return;
      }

      openMission(nextMission);
    } catch (error) {
      console.info("[Missão da Fé] Falha ao continuar missão; voltando para a Home.", error);
      setSelectedChallenge(null);
      setHomeNotice("Não foi possível abrir a missão agora. Tente novamente em instantes.");
      router.push("/");
    }
  }

  function goToNextMission(currentChallenge: ChallengeId) {
    const nextMission = getNextMission(currentChallenge);
    if (nextMission) openMission(nextMission);
    else goHome();
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
  const currentJourneyDay = journey?.progress.currentJourneyDay ?? 1;
  const avatar = getJourneyAvatar(currentJourneyDay);
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
    : null;
  const journeyWordData = journey?.mission
    ? {
        title: `Palavra do Dia ${journey.selectedDay}`,
        secret: journey.mission.normalizedFaithWord,
        xp: journey.mission.wordXp
      }
    : null;
  const journeyQuizResult = selectedJourneyDay?.quizCompleted
    ? {
        id: "quiz" as const,
        completedAt: selectedJourneyDay.completedDate ?? new Date().toISOString(),
        xpEarned: journey?.mission?.quizXp ?? dailyChallengeContent.quiz.xp,
        scoreLabel: "Concluído",
        quiz: { score: 3, total: 3, answers: {} }
      }
    : undefined;
  const journeyWordResult = selectedJourneyDay?.wordCompleted
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
      const allDone =
        Boolean(selectedJourneyDay?.readingCompleted) &&
        (part === "quiz" || Boolean(selectedJourneyDay?.quizCompleted)) &&
        (part === "word" || Boolean(selectedJourneyDay?.wordCompleted));
      if (allDone) {
        void trackEvent({
          eventName: "mission_completed",
          userId: progress?.anonymousUserId,
          playerName: progress?.playerName,
          metadata: { journeyDay: journey.selectedDay }
        });
      }
    }
  }

  function handleOnboardingComplete(playerName?: string) {
    completeOnboarding(playerName);
    void trackEvent({
      eventName: "onboarding_completed",
      userId: progress?.anonymousUserId,
      playerName,
      metadata: { skipped: false }
    });
  }

  function handleOnboardingSkip() {
    completeOnboarding();
    void trackEvent({
      eventName: "onboarding_completed",
      userId: progress?.anonymousUserId,
      playerName: progress?.playerName,
      metadata: { skipped: true }
    });
  }

  return (
    <main className="min-h-screen bg-parchment px-4 pb-6 text-ink">
      <AppTopBar
        selectedChallenge={selectedChallenge}
        playerName={progress.playerName}
        onHome={goHome}
        onSelectChallenge={selectChallenge}
        onOpenName={() => setShowNameModal(true)}
        onOpenRanking={openRanking}
        onOpenCommunity={() => setShowCommunityModal(true)}
      />

      <div className="mx-auto mt-4 flex w-full max-w-3xl flex-col gap-4">
        {!selectedChallenge ? (
          <>
            <section className="rounded-[2rem] bg-white p-5 text-center shadow-card">
              <div className="flex items-center justify-center gap-3">
                <MissaoDaFeLogo size="header" />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-parchment text-2xl shadow-sm">
                  {avatar}
                </span>
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-gold">Jornada da Fé</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-navy">
                Dia {currentJourneyDay} de 365
              </h1>
              <p className="mt-3 text-lg font-black leading-7 text-ink">
                Leia o Novo Testamento em apenas 10 minutos por dia.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
                Uma missão diária para fortalecer sua fé.
              </p>
              <button
                onClick={continueDailyMission}
                className="mt-5 w-full rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card transition hover:-translate-y-0.5"
              >
                Continuar Missão
              </button>
              {homeNotice ? (
                <p className="mt-3 rounded-2xl bg-parchment px-4 py-3 text-sm font-black text-navy">
                  {homeNotice}
                </p>
              ) : null}
            </section>

            <section className="rounded-[1.75rem] bg-navy p-4 text-white shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Sua Jornada</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">📖 Dia atual</p>
                  <p className="font-black">{currentJourneyDay}/365</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">🔥 Sequência</p>
                  <p className="font-black">{journey?.progress.currentStreak ?? progress.currentStreak} dias</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">⭐ XP total</p>
                  <p className="font-black">{progress.totalXP}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">🏆 Ranking</p>
                  <p className="font-black">{progress.weeklyXP > 0 ? "#1" : "Começando"}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-white/76">
                Você está construindo um hábito diário de leitura.
              </p>
            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Missão do Dia</p>
                  <h2 className="mt-1 text-2xl font-black text-navy">Progresso do dia</h2>
                </div>
                <span className="rounded-full bg-parchment px-4 py-2 text-sm font-black text-navy">{completedCount}/3</span>
              </div>
              <div className="mt-4 grid gap-2">
                {missionSteps.map((step) => {
                  const completed = todayHistory.completedChallenges.includes(step.id);
                  return (
                    <button
                      key={step.id}
                      onClick={() => selectChallenge(step.id)}
                      className="flex items-center justify-between rounded-2xl bg-parchment px-4 py-3 text-left transition hover:-translate-y-0.5"
                    >
                      <span className="flex items-center gap-3 font-black text-navy">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${completed ? "bg-faithGreen text-white" : "bg-white text-navy"}`}>
                          {completed ? "✓" : ""}
                        </span>
                        {step.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${completed ? "bg-faithGreen/12 text-faithGreen" : "bg-gold/15 text-navy"}`}>
                        {completed ? "Concluído" : "Disponível"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              {missionSteps.map((step) => {
                const completed = todayHistory.completedChallenges.includes(step.id);
                const nextPending = missionSteps.find((item) => !todayHistory.completedChallenges.includes(item.id))?.id;
                const status = completed ? "Concluído" : step.id === nextPending ? "Disponível" : "Pendente";
                return (
                  <article
                    key={step.id}
                    className="flex min-h-[150px] flex-col justify-between rounded-[1.25rem] border border-white bg-altar p-4 shadow-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-lg font-black text-navy">{step.label}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${
                          completed ? "bg-faithGreen/12 text-faithGreen" : status === "Disponível" ? "bg-gold/15 text-navy" : "bg-stone/20 text-ink/55"
                        }`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/65">{step.description}</p>
                    </div>
                    <button
                      onClick={() => selectChallenge(step.id)}
                      className="mt-4 w-full rounded-2xl bg-navy px-4 py-3 text-sm font-black text-white"
                    >
                      {completed ? "Rever" : "Continuar"}
                    </button>
                  </article>
                );
              })}
            </section>

            {journey ? (
              <section className="space-y-3">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-card">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Sua Jornada</p>
                  <h2 className="mt-1 text-2xl font-black text-navy">Dia {journey.progress.currentJourneyDay} de 365</h2>
                </div>
                <JourneyCalendar365
                  days={journey.calendar}
                  selectedDay={journey.selectedDay}
                  onSelectDay={selectJourneyDay}
                  onMilestoneClick={(dayNumber, title) =>
                    void trackEvent({
                      eventName: "calendar_milestone_clicked",
                      userId: progress.anonymousUserId,
                      playerName: progress.playerName,
                      metadata: { dayNumber, title, source: "home" }
                    })
                  }
                />
              </section>
            ) : null}

            <ReminderCard progress={progress} onSave={updateReminderPreference} />

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Conquistas</p>
              <h2 className="mt-1 text-xl font-black text-navy">Marcos da caminhada</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {achievements.map((achievement) => {
                  const unlocked = currentJourneyDay >= achievement.day;
                  return (
                    <div
                      key={achievement.title}
                      className={`rounded-2xl p-3 text-center ${
                        unlocked ? "bg-gold/15 text-navy ring-1 ring-gold/25" : "bg-parchment text-ink/48"
                      }`}
                    >
                      <p className="text-2xl">{unlocked ? "🏅" : "○"}</p>
                      <p className="mt-1 text-xs font-black leading-4">{achievement.title}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-navy">🔥 Sua posição esta semana</p>
                  <p className="mt-1 text-sm font-bold text-ink/60">
                    {progress.weeklyXP > 0 ? "#1 entre participantes locais" : "Complete a missão para entrar no ranking"}
                  </p>
                </div>
                <span className="rounded-full bg-gold/15 px-3 py-2 text-xs font-black text-navy">{progress.weeklyXP} XP</span>
              </div>
              <button onClick={openRanking} className="mt-4 w-full rounded-2xl bg-navy px-4 py-3 font-black text-white">
                Ver Ranking Completo
              </button>
            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <p className="text-xl font-black text-navy">Compartilhe sua jornada</p>
              <div className="mt-3 rounded-2xl bg-parchment p-4 text-sm font-bold leading-7 text-navy">
                <p>🙏 Missão da Fé</p>
                <p>📖 Dia {journey?.progress.currentJourneyDay ?? 1}/365</p>
                <p>🧠 Quiz {todayHistory.results.quiz?.quiz?.score ?? 0}/3</p>
                <p>✝️ Palavra {todayHistory.results.word?.word?.attempts ?? 0}/6</p>
                <p>🔥 Sequência {progress.currentStreak} dias</p>
              </div>
              <div className="mt-4">
                <ShareResultButton progress={progress} todayHistory={todayHistory} />
              </div>
            </section>
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

        {selectedChallenge === "gospel" && !journey && !isJourneyLoading ? (
          <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-card">
            <p className="font-black text-navy">Não foi possível carregar a leitura agora.</p>
            <button onClick={goHome} className="mt-4 rounded-2xl bg-navy px-5 py-3 font-black text-white">
              Voltar para início
            </button>
          </section>
        ) : null}

        {selectedChallenge === "quiz" && !journey ? (
          <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-card">
            <p className="font-black text-navy">Carregando quiz da Jornada da Fé...</p>
          </section>
        ) : null}

        {selectedChallenge === "quiz" && journeyQuizData ? (
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

        {selectedChallenge === "quiz" && journey && !journeyQuizData ? (
          <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-card">
            <p className="font-black text-navy">Quiz indisponível para esta missão.</p>
            <button onClick={goHome} className="mt-4 rounded-2xl bg-navy px-5 py-3 font-black text-white">
              Voltar para início
            </button>
          </section>
        ) : null}

        {selectedChallenge === "word" && !journey ? (
          <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-card">
            <p className="font-black text-navy">Carregando Palavra da Fé da Jornada...</p>
          </section>
        ) : null}

        {selectedChallenge === "word" && journeyWordData ? (
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

        {selectedChallenge === "word" && journey && !journeyWordData ? (
          <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-card">
            <p className="font-black text-navy">Palavra da Fé indisponível para esta missão.</p>
            <button onClick={goHome} className="mt-4 rounded-2xl bg-navy px-5 py-3 font-black text-white">
              Voltar para início
            </button>
          </section>
        ) : null}
      </div>

      {showNameModal ? (
        <PlayerNameModal
          currentName={progress.playerName}
          onSave={handlePlayerNameSave}
          onClose={() => setShowNameModal(false)}
        />
      ) : null}

      {showRankingModal ? <RankingModal progress={progress} onClose={() => setShowRankingModal(false)} /> : null}

      {showCommunityModal ? (
        <CommunityModal
          community={progress.community}
          onSave={handleCommunitySave}
          onClose={() => setShowCommunityModal(false)}
        />
      ) : null}

      {!progress.onboardingCompleted ? (
        <OnboardingModal onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      ) : null}
    </main>
  );
}
