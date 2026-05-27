export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export type DailyChallenge = {
  date: string;
  gospelTitle: string;
  bibleReference: string;
  excerpt: string;
  wordOfDay: string;
  reflection: string;
  dailyPractice: string;
  quiz: QuizQuestion[];
};

export type UserProgress = {
  xp: number;
  streak: number;
  lastCompletedDate: string | null;
};

export type ChallengeResult = {
  quizCorrect: number;
  wordSolved: boolean;
  totalScore: number;
  earnedXp: number;
};

export type LetterStatus = "correct" | "present" | "absent" | "empty";
