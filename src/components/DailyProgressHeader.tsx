import type { DayHistory, UserProgress } from "@/types/dailyProgress";

type DailyProgressHeaderProps = {
  progress: UserProgress;
  todayHistory: DayHistory;
};

export function DailyProgressHeader({ progress, todayHistory }: DailyProgressHeaderProps) {
  const completed = todayHistory.completedChallenges.length;

  return (
    <header className="overflow-hidden rounded-[1.75rem] bg-navy p-5 text-white shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Missão de Hoje</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Complete sua jornada diária</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
            Evangelho, Quiz da Fé e Palavra da Fé em poucos minutos.
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
          <p className="text-xs font-semibold text-white/70">Hoje</p>
          <p className="text-lg font-black text-gold">{completed}/3</p>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/12">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-faithGreen transition-all duration-500"
          style={{ width: `${(completed / 3) * 100}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-xs text-white/65">XP</p>
          <p className="text-lg font-black">{progress.totalXP}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-xs text-white/65">Sequencia</p>
          <p className="text-lg font-black">{progress.currentStreak}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-xs text-white/65">Recorde</p>
          <p className="text-lg font-black">{progress.bestStreak}</p>
        </div>
      </div>
    </header>
  );
}
