import { ShareResultButton } from "@/components/ShareResultButton";
import type { ChallengeId, DayHistory, UserProgress } from "@/types/dailyProgress";

type ChallengeStatusStripProps = {
  challengeId: ChallengeId;
  xp: number;
  progress: UserProgress;
  todayHistory: DayHistory;
};

export function ChallengeStatusStrip({ challengeId, xp, progress, todayHistory }: ChallengeStatusStripProps) {
  const completedCount = todayHistory.completedChallenges.length;
  const completed = todayHistory.completedChallenges.includes(challengeId);

  return (
    <div className="mb-4 rounded-[1.35rem] border border-navy/8 bg-parchment p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${completed ? "bg-faithGreen/12 text-faithGreen" : "bg-gold/16 text-navy"}`}>
          {completed ? "Concluído hoje" : "Disponível hoje"}
        </span>
        <div className="flex gap-2 text-xs font-black text-navy">
          <span className="rounded-full bg-white px-3 py-1">+{xp} XP</span>
          <span className="rounded-full bg-white px-3 py-1">🔥 {progress.currentStreak}</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-faithGreen"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-bold text-ink/62">Progresso do dia: {completedCount}/3</p>
      {completed ? (
        <div className="mt-3">
          <ShareResultButton progress={progress} todayHistory={todayHistory} />
        </div>
      ) : null}
    </div>
  );
}
