"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyChallengeData } from "@/types/dailyChallenge";
import type { DailyChallengeResult } from "@/types/dailyProgress";

type FocusedQuizMissionProps = {
  dayNumber: number;
  data: DailyChallengeData["quiz"];
  savedResult?: DailyChallengeResult;
  onComplete: (result: DailyChallengeResult) => void | Promise<void>;
};

export function FocusedQuizMission({ dayNumber, data, savedResult, onComplete }: FocusedQuizMissionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedResult?.quiz?.answers ?? {});
  const [isSubmitted, setIsSubmitted] = useState(Boolean(savedResult));
  const [isSaving, setIsSaving] = useState(false);
  const questions = data.questions;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((key) => Boolean(answers[key])).length;
  const progress = Math.round((answeredCount / Math.max(1, questions.length)) * 100);
  const score = useMemo(
    () => questions.filter((question) => answers[question.id] === question.correctAnswer).length,
    [answers, questions]
  );

  async function submitQuiz() {
    if (isSubmitted || answeredCount < questions.length) return;
    setIsSaving(true);
    const result: DailyChallengeResult = {
      id: "quiz",
      completedAt: new Date().toISOString(),
      xpEarned: Math.round((data.xp * score) / Math.max(1, questions.length)),
      scoreLabel: `${score}/${questions.length}`,
      quiz: {
        score,
        total: questions.length,
        answers
      }
    };
    await onComplete(result);
    setIsSubmitted(true);
    setIsSaving(false);
  }

  if (!currentQuestion) {
    return (
      <main className="grid min-h-screen place-items-center bg-parchment px-4 text-ink">
        <section className="w-full max-w-md rounded-[1.75rem] bg-white p-6 text-center shadow-card">
          <p className="text-xl font-black text-navy">Quiz indisponível</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-2xl bg-navy px-5 py-3 font-black text-white">
            Voltar para Home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-5 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-2xl flex-col rounded-[2rem] bg-white p-5 shadow-card">
        <header>
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => router.push("/")} className="rounded-full bg-parchment px-4 py-2 text-sm font-black text-navy">
              Voltar
            </button>
            <span className="rounded-full bg-gold/15 px-3 py-2 text-xs font-black text-navy">
              Dia {dayNumber} de 365
            </span>
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-gold">Quiz da Fé</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-navy">
            Pergunta {currentIndex + 1} de {questions.length}
          </h1>
          <p className="mt-2 text-sm font-bold text-ink/60">
            {Math.max(0, questions.length - answeredCount)} perguntas restantes
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-parchment">
            <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="mt-8 flex-1">
          <article className="rounded-[1.5rem] bg-parchment p-4">
            <h2 className="text-xl font-black leading-8 text-ink">{currentQuestion.question}</h2>
            <div className="mt-5 grid gap-3">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option;
                const isCorrect = isSubmitted && option === currentQuestion.correctAnswer;
                const isWrong = isSubmitted && selected && !isCorrect;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: option }))}
                    className={`rounded-2xl border px-4 py-4 text-left font-black leading-6 transition ${
                      isCorrect
                        ? "border-faithGreen bg-faithGreen text-white"
                        : isWrong
                          ? "border-stone bg-stone text-white"
                          : selected
                            ? "border-navy bg-navy text-white"
                            : "border-navy/10 bg-white text-ink hover:border-gold"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </article>
        </div>

        {isSubmitted ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-faithGreen/12 px-4 py-4 text-center font-black text-faithGreen">
              ✓ Quiz concluído · {savedResult?.scoreLabel ?? `${score}/${questions.length}`}
            </div>
            <button onClick={() => router.push(`/word/${dayNumber}`)} className="w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card">
              Continuar para Palavra
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="rounded-2xl bg-parchment px-5 py-4 font-black text-navy disabled:opacity-45"
            >
              Anterior
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                disabled={!answers[currentQuestion.id]}
                className="rounded-2xl bg-navy px-5 py-4 font-black text-white disabled:bg-stone"
              >
                Próxima
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                disabled={answeredCount < questions.length || isSaving}
                className="rounded-2xl bg-navy px-5 py-4 font-black text-white disabled:bg-stone"
              >
                {isSaving ? "Salvando..." : "Concluir quiz"}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
