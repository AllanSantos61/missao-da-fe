"use client";

import { useState } from "react";
import { requestNotificationPermission, scheduleLocalReminderPlaceholder } from "@/services/notificationService";
import { trackEvent } from "@/services/analyticsService";
import type { ReminderPeriod, ReminderPreference, UserProgress } from "@/types/dailyProgress";

type ReminderCardProps = {
  progress: UserProgress;
  onSave: (reminder: ReminderPreference) => void;
};

const periods: Array<{ value: ReminderPeriod; label: string }> = [
  { value: "morning", label: "Manhã" },
  { value: "afternoon", label: "Tarde" },
  { value: "night", label: "Noite" },
  { value: "custom", label: "Personalizado" }
];

export function ReminderCard({ progress, onSave }: ReminderCardProps) {
  const [reminder, setReminder] = useState(progress.reminder);
  const [message, setMessage] = useState("Sua missão de hoje está esperando por você 🙏");

  async function saveReminder() {
    const nextReminder = { ...reminder, enabled: true };
    onSave(nextReminder);
    scheduleLocalReminderPlaceholder(nextReminder);
    const permission = await requestNotificationPermission();
    setMessage(permission === "granted" ? "Lembrete preparado neste dispositivo." : "Em breve você poderá receber lembretes automáticos.");
    void trackEvent({
      eventName: "reminder_saved",
      userId: progress.anonymousUserId,
      playerName: progress.playerName,
      metadata: nextReminder
    });
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-card">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Lembrete diário</p>
      <h3 className="mt-2 text-xl font-black text-navy">Voltar para a missão</h3>
      <p className="mt-2 text-sm leading-6 text-ink/68">{message}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => setReminder((current) => ({ ...current, period: period.value }))}
            className={`rounded-2xl px-3 py-3 text-sm font-black ${
              reminder.period === period.value ? "bg-navy text-white" : "bg-parchment text-navy"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
      {reminder.period === "custom" ? (
        <input
          type="time"
          value={reminder.customTime}
          onChange={(event) => setReminder((current) => ({ ...current, customTime: event.target.value }))}
          className="mt-3 w-full rounded-2xl border border-navy/10 bg-parchment px-4 py-3 font-black text-navy"
        />
      ) : null}
      <button onClick={saveReminder} className="mt-4 w-full rounded-2xl bg-gold px-4 py-3 font-black text-navy">
        Salvar lembrete
      </button>
    </section>
  );
}
