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
import { PwaInstallButton } from "@/components/PwaInstallButton";
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

type HomeTab = "home" | "journey" | "achievements" | "profile";

const missionSteps: Array<{ id: ChallengeId; label: string; description: string }> = [
  { id: "gospel", label: "Leitura", description: "Leia o trecho do Novo Testamento de hoje." },
  { id: "quiz", label: "Quiz", description: "Responda 3 perguntas sobre a leitura." },
  { id: "word", label: "Palavra", description: "Descubra a palavra cristã de 5 letras." }
];

const achievements = [
  { day: 1, title: "Primeiro Dia", description: "A caminhada começou." },
  { day: 7, title: "Primeira Semana" },
  { day: 30, title: "30 Dias" },
  { day: 50, title: "Caminho Firme" },
  { day: 100, title: "Cem Dias de Fé" },
  { day: 40, title: "Mateus concluído" },
  { day: 135, title: "Evangelhos concluídos" },
  { day: 180, title: "Metade da Jornada" },
  { day: 365, title: "Novo Testamento Completo" }
];

const bottomNavItems: Array<{ id: HomeTab; label: string; icon: string }> = [
  { id: "home", label: "Início", icon: "🏠" },
  { id: "journey", label: "Jornada", icon: "📅" },
  { id: "achievements", label: "Conquistas", icon: "🏆" },
  { id: "profile", label: "Perfil", icon: "👤" }
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
  const [activeTab, setActiveTab] = useState<HomeTab>("home");
  const [wordMode, setWordMode] = useState<"mission" | "standalone">("mission");
  const [standaloneWordResult, setStandaloneWordResult] = useState<DailyChallengeResult | undefined>();
  const [homeNotice, setHomeNotice] = useState("");
  const [isOnline, setIsOnline] = useState(true);
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
    syncStatus,
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
    if (typeof navigator === "undefined") return;
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

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

  useEffect(() => {
    const activeSyncError = isOnline && syncStatus === "error" && journey?.source !== "supabase" && Boolean(progressFallbackNotice || journeyFallbackNotice);
    console.log("[SyncBanner]", {
      isOnline,
      syncStatus,
      journeySource: journey?.source,
      activeSyncError,
      reason: !isOnline
        ? "offline"
        : syncStatus === "syncing"
          ? "sincronizando"
          : activeSyncError
            ? "erro ativo"
            : "sem banner"
    });
  }, [isOnline, journey?.source, journeyFallbackNotice, progressFallbackNotice, syncStatus]);

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
    setActiveTab("home");
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
  const hasSyncError = isOnline && syncStatus === "error" && journey?.source !== "supabase" && Boolean(progressFallbackNotice || journeyFallbackNotice);
  const statusBanner = !isOnline
    ? "⚠️ Você está sem conexão com a internet. Sua jornada continuará funcionando normalmente e seu progresso será sincronizado quando a conexão voltar."
    : isJourneyCompleting || syncStatus === "syncing"
      ? "🔄 Sincronizando seu progresso..."
      : hasSyncError
        ? "⚠️ Não foi possível sincronizar seus dados agora. Seu progresso continua salvo neste dispositivo."
        : "";

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
    <main className="min-h-screen bg-parchment px-4 pb-28 text-ink">
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
        {statusBanner ? (
          <div className="rounded-2xl bg-gold/15 px-4 py-3 text-sm font-black leading-5 text-navy shadow-sm">
            {statusBanner}
          </div>
        ) : null}

        {!selectedChallenge && activeTab === "home" ? (
          <>
            <section className="rounded-[2rem] bg-white p-5 text-center shadow-card">
              <div className="flex items-center justify-center gap-3">
                <MissaoDaFeLogo size="header" />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-parchment text-2xl shadow-sm">
                  {avatar}
                </span>
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-gold">Missão diária</p>
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
              {todayMissionState.canContinueToday ? (
                <button
                  onClick={continueDailyMission}
                  className="mt-5 w-full rounded-2xl bg-gold px-5 py-4 font-black text-navy shadow-card transition hover:-translate-y-0.5"
                >
                  Continuar Missão
                </button>
              ) : (
                <p className="mt-5 rounded-2xl bg-parchment px-4 py-3 text-sm font-black text-navy">
                  Próxima missão em: {todayMissionState.nextMissionCountdown}
                </p>
              )}
              {homeNotice ? (
                <p className="mt-3 rounded-2xl bg-parchment px-4 py-3 text-sm font-black text-navy">
                  {homeNotice}
                </p>
              ) : null}
            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Progresso do dia</p>
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
                      className="flex items-center justify-between rounded-2xl bg-parchment px-4 py-3 text-left"
                    >
                      <span className="flex items-center gap-3 font-black text-navy">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${completed ? "bg-faithGreen text-white" : "bg-white text-navy"}`}>
                          {completed ? "✓" : ""}
                        </span>
                        {step.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${completed ? "bg-faithGreen/12 text-faithGreen" : isNextStep ? "bg-gold/15 text-navy" : "bg-stone/20 text-ink/55"}`}>
                        {completed ? "Concluído" : isNextStep ? "Agora" : "Pendente"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-2">
              <MiniStat label="XP total" value={progress.totalXP} />
              <MiniStat label="Sequência" value={`${journey?.progress.currentStreak ?? progress.currentStreak}d`} />
              <button onClick={openRanking} className="rounded-2xl bg-navy p-3 text-left text-white shadow-card">
                <p className="text-[11px] font-black uppercase tracking-wide text-gold">Ranking</p>
                <p className="mt-1 text-lg font-black">{progress.weeklyXP > 0 ? `${progress.weeklyXP} XP` : "Entrar"}</p>
              </button>
            </section>
          </>
        ) : null}

        {!selectedChallenge && activeTab === "journey" ? (
          <section className="space-y-3">
            <section className="rounded-[1.75rem] bg-navy p-4 text-white shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Jornada</p>
              <h2 className="mt-1 text-2xl font-black">📅 Dia {todayMissionState.currentMissionDay} de 365</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <JourneyMetric label="Início" value={formatDateBR(todayMissionState.journeyStartDate)} />
                <JourneyMetric label="Caminhada" value={`${walkingDays} dias`} />
                <JourneyMetric label="Concluídos" value={`${completedJourneyDays}/365`} />
                <JourneyMetric label="Restantes" value={remainingJourneyDays} />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-black text-white/70">
                  <span>Novo Testamento</span>
                  <span>{Math.max(1, Math.round((completedJourneyDays / 365) * 100))}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(1, (completedJourneyDays / 365) * 100)}%` }} />
                </div>
              </div>
            </section>
            {journey ? (
              <JourneyCalendar365
                days={journey.calendar}
                selectedDay={journey.selectedDay}
                onSelectDay={selectJourneyDay}
                onMilestoneClick={(dayNumber, title) =>
                  void trackEvent({
                    eventName: "calendar_milestone_clicked",
                    userId: progress.anonymousUserId,
                    playerName: progress.playerName,
                    metadata: { dayNumber, title, source: "journey-tab" }
                  })
                }
              />
            ) : null}
          </section>
        ) : null}

        {!selectedChallenge && activeTab === "achievements" ? (
          <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Conquistas</p>
            <h2 className="mt-1 text-2xl font-black text-navy">Marcos da caminhada</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {achievements.map((achievement) => {
                const unlocked = currentJourneyDay >= achievement.day;
                return (
                  <div
                    key={achievement.title}
                    className={`min-h-[118px] rounded-2xl p-4 ${
                      unlocked ? "bg-gold/15 text-navy ring-1 ring-gold/30" : "bg-parchment text-ink/48"
                    }`}
                  >
                    <p className="text-2xl">{unlocked ? "🏅" : "○"}</p>
                    <p className="mt-2 text-sm font-black leading-5">{achievement.title}</p>
                    <p className="mt-1 text-xs font-bold">Dia {achievement.day}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {!selectedChallenge && activeTab === "profile" ? (
          <>
            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Perfil</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-navy">{progress.playerName || "Minha conta"}</h2>
                  <p className="mt-1 text-sm font-bold text-ink/60">Cada passo fortalece sua caminhada de fé.</p>
                </div>
                <button onClick={() => setShowNameModal(true)} className="rounded-full bg-gold px-4 py-2 text-xs font-black text-navy">
                  Editar
                </button>
              </div>
            </section>

            <section className="rounded-[1.75rem] bg-navy p-4 text-white shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Minha Jornada</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <JourneyMetric label="Iniciou em" value={formatDateBR(todayMissionState.journeyStartDate)} />
                <JourneyMetric label="Caminhando há" value={`${walkingDays} dias`} />
                <JourneyMetric label="Concluídos" value={`${completedJourneyDays}/365`} />
                <JourneyMetric label="Novo Testamento" value={`${Math.max(1, Math.round((completedJourneyDays / 365) * 100))}%`} />
                <JourneyMetric label="XP total" value={progress.totalXP} />
                <JourneyMetric label="Maior sequência" value={`${progress.bestStreak} dias`} />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <button onClick={openRanking} className="rounded-2xl bg-white p-4 text-left font-black text-navy shadow-card">
                🏆 Ranking da Semana
                <span className="mt-1 block text-sm text-ink/58">{progress.weeklyXP} XP esta semana</span>
              </button>
              <button onClick={() => setShowCommunityModal(true)} className="rounded-2xl bg-white p-4 text-left font-black text-navy shadow-card">
                ⛪ Minha comunidade
                <span className="mt-1 block text-sm text-ink/58">Cidade, paróquia e grupo</span>
              </button>
            </section>

            <ReminderCard progress={progress} onSave={updateReminderPreference} />

            <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
              <p className="text-xl font-black text-navy">Compartilhar jornada</p>
              <div className="mt-3 rounded-2xl bg-parchment p-4 text-sm font-bold leading-7 text-navy">
                <p>🙏 Missão da Fé</p>
                <p>📖 Dia {todayMissionState.currentMissionDay}/365</p>
                <p>🔥 Sequência {progress.currentStreak} dias</p>
                <p>⭐ {progress.totalXP} XP</p>
              </div>
              <div className="mt-4">
                <ShareResultButton progress={progress} todayHistory={todayHistory} />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="font-black text-navy">Tema</p>
                <p className="mt-1 text-sm font-bold text-ink/58">Claro, com modo escuro na leitura.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="font-black text-navy">Fonte</p>
                <p className="mt-1 text-sm font-bold text-ink/58">Ajustável na tela de leitura.</p>
              </div>
              <PwaInstallButton progress={progress} />
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

      {!selectedChallenge ? (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white/95 px-3 py-2 shadow-[0_-12px_30px_rgba(18,53,91,0.08)] backdrop-blur">
          <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1 rounded-2xl bg-parchment p-1 sm:max-w-md">
            {bottomNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`rounded-xl px-1 py-2 text-center text-[11px] font-black transition ${
                    active ? "bg-navy text-white shadow-sm" : "text-navy/62"
                  }`}
                >
                  <span className="block text-lg leading-none">{item.icon}</span>
                  <span className="mt-1 block">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}

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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-left shadow-card">
      <p className="text-[11px] font-black uppercase tracking-wide text-gold">{label}</p>
      <p className="mt-1 text-lg font-black text-navy">{value}</p>
    </div>
  );
}

function JourneyMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-white/60">{label}</p>
      <p className="font-black">{value}</p>
    </div>
  );
}
