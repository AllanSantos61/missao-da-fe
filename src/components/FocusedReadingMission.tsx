"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBibleApiReading } from "@/hooks/useBibleApiReading";
import { readingXP } from "@/services/bibleJourneyService";
import type { CurrentReadingState } from "@/types/bibleJourney";

type FocusedReadingMissionProps = {
  journey: CurrentReadingState;
  isCompleting: boolean;
  isCompleted: boolean;
  onComplete: () => Promise<void>;
};

type DisplayVerse = {
  key: string;
  chapter: number;
  verse: number;
  text: string;
};

function getChapterLabel(journey: CurrentReadingState) {
  const { book, chapterStart, chapterEnd } = journey.reading;
  if (chapterEnd && chapterEnd !== chapterStart) return `${book} ${chapterStart}-${chapterEnd}`;
  return `${book} ${chapterStart}`;
}

function stripLeadingVerseNumber(text: string) {
  return text.replace(/^\s*(\d+)[.)\s:-]+/, "").trim();
}

function getParagraphs(text?: string) {
  return (text ?? "")
    .split(/\n{1,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
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

  const startVerse = journey.reading.verseStart ?? 1;
  return getParagraphs(bibleText.reading?.text).map((paragraph, index) => ({
    key: `fallback-${journey.reading.chapterStart}-${startVerse + index}`,
    chapter: journey.reading.chapterStart,
    verse: startVerse + index,
    text: stripLeadingVerseNumber(paragraph)
  }));
}

export function FocusedReadingMission({ journey, isCompleting, isCompleted, onComplete }: FocusedReadingMissionProps) {
  const router = useRouter();
  const bibleText = useBibleApiReading(journey.reading);
  const readingScrollRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(19);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [copiedVerseKey, setCopiedVerseKey] = useState<string | null>(null);
  const [completedNow, setCompletedNow] = useState(false);

  const chapterLabel = getChapterLabel(journey);
  const readingVerses = useMemo(() => getDisplayVerses(journey, bibleText), [bibleText, journey]);
  const translationLabel = bibleText.reading?.translation
    ? bibleText.reading.translation.replace(/^almeida$/i, "Almeida")
    : "Almeida";
  const canComplete = isCompleted || completedNow || readingProgress >= 95;
  const xp = journey.reading.xpReward ?? readingXP;
  const totalPercent = Math.min(
    100,
    Number(((journey.progress.completedReadings / journey.progress.totalReadings) * 100).toFixed(1))
  );

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
    const timer = window.setTimeout(updateReadingProgress, 120);
    return () => window.clearTimeout(timer);
  }, [journey.selectedDay, bibleText.reading, updateReadingProgress]);

  async function handleComplete() {
    if (!canComplete || isCompleting || isCompleted || completedNow) return;
    await onComplete();
    setCompletedNow(true);
  }

  async function copyVerse(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVerseKey(key);
      window.setTimeout(() => setCopiedVerseKey(null), 1600);
    } catch {
      setCopiedVerseKey(null);
    }
  }

  function shareVerse(text: string) {
    const message = `${text}\n\n${journey.reading.reference}\nMissão da Fé`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const readerTheme = isDarkMode
    ? "bg-[#111827] text-white"
    : "bg-[#FFFDF8] text-ink";
  const mutedText = isDarkMode ? "text-white/65" : "text-ink/62";

  return (
    <main className={`min-h-screen ${isDarkMode ? "bg-[#0B1220]" : "bg-parchment"} text-ink`}>
      <div className="fixed left-0 right-0 top-0 z-30 h-1 bg-navy/10">
        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${readingProgress}%` }} />
      </div>

      <section className={`mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-8 pt-4 sm:px-6 ${readerTheme}`}>
        <header className="sticky top-1 z-20 -mx-4 border-b border-current/10 bg-inherit px-4 py-3 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => router.push("/")} className="rounded-full bg-current/10 px-4 py-2 text-sm font-black">
              Voltar
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setFontSize((size) => Math.max(16, size - 1))} className="grid h-9 w-9 place-items-center rounded-full bg-current/10 text-xs font-black">
                A-
              </button>
              <button onClick={() => setFontSize((size) => Math.min(25, size + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-current/10 text-xs font-black">
                A+
              </button>
              <button onClick={() => setIsDarkMode((value) => !value)} className="rounded-full bg-current/10 px-3 py-2 text-xs font-black">
                {isDarkMode ? "Claro" : "Escuro"}
              </button>
            </div>
          </div>
        </header>

        <div className="pt-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Dia {journey.selectedDay} de 365</p>
          <h1 className={`mt-3 text-4xl font-black leading-tight ${isDarkMode ? "text-white" : "text-navy"}`}>
            {chapterLabel}
          </h1>
          <h2 className="mt-3 text-xl font-black leading-snug">{journey.reading.title}</h2>
          <p className={`mt-2 text-sm font-black ${isDarkMode ? "text-gold" : "text-navy"}`}>{journey.reading.reference}</p>
          <div className={`mt-4 flex flex-wrap gap-2 text-xs font-black ${mutedText}`}>
            <span className="rounded-full bg-current/10 px-3 py-1.5">Tradução: {translationLabel}</span>
            <span className="rounded-full bg-current/10 px-3 py-1.5">Tempo estimado: {journey.reading.estimatedMinutes} min</span>
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
        </div>

        {bibleText.isLoading ? (
          <div className="mt-8 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-navy/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-navy/10" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-navy/10" />
            <p className={`pt-2 text-sm font-bold ${mutedText}`}>Carregando texto bíblico...</p>
          </div>
        ) : (
          <div ref={readingScrollRef} onScroll={updateReadingProgress} className="mt-6 flex-1 overflow-y-auto pb-8">
            {bibleText.reading?.errorMessage ? (
              <div className="mb-5 rounded-2xl bg-gold/15 p-4 text-sm font-bold leading-6 text-navy">
                {bibleText.reading.errorMessage}
              </div>
            ) : null}

            <div className="space-y-2">
              {readingVerses.map((verse) => {
                const selected = selectedVerseKey === verse.key;
                const verseText = `${verse.chapter}:${verse.verse} ${verse.text.trim()}`;
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
                      className="grid w-full grid-cols-[30px_1fr] gap-3 px-3 py-3 text-left"
                    >
                      <span className="pt-1 text-right text-[11px] font-black leading-none text-gold">{verse.verse}</span>
                      <span className="font-serif leading-[1.95]" style={{ fontSize: `${fontSize}px` }}>
                        {verse.text.trim()}
                      </span>
                    </button>
                    {selected ? (
                      <div className="flex flex-wrap gap-2 border-t border-current/10 px-4 py-3">
                        <button onClick={() => copyVerse(verseText, verse.key)} className="rounded-full bg-navy px-3 py-1.5 text-xs font-black text-white">
                          {copiedVerseKey === verse.key ? "Copiado" : "Copiar"}
                        </button>
                        <button onClick={() => shareVerse(verseText)} className="rounded-full bg-gold px-3 py-1.5 text-xs font-black text-navy">
                          Compartilhar
                        </button>
                        <button className="rounded-full bg-current/10 px-3 py-1.5 text-xs font-black">
                          Favoritar
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t border-current/10 pt-5">
              {isCompleted || completedNow ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-faithGreen/12 px-4 py-4 text-center font-black text-faithGreen">
                    ✓ Leitura concluída · +{xp} XP
                  </div>
                  <button onClick={() => router.push(`/quiz/${journey.selectedDay}`)} className="w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card">
                    Continuar para Quiz
                  </button>
                </div>
              ) : (
                <>
                  {!canComplete ? (
                    <p className={`mb-3 text-center text-sm font-bold ${mutedText}`}>
                      Role até o fim da leitura para concluir.
                    </p>
                  ) : null}
                  <button
                    onClick={handleComplete}
                    disabled={isCompleting || !canComplete}
                    className="w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card transition enabled:hover:-translate-y-0.5 enabled:hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone"
                  >
                    {isCompleting ? "Salvando leitura..." : "Concluir leitura"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
