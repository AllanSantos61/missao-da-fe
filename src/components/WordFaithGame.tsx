"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyChallengeData } from "@/types/dailyChallenge";
import type { DailyChallengeResult, DayHistory, UserProgress, WordAttemptHistoryItem } from "@/types/dailyProgress";
import { ChallengeActionBar } from "@/components/ChallengeActionBar";
import { ChallengeStatusStrip } from "@/components/ChallengeStatusStrip";
import { getWordLetterStatuses, normalizeWord } from "@/utils/wordUtils";

type WordFaithGameProps = {
  data: DailyChallengeData["word"];
  savedResult?: DailyChallengeResult;
  progress: UserProgress;
  todayHistory: DayHistory;
  wordMode?: "mission" | "standalone";
  ctaLabel?: string;
  onStandaloneShare?: (result: DailyChallengeResult) => void;
  autoAdvanceOnComplete?: boolean;
  onComplete: (result: DailyChallengeResult) => void;
  onNextMission: () => void;
  nextMissionLabel: string;
  onBack: () => void;
};

const statusClasses = {
  correct: "bg-faithGreen text-white border-faithGreen",
  present: "bg-gold text-ink border-gold",
  absent: "bg-stone text-white border-stone",
  empty: "bg-white text-ink border-navy/10"
};

const keyStatusClasses = {
  correct: "bg-faithGreen text-white border-faithGreen",
  present: "bg-gold text-ink border-gold",
  absent: "bg-stone text-white border-stone",
  empty: "bg-[#F6EFE3] text-navy border-navy/10"
};

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function WordFaithGame({
  data,
  savedResult,
  progress,
  todayHistory,
  wordMode = "mission",
  ctaLabel,
  onStandaloneShare,
  autoAdvanceOnComplete = true,
  onComplete,
  onNextMission,
  nextMissionLabel,
  onBack
}: WordFaithGameProps) {
  const secret = useMemo(() => normalizeWord(data.secret).slice(0, 5), [data.secret]);
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<string[]>(savedResult?.word?.guesses ?? []);
  const [error, setError] = useState("");
  const completed = Boolean(savedResult);
  const savedAttemptsHistory = useMemo(
    () => savedResult?.word?.attemptsHistory ?? [],
    [savedResult?.word?.attemptsHistory]
  );
  const reviewGuesses = savedAttemptsHistory.length
    ? savedAttemptsHistory.map((item) => normalizeWord(item.guess).slice(0, 5))
    : guesses;
  const displayGuesses = completed ? reviewGuesses : guesses;
  const hasDetailedHistory = !completed || displayGuesses.length > 0;
  const solved = completed ? Boolean(savedResult?.word?.solved) : guesses.includes(secret);
  const attemptsEnded = completed || solved || guesses.length >= 6;

  const keyStatuses = useMemo(() => {
    const statuses: Record<string, keyof typeof statusClasses> = {};
    const priority = { correct: 3, present: 2, absent: 1, empty: 0 };

    displayGuesses.forEach((guess, guessIndex) => {
      const storedStatuses = savedAttemptsHistory[guessIndex]?.result;
      const statusesForGuess = storedStatuses?.length ? storedStatuses : getWordLetterStatuses(guess, secret);
      statusesForGuess.forEach((status, index) => {
        const letter = guess[index];
        const current = statuses[letter] ?? "empty";
        if (priority[status] > priority[current]) {
          statuses[letter] = status;
        }
      });
    });

    return statuses;
  }, [displayGuesses, savedAttemptsHistory, secret]);

  function buildAttemptsHistory(nextGuesses: string[]): WordAttemptHistoryItem[] {
    return nextGuesses.map((guess) => ({
      guess,
      result: getWordLetterStatuses(guess, secret)
    }));
  }

  function finish(nextGuesses: string[], didSolve: boolean) {
    const result: DailyChallengeResult = {
      id: "word",
      completedAt: new Date().toISOString(),
      xpEarned: didSolve ? data.xp : Math.round(data.xp / 2),
      scoreLabel: didSolve ? `${nextGuesses.length}/6` : "Não resolvida",
      word: {
        solved: didSolve,
        attempts: nextGuesses.length,
        guesses: nextGuesses,
        attemptsHistory: buildAttemptsHistory(nextGuesses),
        correctWord: secret
      }
    };
    onComplete(result);
    if (autoAdvanceOnComplete) window.setTimeout(onNextMission, 250);
  }

  function handleSubmitGuess() {
    if (attemptsEnded) return;

    const normalizedInput = normalizeWord(input).slice(0, 5);

    if (normalizedInput.length < 5) {
      setError("Digite uma palavra com 5 letras.");
      return;
    }

    const nextGuesses = [...guesses, normalizedInput];
    const didSolve = normalizedInput === secret;

    setGuesses(nextGuesses);
    setInput("");
    setError("");

    if (didSolve || nextGuesses.length === 6) {
      finish(nextGuesses, didSolve);
    }
  }

  function handleLetter(letter: string) {
    if (attemptsEnded) return;
    setInput((current) => normalizeWord(`${current}${letter}`).slice(0, 5));
    setError("");
  }

  function handleBackspace() {
    if (attemptsEnded) return;
    setInput((current) => current.slice(0, -1));
  }

  useEffect(() => {
    function handlePhysicalKeyboard(event: KeyboardEvent) {
      if (completed) return;

      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitGuess();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        handleLetter(event.key);
      }
    }

    window.addEventListener("keydown", handlePhysicalKeyboard);
    return () => window.removeEventListener("keydown", handlePhysicalKeyboard);
  });

  return (
    <section className="flex min-h-[calc(100vh-112px)] flex-col rounded-[1.75rem] bg-altar px-4 py-4 shadow-card sm:p-5">
      <ChallengeActionBar
        isCompleted={completed}
        nextMissionLabel={nextMissionLabel}
        onBack={onBack}
        onNextMission={onNextMission}
      />
      <div className="mt-3">
        <ChallengeStatusStrip challengeId="word" xp={data.xp} progress={progress} todayHistory={todayHistory} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-gold sm:mt-5">
        {wordMode === "standalone" ? "Palavra da Fé avulsa" : "Palavra da Fé"}
      </p>
      <h2 className="mt-1 text-2xl font-black text-ink sm:mt-2 sm:text-3xl">{data.title}</h2>
      <p className="mt-1 text-sm leading-6 text-ink/68 sm:mt-2 sm:text-base sm:leading-7">
        {wordMode === "standalone"
          ? "Descubra a palavra católica de 5 letras e depois complete sua missão."
          : "Descubra a palavra católica de 5 letras."}
      </p>

      <div className="mx-auto mt-4 space-y-1.5 sm:mt-5 sm:space-y-2">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const guess = displayGuesses[rowIndex] ?? "";
          const rowLetters = rowIndex === guesses.length && !completed ? input : guess;
          const storedStatuses = savedAttemptsHistory[rowIndex]?.result;
          const statuses = guess ? (storedStatuses?.length ? storedStatuses : getWordLetterStatuses(guess, secret)) : [];

          return (
            <div
              key={rowIndex}
              className="grid justify-center gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: "repeat(5, clamp(42px, 11vw, 56px))" }}
            >
              {Array.from({ length: 5 }).map((__, letterIndex) => {
                const status = statuses[letterIndex] ?? "empty";

                return (
                  <div
                    key={`${rowIndex}-${letterIndex}`}
                    className={`flex aspect-square items-center justify-center rounded-lg border text-xl font-black shadow-sm transition sm:rounded-xl sm:text-2xl ${statusClasses[status]}`}
                  >
                    {rowLetters[letterIndex] ?? ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-4 w-full max-w-[420px] sm:mt-5">
        <div className="space-y-1.5 sm:space-y-2">
          {keyboardRows.map((row, rowIndex) => (
            <div key={row} className={`flex justify-center gap-1 ${rowIndex === 1 ? "px-3" : ""} sm:gap-1.5`}>
              {rowIndex === 2 ? (
                <button
                  onClick={handleSubmitGuess}
                  disabled={attemptsEnded}
                  className="h-[38px] flex-[1.7] rounded-lg bg-navy px-1.5 text-[11px] font-black text-white shadow-sm transition disabled:bg-stone sm:h-11 sm:px-3 sm:text-xs"
                >
                  Confirmar
                </button>
              ) : null}
              {row.split("").map((letter) => {
                const status = keyStatuses[letter] ?? "empty";

                return (
                  <button
                    key={letter}
                    onClick={() => handleLetter(letter)}
                    disabled={attemptsEnded}
                    className={`h-[38px] min-w-0 flex-1 rounded-lg border px-0.5 text-xs font-black shadow-sm transition disabled:opacity-70 sm:h-11 sm:text-sm ${keyStatusClasses[status]}`}
                  >
                    {letter}
                  </button>
                );
              })}
              {rowIndex === 2 ? (
                <button
                  onClick={handleBackspace}
                  disabled={attemptsEnded}
                  className="h-[38px] flex-[1.45] rounded-lg border border-navy/10 bg-[#F6EFE3] px-1.5 text-[11px] font-black text-navy shadow-sm transition disabled:opacity-70 sm:h-11 sm:px-3 sm:text-xs"
                >
                  Apagar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="mt-2 text-sm font-bold text-wine sm:mt-3">{error}</p> : null}

      {completed ? (
        <div className="mt-4 space-y-3 sm:mt-5">
          {!hasDetailedHistory ? (
            <div className="rounded-2xl bg-gold/15 px-4 py-3 text-center text-sm font-black text-navy">
              Resultado anterior não possui histórico detalhado.
            </div>
          ) : null}
          <div className="rounded-2xl bg-faithGreen/12 px-4 py-3 text-center font-black text-faithGreen sm:py-4">
            Resultado salvo: {savedResult?.scoreLabel} · palavra {savedResult?.word?.correctWord ?? secret}
          </div>
          {wordMode === "standalone" ? (
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <p className="text-sm font-black text-navy">Agora complete sua missão de hoje.</p>
              <p className="mt-1 text-xs font-bold leading-5 text-ink/60">
                A Palavra avulsa dá XP menor e não conclui a Jornada.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button onClick={onNextMission} className="rounded-xl bg-navy px-4 py-3 text-sm font-black text-white">
                  {ctaLabel ?? "Completar Missão da Fé"}
                </button>
                <button
                  onClick={() => savedResult && onStandaloneShare?.(savedResult)}
                  className="rounded-xl bg-faithGreen px-4 py-3 text-sm font-black text-white"
                >
                  Compartilhar Palavra
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
