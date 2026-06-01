"use client";

import { useState } from "react";
import { trackEvent } from "@/services/analyticsService";
import { requestNotificationPermission, scheduleLocalReminderPlaceholder } from "@/services/notificationService";
import type { ReminderPeriod, ReminderPreference, UserProgress } from "@/types/dailyProgress";

type ReminderCardProps = {
  progress: UserProgress;
  onSave: (reminder: ReminderPreference) => void;
};

const periods: Array<{ value: ReminderPeriod; label: string }> = [
  { value: "morning", label: "Manhã" },
  { value: "afternoon", label: "Tarde" },
  { value: "night", label: "Noite" },
  { value: "custom", label: "Hora" }
];

export function ReminderCard({ progress, onSave }: ReminderCardProps) {
  const [reminder, setReminder] = useState(progress.reminder);
  const [message, setMessage] = useState("Sua missão de hoje está esperando por você 🙏");

  async function saveReminder() {
    const nextReminder = { ...reminder, enabled: true };
    onSave(nextReminder);
    scheduleLocalReminderPlaceholder(nextReminder);
    const permission = await requestNotificationPermission();
    setMessage(permission === "granted" ? "Lembrete preparado neste dispositivo." : "Lembrete salvo no app.");
    void trackEvent({
      eventName: "reminder_saved",
      userId: progress.anonymousUserId,
      playerName: progress.playerName,
      metadata: nextReminder
    });
  }

  return (
    <section className="rounded-[1.25rem] bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">Lembrete diário</p>
          <p className="mt-1 text-sm font-bold leading-5 text-ink/65">{message}</p>
        </div>
        <button onClick={saveReminder} className="shrink-0 rounded-full bg-gold px-4 py-2 text-xs font-black text-navy">
          Salvar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => setReminder((current) => ({ ...current, period: period.value }))}
            className={`rounded-xl px-2 py-2 text-xs font-black ${
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
          className="mt-2 w-full rounded-xl border border-navy/10 bg-parchment px-3 py-2 text-sm font-black text-navy"
        />
      ) : null}
    </section>
  );
}
