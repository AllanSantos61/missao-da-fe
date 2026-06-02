"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function getChapterLabel(journey: CurrentReadingState) {
  const { book, chapterStart, chapterEnd } = journey.reading;
  if (chapterEnd && chapterEnd !== chapterStart) return `${book} ${chapterStart}-${chapterEnd}`;
  return `${book} ${chapterStart}`;
}

function getReadingParagraphs(text?: string) {
  return (text ?? "")
    .split(/\n{1,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

type DisplayVerse = {
  key: string;
  chapter: number;
  verse: number;
  text: string;
};

function stripLeadingVerseNumber(text: string) {
  return text.replace(/^\s*(\d+)[.)\s:-]+/, "").trim();
}

function getDisplayVerses(journey: CurrentReadingState, bibleText: ReturnType<typeof useBibleApiReading>): DisplayVerse[] {
  const apiVerses = Array.isArray(bibleText.reading?.verses) ? bibleText.reading.verses : [];
  if (apiVerses.length) {
    return apiVerses.map((verse) => ({
      key: `${verse.chapter}-${verse.verse}`,
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text.trim()
    }));
  }

  const paragraphs = getReadingParagraphs(bibleText.reading?.text);
  const startVerse = journey.reading.verseStart ?? 1;

  return paragraphs.map((paragraph, index) => ({
    key: `fallback-${journey.reading.chapterStart}-${startVerse + index}`,
    chapter: journey.reading.chapterStart,
    verse: startVerse + index,
    text: stripLeadingVerseNumber(paragraph)
  }));
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
  const isCompleted = Boolean(selectedCalendarDay?.readingCompleted || savedResult?.gospel?.completed);
  const bibleText = useBibleApiReading(journey.reading);
  const readingScrollRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(19);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [copiedVerseKey, setCopiedVerseKey] = useState<string | null>(null);
  const [favoriteVerseKeys, setFavoriteVerseKeys] = useState<string[]>([]);

  const totalPercent = Math.min(
    100,
    Number(((journey.progress.completedReadings / journey.progress.totalReadings) * 100).toFixed(1))
  );
  const completedAllAvailable = journey.progress.pendingCount === 0;
  const actionLabel = completedAllAvailable
    ? "Missão de hoje concluída. A próxima leitura será liberada amanhã."
    : journey.progress.pendingCount > 1
      ? `Você ainda tem ${journey.progress.pendingCount} missões disponíveis para recuperar.`
      : "Você tem uma missão disponível para concluir.";
  const chapterLabel = getChapterLabel(journey);
  const translationLabel = bibleText.reading?.translation
    ? bibleText.reading.translation.replace(/^almeida$/i, "Almeida")
    : "Almeida";
  const readingVerses = useMemo(() => getDisplayVerses(journey, bibleText), [bibleText, journey]);
  const canComplete = isCompleted || readingProgress >= 95;

  const updateReadingProgress = useCallback(() => {
    const element = readingScrollRef.current;
    if (!element) return;

    const maxScroll = element.scrollHeight - element.clientHeight;
    if (maxScroll <= 8) {
      setReadingProgress(100);
      return;
    }

    setReadingProgress(Math.min(100, Math.round((element.scrollTop / maxScroll) * 100)));
  }, []);

  useEffect(() => {
    setReadingProgress(0);
    setSelectedVerseKey(null);
    const timer = window.setTimeout(updateReadingProgress, 80);
    return () => window.clearTimeout(timer);
  }, [journey.selectedDay, bibleText.reading, updateReadingProgress]);

  async function handleCompleteReading() {
    if (isCompleted || isLocked || isCompleting || !canComplete) return;

    const nextState = await onCompleteReading(journey.selectedDay);
    onCompleteDaily({
      id: "gospel",
      completedAt: new Date().toISOString(),
      xpEarned: journey.reading.xpReward ?? readingXP,
      scoreLabel: `${nextState.progress.completedReadings}/${nextState.progress.totalReadings}`,
      gospel: { completed: true }
    });
    window.setTimeout(onNextMission, 250);
  }

  async function copyVerse(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVerseKey(key);
      window.setTimeout(() => setCopiedVerseKey(null), 1800);
    } catch {
      setCopiedVerseKey(null);
    }
  }

  function shareVerse(text: string) {
    const message = `${text}\n\n${journey.reading.reference}\nMissão da Fé`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function toggleFavoriteVerse(key: string) {
    setFavoriteVerseKeys((keys) =>
      keys.includes(key) ? keys.filter((favoriteKey) => favoriteKey !== key) : [...keys, key]
    );
  }

  const readerTheme = isDarkMode
    ? "border-white/10 bg-[#111827] text-white"
    : "border-navy/10 bg-[#FFFDF8] text-ink";
  const mutedText = isDarkMode ? "text-white/65" : "text-ink/62";

  return (
    <section className="rounded-[1.75rem] bg-altar p-4 shadow-card sm:p-5">
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
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${totalPercent}%` }} />
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
          onMilestoneClick={(dayNumber, title) =>
            void trackEvent({
              eventName: "calendar_milestone_clicked",
              userId: progress.anonymousUserId,
              playerName: progress.playerName,
              metadata: { dayNumber, title }
            })
          }
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

      <article className={`mt-5 overflow-hidden rounded-[1.75rem] border shadow-card transition-colors ${readerTheme}`}>
        <div className="sticky top-0 z-10 border-b border-current/10 bg-inherit">
          <div className="h-1 bg-current/10">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${readingProgress}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <button onClick={onBack} className="rounded-full bg-current/10 px-3 py-2 text-xs font-black">
              Voltar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize((size) => Math.max(16, size - 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-current/10 text-sm font-black"
                aria-label="Diminuir fonte"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize((size) => Math.min(24, size + 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-current/10 text-sm font-black"
                aria-label="Aumentar fonte"
              >
                A+
              </button>
              <button
                onClick={() => setIsDarkMode((value) => !value)}
                className="rounded-full bg-current/10 px-3 py-2 text-xs font-black"
              >
                {isDarkMode ? "Claro" : "Escuro"}
              </button>
            </div>
          </div>
        </div>

        <header className="px-5 pb-5 pt-6 sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">📖 Dia {journey.selectedDay} de 365</p>
          <h3 className={`mt-3 text-3xl font-black leading-tight ${isDarkMode ? "text-white" : "text-navy"}`}>{chapterLabel}</h3>
          <h4 className="mt-3 text-xl font-black leading-tight">{journey.reading.title}</h4>
          <p className={`mt-2 text-sm font-black ${isDarkMode ? "text-gold" : "text-navy"}`}>{journey.reading.reference}</p>
          <div className={`mt-4 flex flex-wrap gap-2 text-xs font-black ${mutedText}`}>
            <span className="rounded-full bg-current/10 px-3 py-1.5">Tradução: {translationLabel}</span>
            <span className="rounded-full bg-current/10 px-3 py-1.5">Tempo estimado: {journey.reading.estimatedMinutes} min</span>
            <span className="rounded-full bg-current/10 px-3 py-1.5">+{journey.reading.xpReward ?? readingXP} XP</span>
            <span className="rounded-full bg-current/10 px-3 py-1.5">Leitura {readingProgress}%</span>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-gold">
              <span>Novo Testamento</span>
              <span>{totalPercent.toLocaleString("pt-BR")}% concluído</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-current/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${totalPercent}%` }} />
            </div>
          </div>
        </header>

        {getLockedMessage(selectedStatus) ? (
          <div className="mx-5 mb-5 rounded-2xl bg-stone/15 p-4 text-sm font-bold leading-6 text-ink/70">
            {getLockedMessage(selectedStatus)}
          </div>
        ) : bibleText.isLoading ? (
          <div className="space-y-3 px-5 pb-6">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-navy/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-navy/10" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-navy/10" />
            <p className={`pt-2 text-sm font-bold ${mutedText}`}>Carregando texto bíblico pela Bible API...</p>
          </div>
        ) : (
          <>
            {bibleText.reading?.errorMessage ? (
              <div className="mx-5 mb-5 rounded-2xl bg-gold/15 p-4 text-sm font-bold leading-6 text-navy">
                {bibleText.reading.errorMessage}
              </div>
            ) : null}

            <div
              ref={readingScrollRef}
              onScroll={updateReadingProgress}
              className="max-h-[68vh] overflow-y-auto px-5 pb-6 sm:px-7"
            >
              <div className="mx-auto max-w-2xl space-y-2">
                {readingVerses.map((verse) => {
                  const verseText = `${verse.chapter}:${verse.verse} ${verse.text.trim()}`;
                  const selected = selectedVerseKey === verse.key;
                  const favorite = favoriteVerseKeys.includes(verse.key);

                  return (
                    <div
                      key={verse.key}
                      className={`rounded-2xl border transition ${
                        selected
                          ? "border-gold/60 bg-gold/18"
                          : isDarkMode
                            ? "border-white/8 bg-white/[0.03]"
                            : "border-navy/5 bg-white/55"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedVerseKey(selected ? null : verse.key)}
                        className="grid w-full grid-cols-[28px_1fr] gap-3 px-3 py-3 text-left sm:grid-cols-[34px_1fr] sm:px-4"
                      >
                        <span className="pt-1 text-right align-super text-[11px] font-black leading-none text-gold">
                          {verse.verse}
                        </span>
                        <span
                          className="font-serif leading-[1.95]"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {verse.text.trim()}
                        </span>
                      </button>
                      {selected ? (
                        <div className="flex flex-wrap gap-2 border-t border-current/10 px-4 py-3">
                          <button
                            onClick={() => copyVerse(verseText, verse.key)}
                            className="rounded-full bg-navy px-3 py-1.5 text-xs font-black text-white"
                          >
                            {copiedVerseKey === verse.key ? "Copiado" : "Copiar"}
                          </button>
                          <button
                            onClick={() => shareVerse(verseText)}
                            className="rounded-full bg-gold px-3 py-1.5 text-xs font-black text-navy"
                          >
                            Compartilhar
                          </button>
                          <button
                            onClick={() => toggleFavoriteVerse(verse.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-black ${
                              favorite ? "bg-faithGreen text-white" : "bg-current/10"
                            }`}
                          >
                            {favorite ? "Favoritado" : "Favoritar"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mx-auto mt-8 max-w-2xl border-t border-current/10 pt-5">
                {isCompleted ? (
                  <div className="rounded-2xl bg-gold/15 px-4 py-4 text-center text-sm font-black text-navy">
                    Dia {journey.selectedDay} concluído · +{selectedCalendarDay?.xpEarned ?? readingXP} XP
                  </div>
                ) : (
                  <>
                    {!canComplete ? (
                      <p className={`mb-3 text-center text-sm font-bold ${mutedText}`}>
                        Role até o fim da leitura para concluir a missão.
                      </p>
                    ) : null}
                    <button
                      onClick={handleCompleteReading}
                      disabled={isCompleting || isLocked || !canComplete}
                      className="w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card transition enabled:hover:-translate-y-0.5 enabled:hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone"
                    >
                      {isCompleting ? "Salvando leitura..." : "Concluir leitura"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </article>

      <div className="mt-5 rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-navy shadow-sm">
        {isCompleted ? `Leitura do Dia ${journey.selectedDay} concluída.` : actionLabel}
      </div>
    </section>
  );
}
