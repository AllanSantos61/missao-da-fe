"use client";

import { useState } from "react";
import type { DailyChallengeData } from "@/types/dailyChallenge";
import type { DailyChallengeResult, DayHistory, UserProgress } from "@/types/dailyProgress";
import { ChallengeActionBar } from "@/components/ChallengeActionBar";
import { ChallengeStatusStrip } from "@/components/ChallengeStatusStrip";

type QuizFaithProps = {
  data: DailyChallengeData["quiz"];
  savedResult?: DailyChallengeResult;
  progress: UserProgress;
  todayHistory: DayHistory;
  onComplete: (result: DailyChallengeResult) => void;
  onNextMission: () => void;
  nextMissionLabel: string;
  onBack: () => void;
};

export function QuizFaith({
  data,
  savedResult,
  progress,
  todayHistory,
  onComplete,
  onNextMission,
  nextMissionLabel,
  onBack
}: QuizFaithProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(savedResult?.quiz?.answers ?? {});
  const completed = Boolean(savedResult);
  const isComplete = data.questions.every((question) => answers[question.id]);

  function handleSubmit() {
    if (completed || !isComplete) return;

    const score = data.questions.filter((question) => answers[question.id] === question.correctAnswer).length;

    onComplete({
      id: "quiz",
      completedAt: new Date().toISOString(),
      xpEarned: Math.round((data.xp * score) / data.questions.length),
      scoreLabel: `${score}/${data.questions.length}`,
      quiz: {
        score,
        total: data.questions.length,
        answers
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] bg-altar p-5 shadow-card">
      <ChallengeActionBar
        isCompleted={completed}
        nextMissionLabel={nextMissionLabel}
        onBack={onBack}
        onNextMission={onNextMission}
      />
      <div className="mt-4">
        <ChallengeStatusStrip challengeId="quiz" xp={data.xp} progress={progress} todayHistory={todayHistory} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-gold">Quiz da Fe</p>
      <h2 className="mt-2 text-3xl font-black text-ink">{data.title}</h2>
      <p className="mt-2 leading-7 text-ink/68">Responda as 3 perguntas e veja sua pontuacao do dia.</p>

      <div className="mt-5 space-y-4">
        {data.questions.map((question, index) => (
          <article key={question.id} className="box-border w-full overflow-hidden rounded-3xl bg-parchment p-4">
            <h3 className="text-base font-black leading-6 text-ink">
              {index + 1}. {question.question}
            </h3>
            <div className="mt-4 grid w-full gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option;
                const isCorrect = completed && option === question.correctAnswer;
                const isWrongSelection = completed && selected && !isCorrect;

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={completed}
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                    className={`box-border block w-full rounded-2xl border px-4 py-3 text-left font-bold leading-6 transition focus:outline-none focus:ring-4 focus:ring-gold/20 ${
                      isCorrect
                        ? "border-faithGreen bg-faithGreen text-white"
                        : isWrongSelection
                          ? "border-stone bg-stone text-white"
                          : selected
                            ? "border-navy bg-navy text-white"
                            : "border-navy/10 bg-white text-ink hover:border-gold"
                    }`}
                  >
                    <span className="block whitespace-normal break-words">{option}</span>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {completed ? (
        <div className="mt-5 rounded-2xl bg-faithGreen/12 px-4 py-4 text-center font-black text-faithGreen">
          Resultado salvo: {savedResult?.scoreLabel} · +{savedResult?.xpEarned} XP
        </div>
      ) : (
        <button
          disabled={!isComplete}
          onClick={handleSubmit}
          className="mt-5 w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card transition enabled:hover:-translate-y-0.5 enabled:hover:bg-ink disabled:cursor-not-allowed disabled:bg-stone"
        >
          Finalizar quiz
        </button>
      )}
    </section>
  );
}
