"use client";

import { useState } from "react";
import type { JourneyCalendarDay } from "@/types/bibleJourney";

type JourneyCalendar365Props = {
  days: JourneyCalendarDay[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
  onMilestoneClick?: (dayNumber: number, title: string) => void;
};

const statusClass = {
  completed: "bg-faithGreen text-white ring-faithGreen/20",
  pending: "bg-gold/85 text-navy ring-gold/25",
  available: "bg-navy text-white ring-gold/40",
  locked: "bg-stone/25 text-ink/35 ring-stone/20"
};

const milestones: Record<number, { title: string; message: string; biblical?: string }> = {
  7: { title: "Primeira semana de missão", message: "Você deu os primeiros passos com fidelidade." },
  30: { title: "Hábito da Palavra", message: "Você chegou ao Dia 30. Sua fidelidade está virando hábito." },
  50: { title: "Caminho firme", message: "A constância já começou a moldar sua jornada." },
  100: { title: "Cem dias de fé", message: "Cem dias de missão: uma bela história com Deus." },
  180: { title: "Metade da jornada", message: "Você atravessou uma grande parte do caminho." },
  365: { title: "Novo Testamento concluído", message: "Uma jornada inteira pela Palavra." },
  40: { title: "Evangelho de Mateus concluído", message: "Você percorreu o primeiro Evangelho.", biblical: "Mateus" },
  65: { title: "Evangelho de Marcos concluído", message: "A urgência do Evangelho segue com você.", biblical: "Marcos" },
  105: { title: "Evangelho de Lucas concluído", message: "A misericórdia de Cristo iluminou seu caminho.", biblical: "Lucas" },
  135: { title: "Evangelho de João concluído", message: "Você contemplou o Verbo que se fez carne.", biblical: "João" },
  170: { title: "Atos dos Apóstolos concluído", message: "A missão da Igreja ganhou movimento.", biblical: "Atos" },
  285: { title: "Cartas Paulinas concluídas", message: "A fé foi ensinada, corrigida e fortalecida.", biblical: "Cartas" },
  360: { title: "Apocalipse concluído", message: "A esperança final sustenta a perseverança.", biblical: "Apocalipse" }
};

export function JourneyCalendar365({ days, selectedDay, onSelectDay, onMilestoneClick }: JourneyCalendar365Props) {
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const milestone = activeMilestone ? milestones[activeMilestone] : null;

  function handleClick(dayNumber: number) {
    if (milestones[dayNumber]) {
      setActiveMilestone(dayNumber);
      onMilestoneClick?.(dayNumber, milestones[dayNumber].title);
    }
    onSelectDay(dayNumber);
  }

  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-navy">Calendário da Jornada</p>
          <p className="mt-1 text-xs font-semibold text-ink/58">365 dias, com marcos para celebrar a caminhada.</p>
        </div>
        <span className="rounded-full bg-parchment px-3 py-1 text-xs font-black text-navy">{days.length} dias</span>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(25,minmax(0,1fr))]">
        {days.map((day) => {
          const isMilestone = Boolean(milestones[day.dayNumber]);
          return (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => handleClick(day.dayNumber)}
              title={isMilestone ? `${milestones[day.dayNumber].title} · Dia ${day.dayNumber}` : `Dia ${day.dayNumber}`}
              aria-label={`Dia ${day.dayNumber}: ${day.status}`}
              className={`aspect-square rounded-md text-[8px] font-black leading-none ring-1 transition hover:scale-110 ${
                statusClass[day.status]
              } ${selectedDay === day.dayNumber ? "outline outline-2 outline-offset-2 outline-navy" : ""} ${
                isMilestone ? "border-2 border-gold shadow-[0_0_0_2px_rgba(214,169,58,0.18)]" : ""
              }`}
            >
              {isMilestone ? "★" : day.dayNumber}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-ink/65 sm:grid-cols-5">
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-faithGreen" /> Verde: concluído</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-gold" /> Amarelo: pendente</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-navy" /> Azul: disponível</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-stone/35" /> Cinza: futuro</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded border-2 border-gold bg-white" /> Dourado: marco</span>
      </div>

      {milestone ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Dia {activeMilestone}</p>
            <h4 className="mt-2 text-2xl font-black text-navy">{milestone.title}</h4>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/70">{milestone.message}</p>
            <p className="mt-3 rounded-2xl bg-gold/12 px-4 py-3 text-xs font-black text-navy">
              XP bônus futuro: em breve
            </p>
            <button
              onClick={() => setActiveMilestone(null)}
              className="mt-5 w-full rounded-2xl bg-navy px-4 py-3 font-black text-white"
            >
              Continuar jornada
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
