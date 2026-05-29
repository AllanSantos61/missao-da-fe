import type { JourneyCalendarDay } from "@/types/bibleJourney";

type JourneyCalendar365Props = {
  days: JourneyCalendarDay[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
};

const statusClass = {
  completed: "bg-faithGreen text-white ring-faithGreen/20",
  pending: "bg-gold/85 text-navy ring-gold/25",
  available: "bg-navy text-white ring-gold/40",
  locked: "bg-stone/25 text-ink/35 ring-stone/20"
};

export function JourneyCalendar365({ days, selectedDay, onSelectDay }: JourneyCalendar365Props) {
  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-navy">Calendário da Jornada</p>
          <p className="mt-1 text-xs font-semibold text-ink/58">365 dias para caminhar pelo Novo Testamento.</p>
        </div>
        <span className="rounded-full bg-parchment px-3 py-1 text-xs font-black text-navy">{days.length} dias</span>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(25,minmax(0,1fr))]">
        {days.map((day) => (
          <button
            key={day.dayNumber}
            type="button"
            onClick={() => onSelectDay(day.dayNumber)}
            title={`Dia ${day.dayNumber}`}
            aria-label={`Dia ${day.dayNumber}: ${day.status}`}
            className={`aspect-square rounded-md text-[9px] font-black leading-none ring-1 transition hover:scale-110 ${
              statusClass[day.status]
            } ${selectedDay === day.dayNumber ? "outline outline-2 outline-offset-2 outline-navy" : ""}`}
          >
            {day.dayNumber}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-ink/65 sm:grid-cols-4">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-faithGreen" /> Concluído
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-gold" /> Pendente
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-navy" /> Disponível
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded bg-stone/35" /> Futuro
        </span>
      </div>
    </section>
  );
}
