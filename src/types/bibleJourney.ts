export type CalendarStatus = "completed" | "missed" | "pending";

export type BibleReading = {
  id?: string;
  orderIndex: number;
  testament: "novo_testamento";
  book: string;
  chapterStart: number;
  verseStart?: number | null;
  chapterEnd?: number | null;
  verseEnd?: number | null;
  reference: string;
  title: string;
  content?: string | null;
  source?: string | null;
  estimatedMinutes: number;
};

export type BibleProgress = {
  playerName: string;
  currentReadingIndex: number;
  completedReadings: number;
  totalReadings: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  missedDays: number;
};

export type ReadingCalendarDay = {
  date: string;
  status: CalendarStatus;
  readingIndex?: number;
  xpEarned: number;
};

export type CurrentReadingState = {
  reading: BibleReading;
  progress: BibleProgress;
  calendar: ReadingCalendarDay[];
  missedDaysSinceLastVisit: number;
  source: "supabase" | "local";
};
