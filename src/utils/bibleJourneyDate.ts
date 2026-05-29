import { getTodayKey } from "@/utils/dateUtils";

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00-03:00`);
  date.setDate(date.getDate() + days);
  return getTodayKey(date);
}

export function getDaysBetweenExclusive(startDateKey: string, endDateKey: string) {
  const dates: string[] = [];
  let cursor = addDays(startDateKey, 1);

  while (cursor < endDateKey) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function getDaysElapsedInclusive(startDateKey: string, endDateKey: string) {
  let days = 1;
  let cursor = startDateKey;

  while (cursor < endDateKey) {
    days += 1;
    cursor = addDays(cursor, 1);
  }

  return days;
}

export function getLastNDays(days: number) {
  const today = getTodayKey();
  return Array.from({ length: days }, (_, index) => addDays(today, index - days + 1));
}
