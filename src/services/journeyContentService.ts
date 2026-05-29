import { supabaseClient } from "@/lib/supabaseClient";
import type { JourneyDayMission, JourneyQuizQuestion } from "@/types/bibleJourney";
import { normalizeWord } from "@/utils/wordUtils";

const fallbackWords = [
  "JESUS",
  "MARIA",
  "GRACA",
  "MISSA",
  "SANTO",
  "SALMO",
  "CREIO",
  "REZAR",
  "ANJOS",
  "PEDRO",
  "PAULO",
  "LUCAS"
];

type JourneyDayRow = {
  day_number: number;
  title: string;
  bible_reference: string;
  bible_book: string | null;
  chapter_start: number | null;
  verse_start: number | null;
  chapter_end: number | null;
  verse_end: number | null;
  estimated_minutes: number | null;
  faith_word: string;
  normalized_faith_word: string;
  reading_xp: number | null;
  quiz_xp: number | null;
  word_xp: number | null;
};

type JourneyQuizQuestionRow = {
  id: string;
  question_order: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string | null;
};

function mapQuestion(row: JourneyQuizQuestionRow): JourneyQuizQuestion {
  const options = [row.option_a, row.option_b, row.option_c];
  const correctIndex = row.correct_option === "A" ? 0 : row.correct_option === "B" ? 1 : 2;

  return {
    id: row.id,
    questionOrder: row.question_order,
    question: row.question,
    options,
    correctAnswer: options[correctIndex],
    explanation: row.explanation
  };
}

function fallbackMission(dayNumber: number): JourneyDayMission {
  const word = fallbackWords[(dayNumber - 1) % fallbackWords.length];

  return {
    dayNumber,
    title: `Dia ${dayNumber} da Jornada da Fé`,
    bibleReference: dayNumber <= 28 ? `Mateus ${dayNumber}` : `Novo Testamento ${dayNumber}`,
    bibleBook: dayNumber <= 28 ? "Mateus" : "Mateus",
    chapterStart: dayNumber <= 28 ? dayNumber : 1,
    estimatedMinutes: 10,
    faithWord: word,
    normalizedFaithWord: normalizeWord(word).slice(0, 5),
    readingXp: 40,
    quizXp: 45,
    wordXp: 35,
    quizQuestions: [
      {
        id: `fallback-${dayNumber}-1`,
        questionOrder: 1,
        question: "Qual atitude de fé esta leitura convida você a viver hoje?",
        options: ["Escutar a Palavra", "Ignorar o próximo", "Desistir da oração"],
        correctAnswer: "Escutar a Palavra",
        explanation: "A Jornada começa sempre pela escuta fiel da Palavra."
      },
      {
        id: `fallback-${dayNumber}-2`,
        questionOrder: 2,
        question: "O que ajuda a manter a jornada espiritual?",
        options: ["Constância", "Pressa", "Distração"],
        correctAnswer: "Constância",
        explanation: "Um passo fiel por dia sustenta a caminhada."
      },
      {
        id: `fallback-${dayNumber}-3`,
        questionOrder: 3,
        question: "Qual fruto nasce de uma leitura feita com atenção?",
        options: ["Conversão", "Vaidade", "Indiferença"],
        correctAnswer: "Conversão",
        explanation: "A Palavra acolhida com fé transforma a vida."
      }
    ],
    source: "local"
  };
}

function mapMission(row: JourneyDayRow, questions: JourneyQuizQuestion[]): JourneyDayMission {
  return {
    dayNumber: row.day_number,
    title: row.title,
    bibleReference: row.bible_reference,
    bibleBook: row.bible_book ?? "Mateus",
    chapterStart: row.chapter_start ?? 1,
    verseStart: row.verse_start,
    chapterEnd: row.chapter_end,
    verseEnd: row.verse_end,
    estimatedMinutes: row.estimated_minutes ?? 10,
    faithWord: row.faith_word,
    normalizedFaithWord: normalizeWord(row.normalized_faith_word).slice(0, 5),
    readingXp: row.reading_xp ?? 40,
    quizXp: row.quiz_xp ?? 45,
    wordXp: row.word_xp ?? 35,
    quizQuestions: questions.length === 3 ? questions : fallbackMission(row.day_number).quizQuestions,
    source: "supabase"
  };
}

export async function getJourneyMission(dayNumber: number): Promise<JourneyDayMission> {
  if (!supabaseClient) return fallbackMission(dayNumber);

  try {
    const [dayResult, quizResult] = await Promise.all([
      supabaseClient
        .from("journey_days")
        .select(
          "day_number, title, bible_reference, bible_book, chapter_start, verse_start, chapter_end, verse_end, estimated_minutes, faith_word, normalized_faith_word, reading_xp, quiz_xp, word_xp"
        )
        .eq("day_number", dayNumber)
        .eq("active", true)
        .maybeSingle(),
      supabaseClient
        .from("journey_quiz_questions")
        .select("id, question_order, question, option_a, option_b, option_c, correct_option, explanation")
        .eq("day_number", dayNumber)
        .order("question_order", { ascending: true })
    ]);

    if (dayResult.error) throw dayResult.error;
    if (quizResult.error) throw quizResult.error;
    if (!dayResult.data) return fallbackMission(dayNumber);

    return mapMission(
      dayResult.data as JourneyDayRow,
      ((quizResult.data ?? []) as JourneyQuizQuestionRow[]).map(mapQuestion)
    );
  } catch (error) {
    console.warn("Journey mission fetch failed; using local fallback.", error);
    return fallbackMission(dayNumber);
  }
}
