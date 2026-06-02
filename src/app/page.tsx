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
import { useJourneyMissionState } from "@/hooks/useJourneyMissionState";
import { trackEvent } from "@/services/analyticsService";
import { saveStandaloneWordResult } from "@/services/supabaseProgressService";
import type { ChallengeId, DailyChallengeResult, UserProgress } from "@/types/dailyProgress";
import { buildStandaloneWordShareUrl } from "@/utils/share";

const missionSteps: Array<{ id: ChallengeId; label: string; description: string }> = [
  { id: "gospel", label: "Leitura", description: "Leia o trecho do Novo Testamento de hoje." },
  { id: "quiz", label: "Quiz", description: "Responda 3 perguntas sobre a leitura." },
  { id: "word", label: "Palavra", description: "Descubra a palavra cristã de 5 letras." }
];

const achievements = [
  { day: 7, title: "Primeira Semana" },
  { day: 30, title: "30 Dias" },
  { day: 50, title: "Caminho Firme" },
  { day: 100, title: "Cem Dias de Fé" },
  { day: 180, title: "Metade da Jornada" },
  { day: 365, title: "Novo Testamento Completo" }
];

function getJourneyAvatar(day: number) {
  if (day >= 365) return "🏆";
  if (day >= 180) return "⭐";
  if (day >= 100) return "🌳";
  if (day >= 30) return "🌿";
  return "🌱";
}

function formatDateBR(dateKey: string | null) {
  if (!dateKey) return "Hoje";
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;
  return `${day}/${month}/${year}`;
}

export default function Home() {
  const router = useRouter();
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [wordMode, setWordMode] = useState<"mission" | "standalone">("mission");
  const [standaloneWordResult, setStandaloneWordResult] = useState<DailyChallengeResult | undefined>();
  const [homeNotice, setHomeNotice] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const dailyChallengeContent = useDailyChallengeContent();
  const {
    progress,
    todayHistory,
    isLoaded,
    fallbackNotice: progressFallbackNotice,
    refreshDay,
    completeChallenge,
    updatePlayerName,
    updateCommunity,
    updateReminderPreference,
    addXP,
    completeOnboarding
  } = useDailyProgress();
  const {
    journey,
    isLoading: isJourneyLoading,
    isCompleting: isJourneyCompleting,
    fallbackNotice: journeyFallbackNotice,
    selectJourneyDay,
    completeReading,
    completeJourneyPart
  } = useBibleJourney(
    progress?.localUserId || progress?.anonymousUserId || "",
    progress?.playerName ?? "",
    progress?.anonymousUserId
  );
  const todayMissionState = useJourneyMissionState(journey, todayHistory);

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
    if (mission === "palavra-avulsa") {
      openStandaloneWord();
      return;
    }
    if (mission === "gospel" || mission === "quiz" || mission === "word") {
      selectChallenge(mission);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getStepCompleted(challengeId: ChallengeId) {
    const status = todayMissionState.getMissionStatus(todayMissionState.currentMissionDay);
    if (challengeId === "gospel") return status.readingCompleted;
    if (challengeId === "quiz") return status.quizCompleted;
    return status.wordCompleted;
  }
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

  function openStandaloneWord() {
    setWordMode("standalone");
    setHomeNotice("");
    setSelectedChallenge("word");
    router.push("/?missao=palavra-avulsa", { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
    void trackEvent({
      eventName: "word_started",
      userId: progress?.anonymousUserId,
      playerName: progress?.playerName,
      metadata: { mode: "standalone", journeyDay: todayMissionState.currentMissionDay }
    });
  }

  function selectChallenge(challengeId: ChallengeId, mode: "mission" | "standalone" = "mission") {
    if (challengeId === "word" && mode === "standalone") {
      openStandaloneWord();
      return;
    }

    setWordMode(mode);
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
    const status = todayMissionState.getMissionStatus(todayMissionState.currentMissionDay);
    if (currentChallenge === "gospel" && !status.quizCompleted) return "quiz";
    if (currentChallenge === "quiz" && !status.wordCompleted) return "word";
    return null;
  }

  async function openMission(challengeId: ChallengeId, dayNumber = todayMissionState.currentMissionDay) {
    setWordMode("mission");
    if (journey && journey.selectedDay !== dayNumber) {
      await selectJourneyDay(dayNumber);
    }
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

      const nextMission = todayMissionState.nextPendingStep;
      if (!nextMission) {
        setHomeNotice("Missão de hoje concluída. A próxima missão será liberada amanhã.");
        return;
      }

      if (nextMission !== "gospel" && !journey?.mission) {
        void openMission("gospel");
        return;
      }

      void openMission(nextMission);
    } catch (error) {
      console.info("[Missão da Fé] Falha ao continuar missão; voltando para a Home.", error);
      setSelectedChallenge(null);
      setHomeNotice("Não foi possível abrir a missão agora. Tente novamente em instantes.");
      router.push("/");
    }
  }

  function goToNextMission(currentChallenge: ChallengeId) {
    const nextMission = getNextMission(currentChallenge);
    if (nextMission) void openMission(nextMission);
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
  const selectedMissionStatus = todayMissionState.getMissionStatus(journey?.selectedDay ?? todayMissionState.currentMissionDay);
  const currentJourneyDay = todayMissionState.currentMissionDay;
  const avatar = getJourneyAvatar(currentJourneyDay);
  const completedJourneyDays = todayMissionState.completedDays.length;
  const remainingJourneyDays = Math.max(0, 365 - completedJourneyDays);
  const walkingDays = todayMissionState.daysSinceStart + 1;
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
  const standaloneWordData = journeyWordData
    ? {
        ...journeyWordData,
        title: "Palavra da Fé de hoje",
        xp: Math.max(5, Math.round(journeyWordData.xp * 0.35))
      }
    : null;
  const journeyQuizResult = selectedMissionStatus.quizCompleted
    ? {
        id: "quiz" as const,
        completedAt: selectedJourneyDay?.completedDate ?? new Date().toISOString(),
        xpEarned: journey?.mission?.quizXp ?? dailyChallengeContent.quiz.xp,
        scoreLabel: "Concluído",
        quiz: { score: 3, total: 3, answers: {} }
      }
    : undefined;
  const journeyWordResult = selectedMissionStatus.wordCompleted
    ? {
        id: "word" as const,
        completedAt: selectedJourneyDay?.completedDate ?? new Date().toISOString(),
        xpEarned: journey?.mission?.wordXp ?? dailyChallengeContent.word.xp,
        scoreLabel: selectedJourneyDay?.wordAttempts ? `${selectedJourneyDay.wordAttempts}/6` : "Concluído",
        word: {
          solved: Boolean(selectedJourneyDay?.wordResult?.solved ?? true),
          attempts: selectedJourneyDay?.wordAttempts ?? 0,
          guesses: selectedJourneyDay?.wordAttemptsHistory?.map((item) => item.guess) ?? [],
          attemptsHistory: selectedJourneyDay?.wordAttemptsHistory ?? [],
          correctWord: selectedJourneyDay?.wordResult?.correctWord ?? journey?.mission?.normalizedFaithWord
        }
      }
    : undefined;

  function handleJourneyPartComplete(part: "quiz" | "word", result: DailyChallengeResult) {
    handleComplete(result);
    if (journey) {
      void completeJourneyPart(journey.selectedDay, part, result.xpEarned, result);
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

  function handleStandaloneWordComplete(result: DailyChallengeResult) {
    setStandaloneWordResult(result);
    addXP(result.xpEarned);
    if (progress) {
      void saveStandaloneWordResult(progress, result).catch((error) => {
        console.info("[Missão da Fé] Palavra avulsa salva apenas localmente.", error);
      });
      void trackEvent({
        eventName: "word_completed",
        userId: progress.anonymousUserId,
        playerName: progress.playerName,
        metadata: {
          mode: "standalone",
          xpEarned: result.xpEarned,
          scoreLabel: result.scoreLabel,
          journeyDay: todayMissionState.currentMissionDay
        }
      });
    }
  }

  function shareStandaloneWord(result?: DailyChallengeResult) {
    const wordResult = result?.word;
    if (!wordResult || typeof window === "undefined") return;
    window.open(
      buildStandaloneWordShareUrl({
        attempts: wordResult.attempts,
        solved: wordResult.solved,
        url: window.location.origin
      }),
      "_blank",
      "noopener,noreferrer"
    );
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
        onSelectChallenge={(challengeId) =>
          challengeId === "word" ? selectChallenge("word", "standalone") : selectChallenge(challengeId)
        }
        onOpenName={() => setShowNameModal(true)}
        onOpenRanking={openRanking}
        onOpenCommunity={() => setShowCommunityModal(true)}
      />

      <div className="mx-auto mt-4 flex w-full max-w-3xl flex-col gap-4">
        {progressFallbackNotice || journeyFallbackNotice ? (
          <div className="rounded-2xl bg-gold/15 px-4 py-3 text-sm font-black leading-5 text-navy shadow-sm">
            {progressFallbackNotice || journeyFallbackNotice}
          </div>
        ) : null}

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
                {todayMissionState.isMissionCompleted
                  ? `Dia ${todayMissionState.journeyDay} concluído`
                  : `Dia ${todayMissionState.journeyDay} de 365`}
              </h1>
              <p className="mt-3 text-lg font-black leading-7 text-ink">
                {todayMissionState.isMissionCompleted
                  ? "Você completou sua missão de hoje."
                  : "Sua missão diária está pronta."}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
                {todayMissionState.isMissionCompleted
                  ? "A próxima missão será liberada amanhã."
                  : "Leia o Novo Testamento em apenas 10 minutos por dia."}
              </p>
              {todayMissionState.canContinueToday ? (
                <button
                  onClick={continueDailyMission}
                  className="mt-5 w-full rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card transition hover:-translate-y-0.5"
                >
                  {todayMissionState.primaryActionLabel}
                </button>
              ) : (
                <div className="mt-5 space-y-3">
                  <ShareResultButton progress={progress} todayHistory={todayHistory} />
                  <p className="rounded-2xl bg-parchment px-4 py-3 text-sm font-black text-navy">
                    Próxima missão em: {todayMissionState.nextMissionCountdown}
                  </p>
                </div>
              )}
              {homeNotice ? (
                <p className="mt-3 rounded-2xl bg-parchment px-4 py-3 text-sm font-black text-navy">
                  {homeNotice}
                </p>
              ) : null}
            </section>

            <section className="rounded-[1.75rem] bg-navy p-4 text-white shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Sua Jornada</p>
              <h2 className="mt-1 text-2xl font-black">📅 Sua Jornada</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-white/75">
                Iniciada há {walkingDays} {walkingDays === 1 ? "dia" : "dias"}.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">📅 Início da jornada</p>
                  <p className="font-black">{formatDateBR(todayMissionState.journeyStartDate)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">📖 Dia atual</p>
                  <p className="font-black">{todayMissionState.currentMissionDay}/365</p>
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
                  <p className="text-white/60">📖 Dias concluídos</p>
                  <p className="font-black">{completedJourneyDays}/365</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">🎯 Dias restantes</p>
                  <p className="font-black">{remainingJourneyDays}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-white/76">
                Você entende onde começou, onde está e quanto falta para concluir todo o Novo Testamento.
              </p>
            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Missão do Dia</p>
                  <h2 className="mt-1 text-2xl font-black text-navy">Progresso do dia</h2>
                </div>
                <span className="rounded-full bg-parchment px-4 py-2 text-sm font-black text-navy">
                  {todayMissionState.completedCount}/{todayMissionState.totalSteps}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {missionSteps.map((step) => {
                  const completed = getStepCompleted(step.id);
                  const isNextStep = step.id === todayMissionState.nextPendingStep;
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
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${completed ? "bg-faithGreen/12 text-faithGreen" : isNextStep ? "bg-gold/15 text-navy" : "bg-stone/20 text-ink/55"}`}>
                        {completed ? "Concluído" : isNextStep ? "Disponível" : "Bloqueada"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              {missionSteps.map((step) => {
                const completed = getStepCompleted(step.id);
                const status = completed ? "Concluído" : step.id === todayMissionState.nextPendingStep ? "Disponível" : "Bloqueada";
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
                      {completed ? (
                        <p className="mt-2 text-xs font-black uppercase tracking-wide text-faithGreen">
                          XP já recebido
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => selectChallenge(step.id)}
                      className="mt-4 w-full rounded-2xl bg-navy px-4 py-3 text-sm font-black text-white"
                    >
                      {completed ? "Rever" : status === "Bloqueada" ? "Abrir etapa" : "Começar"}
                    </button>
                  </article>
                );
              })}
            </section>

            {journey ? (
              <section className="space-y-3">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-card">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Sua Jornada</p>
                  <h2 className="mt-1 text-2xl font-black text-navy">
                    Dia {todayMissionState.currentMissionDay} de 365
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-ink/62">
                    Início: {formatDateBR(todayMissionState.journeyStartDate)} · Concluídos: {completedJourneyDays}/365
                  </p>
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
                <p>📖 Dia {todayMissionState.currentMissionDay}/365</p>
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

        {selectedChallenge === "word" && (wordMode === "standalone" ? standaloneWordData : journeyWordData) ? (
          <WordFaithGame
            data={(wordMode === "standalone" ? standaloneWordData : journeyWordData)!}
            savedResult={wordMode === "standalone" ? standaloneWordResult : journeyWordResult}
            progress={progress}
            todayHistory={todayHistory}
            wordMode={wordMode}
            autoAdvanceOnComplete={wordMode === "mission"}
            ctaLabel="Agora complete sua missão de hoje"
            onStandaloneShare={shareStandaloneWord}
            onComplete={(result) =>
              wordMode === "standalone"
                ? handleStandaloneWordComplete(result)
                : handleJourneyPartComplete("word", result)
            }
            onNextMission={() =>
              wordMode === "standalone" ? void openMission(todayMissionState.nextPendingStep ?? "gospel") : goToNextMission("word")
            }
            nextMissionLabel={wordMode === "standalone" ? "Completar Missão" : getNextMissionLabel("word")}
            onBack={goHome}
          />
        ) : null}

        {selectedChallenge === "word" && journey && !(wordMode === "standalone" ? standaloneWordData : journeyWordData) ? (
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
