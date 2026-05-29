import type { BibleProgress, JourneyCalendarDay } from "@/types/bibleJourney";

type XPJourneyCalendarProps = {
  calendar: JourneyCalendarDay[];
  progress: BibleProgress;
};

const statusClass = {
  completed: "bg-faithGreen text-white border-faithGreen",
  pending: "bg-gold/70 text-navy border-gold/20",
  available: "bg-navy text-white border-navy",
  locked: "bg-white text-ink/35 border-navy/10"
};

export function XPJourneyCalendar({ calendar, progress }: XPJourneyCalendarProps) {
  return (
    <section className="rounded-[1.5rem] bg-parchment p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-navy">Calendário da Jornada</p>
          <p className="mt-1 text-xs font-semibold text-ink/60">Primeiros 30 dias</p>
        </div>
        <div className="text-right text-xs font-bold text-ink/60">
          <p>Sequência: {progress.currentStreak}</p>
          <p>Recorde: {progress.bestStreak}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-10 gap-1.5">
        {calendar.slice(0, 30).map((day) => (
          <div
            key={day.dayNumber}
            title={`Dia ${day.dayNumber} · ${day.status} · ${day.xpEarned} XP`}
            className={`flex aspect-square items-center justify-center rounded-lg border text-[10px] font-black ${statusClass[day.status]}`}
          >
            {day.dayNumber}
          </div>
        ))}
      </div>
    </section>
  );
}
