import type { BibleProgress, ReadingCalendarDay } from "@/types/bibleJourney";

type XPJourneyCalendarProps = {
  calendar: ReadingCalendarDay[];
  progress: BibleProgress;
};

const statusClass = {
  completed: "bg-faithGreen text-white border-faithGreen",
  missed: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-white text-ink/55 border-navy/10"
};

export function XPJourneyCalendar({ calendar, progress }: XPJourneyCalendarProps) {
  return (
    <section className="rounded-[1.5rem] bg-parchment p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-navy">Calendário da Jornada</p>
          <p className="mt-1 text-xs font-semibold text-ink/60">Últimos 30 dias</p>
        </div>
        <div className="text-right text-xs font-bold text-ink/60">
          <p>Sequência: {progress.currentStreak}</p>
          <p>Recorde: {progress.bestStreak}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-10 gap-1.5">
        {calendar.map((day) => (
          <div
            key={day.date}
            title={`${day.date} · ${day.status} · ${day.xpEarned} XP`}
            className={`flex aspect-square items-center justify-center rounded-lg border text-[10px] font-black ${statusClass[day.status]}`}
          >
            {new Date(`${day.date}T12:00:00`).getDate()}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink/60">
        <span>Verde: concluído</span>
        <span>Cinza: pendente</span>
        <span>Vermelho suave: perdido</span>
      </div>
    </section>
  );
}
