"use client";

import type { DailyChallengeData } from "@/types/dailyChallenge";
import type { DailyChallengeResult, DayHistory, UserProgress } from "@/types/dailyProgress";
import { ChallengeActionBar } from "@/components/ChallengeActionBar";
import { ChallengeStatusStrip } from "@/components/ChallengeStatusStrip";

type GospelChallengeProps = {
  data: DailyChallengeData["gospel"];
  savedResult?: DailyChallengeResult;
  progress: UserProgress;
  todayHistory: DayHistory;
  onComplete: (result: DailyChallengeResult) => void;
  onNextMission: () => void;
  nextMissionLabel: string;
  onBack: () => void;
};

export function GospelChallenge({
  data,
  savedResult,
  progress,
  todayHistory,
  onComplete,
  onNextMission,
  nextMissionLabel,
  onBack
}: GospelChallengeProps) {
  const completed = Boolean(savedResult);

  function handleComplete() {
    if (completed) return;

    onComplete({
      id: "gospel",
      completedAt: new Date().toISOString(),
      xpEarned: data.xp,
      scoreLabel: "Concluido",
      gospel: { completed: true }
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
        <ChallengeStatusStrip challengeId="gospel" xp={data.xp} progress={progress} todayHistory={todayHistory} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-gold">Evangelho do Dia</p>
      <h2 className="mt-2 text-3xl font-black text-ink">{data.title}</h2>
      <p className="mt-1 font-bold text-navy">{data.reference}</p>

      <p className="mt-5 rounded-3xl border-l-4 border-gold bg-parchment p-5 text-lg leading-8 text-ink/78">
        {data.excerpt}
      </p>

      <div className="mt-4 rounded-3xl bg-navy p-5 text-white">
        <p className="text-sm font-black uppercase tracking-wide text-gold">Reflexao</p>
        <p className="mt-2 leading-7 text-white/82">{data.reflection}</p>
      </div>

      <div className="mt-4 rounded-3xl border border-gold/25 bg-white p-5">
        <p className="text-sm font-black uppercase tracking-wide text-wine">Pratica do dia</p>
        <p className="mt-2 leading-7 text-ink/72">{data.dailyPractice}</p>
      </div>

      {completed ? (
        <div className="mt-5 rounded-2xl bg-faithGreen/12 px-4 py-4 text-center font-black text-faithGreen">
          Concluido hoje · +{savedResult?.xpEarned} XP
        </div>
      ) : (
        <button
          onClick={handleComplete}
          className="mt-5 w-full rounded-2xl bg-navy px-6 py-4 font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-ink"
        >
          Concluir Evangelho
        </button>
      )}
    </section>
  );
}
