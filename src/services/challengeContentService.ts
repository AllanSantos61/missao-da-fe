import { supabaseClient } from "@/lib/supabaseClient";
import { dailyChallengeData } from "@/data/dailyChallengeData";
import type { DailyChallengeData, QuizQuestion } from "@/types/dailyChallenge";
import { getTodayKey } from "@/utils/dateUtils";

type FaithWordRow = {
  word: string;
  normalized_word: string;
};

type QuizQuestionRow = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
};

function dayIndex(length: number, salt = 0) {
  const seed = Number(getTodayKey().replaceAll("-", "")) + salt;
  return length ? seed % length : 0;
}

function mapQuizQuestion(row: QuizQuestionRow): QuizQuestion {
  const options = [row.option_a, row.option_b, row.option_c];
  const correctIndex = row.correct_option === "A" ? 0 : row.correct_option === "B" ? 1 : 2;

  return {
    id: row.id,
    question: row.question,
    options,
    correctAnswer: options[correctIndex]
  };
}

export async function getDailyChallengeContent(): Promise<DailyChallengeData> {
  if (!supabaseClient) return dailyChallengeData;

  try {
    const [wordsResult, quizResult] = await Promise.all([
      supabaseClient
        .from("faith_words")
        .select("word, normalized_word")
        .eq("active", true)
        .limit(500),
      supabaseClient
        .from("quiz_questions")
        .select("id, question, option_a, option_b, option_c, correct_option")
        .eq("active", true)
        .limit(1500)
    ]);

    if (wordsResult.error) throw wordsResult.error;
    if (quizResult.error) throw quizResult.error;

    const words = (wordsResult.data ?? []) as FaithWordRow[];
    const questions = (quizResult.data ?? []) as QuizQuestionRow[];
    const selectedWord = words[dayIndex(words.length)]?.normalized_word ?? dailyChallengeData.word.secret;
    const selectedQuestions = Array.from({ length: 3 }, (_, index) => {
      const question = questions[dayIndex(questions.length, index * 37)];
      return question ? mapQuizQuestion(question) : dailyChallengeData.quiz.questions[index];
    }).filter(Boolean) as QuizQuestion[];

    return {
      ...dailyChallengeData,
      quiz: {
        ...dailyChallengeData.quiz,
        questions: selectedQuestions.length === 3 ? selectedQuestions : dailyChallengeData.quiz.questions
      },
      word: {
        ...dailyChallengeData.word,
        secret: selectedWord
      }
    };
  } catch (error) {
    console.warn("Challenge content Supabase fetch failed; using local fallback.", error);
    return dailyChallengeData;
  }
}
