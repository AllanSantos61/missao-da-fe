"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyChallengeData } from "@/types/dailyChallenge";
import type { DailyChallengeResult, DayHistory, UserProgress } from "@/types/dailyProgress";
import { ChallengeActionBar } from "@/components/ChallengeActionBar";
import { ChallengeStatusStrip } from "@/components/ChallengeStatusStrip";
import { getWordLetterStatuses, normalizeWord } from "@/utils/wordUtils";

type WordFaithGameProps = {
  data: DailyChallengeData["word"];
  savedResult?: DailyChallengeResult;
  progress: UserProgress;
  todayHistory: DayHistory;
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

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function WordFaithGame({
  data,
  savedResult,
  progress,
  todayHistory,
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
  const solved = completed ? Boolean(savedResult?.word?.solved) : guesses.includes(secret);
  const attemptsEnded = completed || solved || guesses.length >= 6;

  const keyStatuses = useMemo(() => {
    const statuses: Record<string, keyof typeof statusClasses> = {};
    const priority = { correct: 3, present: 2, absent: 1, empty: 0 };

    guesses.forEach((guess) => {
      getWordLetterStatuses(guess, secret).forEach((status, index) => {
        const letter = guess[index];
        const current = statuses[letter] ?? "empty";
        if (priority[status] > priority[current]) {
          statuses[letter] = status;
        }
      });
    });

    return statuses;
  }, [guesses, secret]);

  function finish(nextGuesses: string[], didSolve: boolean) {
    onComplete({
      id: "word",
      completedAt: new Date().toISOString(),
      xpEarned: didSolve ? data.xp : Math.round(data.xp / 2),
      scoreLabel: didSolve ? `${nextGuesses.length}/6` : "Nao resolvida",
      word: {
        solved: didSolve,
        attempts: nextGuesses.length,
        guesses: nextGuesses
      }
    });
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
    <section className="rounded-[1.75rem] bg-altar p-5 shadow-card">
      <ChallengeActionBar
        isCompleted={completed}
        nextMissionLabel={nextMissionLabel}
        onBack={onBack}
        onNextMission={onNextMission}
      />
      <div className="mt-4">
        <ChallengeStatusStrip challengeId="word" xp={data.xp} progress={progress} todayHistory={todayHistory} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-gold">Palavra da Fe</p>
      <h2 className="mt-2 text-3xl font-black text-ink">{data.title}</h2>
      <p className="mt-2 leading-7 text-ink/68">
        Descubra a palavra catolica de 5 letras. Verde e posicao certa; dourado existe em outro
        lugar.
      </p>

      <div className="mx-auto mt-5 max-w-sm space-y-2">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const guess = guesses[rowIndex] ?? "";
          const rowLetters = rowIndex === guesses.length && !completed ? input : guess;
          const statuses = guess ? getWordLetterStatuses(guess, secret) : [];

          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((__, letterIndex) => {
                const status = statuses[letterIndex] ?? "empty";

                return (
                  <div
                    key={`${rowIndex}-${letterIndex}`}
                    className={`flex aspect-square items-center justify-center rounded-xl border text-2xl font-black shadow-sm transition ${statusClasses[status]}`}
                  >
                    {rowLetters[letterIndex] ?? ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-parchment p-3">
        <div className="space-y-2">
          {keyboardRows.map((row, rowIndex) => (
            <div key={row} className={`flex justify-center gap-1.5 ${rowIndex === 1 ? "px-3" : ""}`}>
              {rowIndex === 2 ? (
                <button
                  onClick={handleSubmitGuess}
                  disabled={attemptsEnded}
                  className="rounded-lg bg-navy px-2 text-xs font-black text-white disabled:bg-stone sm:px-3"
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
                    className={`h-11 min-w-0 flex-1 rounded-lg border text-sm font-black shadow-sm transition disabled:opacity-70 ${statusClasses[status]}`}
                  >
                    {letter}
                  </button>
                );
              })}
              {rowIndex === 2 ? (
                <button
                  onClick={handleBackspace}
                  disabled={attemptsEnded}
                  className="rounded-lg bg-white px-2 text-xs font-black text-navy shadow-sm disabled:opacity-70 sm:px-3"
                >
                  Apagar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-bold text-wine">{error}</p> : null}

      {completed ? (
        <div className="mt-5 rounded-2xl bg-faithGreen/12 px-4 py-4 text-center font-black text-faithGreen">
          Resultado salvo: {savedResult?.scoreLabel} · palavra {secret}
        </div>
      ) : null}
    </section>
  );
}
