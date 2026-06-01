export type JourneyDayStatus = "completed" | "pending" | "available" | "locked";

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
  xpReward: number;
};

export type JourneyCalendarDay = {
  dayNumber: number;
  status: JourneyDayStatus;
  readingCompleted: boolean;
  quizCompleted: boolean;
  wordCompleted: boolean;
  wordAttemptsHistory?: Array<{
    guess: string;
    result: Array<"correct" | "present" | "absent" | "empty">;
  }>;
  wordResult?: {
    solved: boolean;
    correctWord?: string;
  } | null;
  wordAttempts?: number;
  xpEarned: number;
  completedDate?: string | null;
};

export type BibleProgress = {
  playerName: string;
  journeyStartDate: string;
  currentJourneyDay: number;
  availableJourneyDay: number;
  completedDays: number[];
  missedDays: number[];
  availableDays: number[];
  lastAccessDate: string | null;
  lastCompletedDate: string | null;
  currentStreak: number;
  bestStreak: number;
  totalXp: number;
  completedReadings: number;
  totalReadings: number;
  pendingCount: number;
};

export type JourneyQuizQuestion = {
  id: string;
  questionOrder: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
};

export type JourneyDayMission = {
  dayNumber: number;
  title: string;
  bibleReference: string;
  bibleBook: string;
  chapterStart: number;
  verseStart?: number | null;
  chapterEnd?: number | null;
  verseEnd?: number | null;
  estimatedMinutes: number;
  faithWord: string;
  normalizedFaithWord: string;
  readingXp: number;
  quizXp: number;
  wordXp: number;
  quizQuestions: JourneyQuizQuestion[];
  source: "supabase" | "local";
};

export type CurrentReadingState = {
  reading: BibleReading;
  selectedDay: number;
  mission?: JourneyDayMission;
  progress: BibleProgress;
  calendar: JourneyCalendarDay[];
  source: "supabase" | "local";
  notice?: string;
};
