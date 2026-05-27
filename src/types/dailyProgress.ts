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
  playerName: string;
  totalXP: number;
  weeklyXP: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  dailyHistory: Record<string, DayHistory>;
};

export type RankingEntry = {
  rank: number;
  name: string;
  xp: number;
  isCurrentUser: boolean;
};
