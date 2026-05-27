import type { ChallengeId } from "@/types/dailyProgress";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export type DailyChallengeData = {
  date: string;
  gospel: {
    title: string;
    reference: string;
    excerpt: string;
    reflection: string;
    dailyPractice: string;
    xp: number;
  };
  quiz: {
    title: string;
    xp: number;
    questions: QuizQuestion[];
  };
  word: {
    title: string;
    secret: string;
    xp: number;
  };
  challengeOrder: ChallengeId[];
};
