import type { ChallengeId, DailyChallengeResult } from "@/types/dailyProgress";

type ChallengeCardProps = {
  id: ChallengeId;
  description: string;
  xp: number;
  completed: boolean;
  result?: DailyChallengeResult;
  onOpen: (id: ChallengeId) => void;
};

const labels: Record<ChallengeId, string> = {
  gospel: "Jornada da Fé",
  quiz: "Quiz da Fé",
  word: "Palavra da Fé"
};

export function ChallengeCard({ id, description, xp, completed, result, onOpen }: ChallengeCardProps) {
  return (
    <article className="flex min-h-[214px] flex-col justify-between rounded-[1.25rem] border border-white bg-altar p-4 shadow-card sm:min-h-[238px]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-gold">{labels[id]}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              completed ? "bg-faithGreen/12 text-faithGreen" : "bg-gold/15 text-navy"
            }`}
          >
            {completed ? "Concluído hoje" : "Disponível"}
          </span>
        </div>
        <p className="mt-4 min-h-[72px] text-sm leading-6 text-ink/68">{description}</p>
      </div>
      <div>
        <div className="mt-4 flex min-h-[28px] items-center justify-between">
          <span className="rounded-full bg-parchment px-3 py-1.5 text-xs font-bold text-navy">+{xp} XP</span>
          {result ? <span className="text-sm font-bold text-faithGreen">{result.scoreLabel}</span> : null}
        </div>
        <button
          onClick={() => onOpen(id)}
          className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
            completed ? "bg-white text-navy ring-1 ring-navy/12" : "bg-navy text-white hover:bg-ink"
          }`}
        >
          {completed ? "Ver resultado" : "Jogar agora"}
        </button>
      </div>
    </article>
  );
}
