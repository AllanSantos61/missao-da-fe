export type ChallengeId = "gospel" | "quiz" | "word";

export type QuizResult = {
  score: number;
  total: number;
  answers: Record<string, string>;
};

export type WordResult = {
  solved: boolean;
  attempts: number;
  guesses: string[];
};

export type GospelResult = {
  completed: boolean;
};

export type DailyChallengeResult = {
  id: ChallengeId;
  completedAt: string;
  xpEarned: number;
  scoreLabel: string;
  gospel?: GospelResult;
  quiz?: QuizResult;
  word?: WordResult;
};

export type DayHistory = {
  date: string;
  completedChallenges: ChallengeId[];
  xpEarned: number;
  results: Partial<Record<ChallengeId, DailyChallengeResult>>;
};

export type UserProgress = {
  activeDate: string;
  anonymousUserId: string;
  localUserId: string;
  playerName: string;
  onboardingCompleted: boolean;
  totalXP: number;
  weeklyXP: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  community: CommunityInfo;
  reminder: ReminderPreference;
  dailyHistory: Record<string, DayHistory>;
};

export type CommunityInfo = {
  city: string;
  parish: string;
  groupName: string;
  diocese: string;
};

export type ReminderPeriod = "morning" | "afternoon" | "night" | "custom";

export type ReminderPreference = {
  enabled: boolean;
  period: ReminderPeriod;
  customTime: string;
};

export type RankingFilter = "global" | "city" | "parish" | "group" | "diocese";

export type RankingEntry = {
  rank: number;
  name: string;
  xp: number;
  isCurrentUser: boolean;
};

export type WeeklyRankingResult = {
  entries: RankingEntry[];
  source: "supabase" | "local";
};

export type PublicResult = {
  userId: string;
  playerName: string;
  resultDate: string;
  journeyDay: number;
  totalXP: number;
  readingCompleted: boolean;
  quizScore: number;
  quizTotal: number;
  wordAttempts: number;
  wordSolved: boolean;
  dailyXp: number;
  streak: number;
  shareSlug: string;
};
