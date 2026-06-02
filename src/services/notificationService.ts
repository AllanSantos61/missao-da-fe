import type { ReminderPreference } from "@/types/dailyProgress";

const REMINDER_KEY = "missaoDaFeReminderPreference";

const defaultReminder: ReminderPreference = {
  enabled: false,
  period: "morning",
  customTime: "08:00"
};

export function getReminderPreference(): ReminderPreference {
  if (typeof window === "undefined") return defaultReminder;

  try {
    const stored = window.localStorage.getItem(REMINDER_KEY);
    return stored ? { ...defaultReminder, ...JSON.parse(stored) } : defaultReminder;
  } catch {
    return defaultReminder;
  }
}

export function saveReminderPreference(reminder: ReminderPreference) {
  if (typeof window === "undefined") return reminder;
  window.localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
  return reminder;
}

export function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) return "unsupported";
  return Notification.requestPermission();
}

export function scheduleLocalReminderPlaceholder(reminder: ReminderPreference) {
  saveReminderPreference(reminder);
  return {
    supported: canUseNotifications(),
    message: reminder.enabled
      ? "Receba um lembrete diário para manter sua caminhada."
      : "Em breve você poderá receber lembretes automáticos."
  };
}
