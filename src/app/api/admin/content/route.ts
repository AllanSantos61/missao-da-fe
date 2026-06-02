import { adminError, adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

type JourneyDayRow = {
  id: string;
  day_number: number;
  title: string | null;
  bible_reference: string | null;
  bible_book: string | null;
  faith_word: string | null;
  normalized_faith_word: string | null;
  estimated_minutes: number | null;
  reading_xp: number | null;
  quiz_xp: number | null;
  word_xp: number | null;
};

type QuestionRow = {
  id: string;
  journey_day_id: string | null;
  day_number: number;
  question_order: number | null;
  question: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  correct_option: string | null;
  explanation: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function buildDiagnostics(days: JourneyDayRow[], questions: QuestionRow[]) {
  const questionsByDay = new Map<number, QuestionRow[]>();
  for (const question of questions) {
    questionsByDay.set(question.day_number, [...(questionsByDay.get(question.day_number) ?? []), question]);
  }

  const wordCounts = new Map<string, number>();
  const dayCounts = new Map<number, number>();
  for (const day of days) {
    if (day.normalized_faith_word) {
      wordCounts.set(day.normalized_faith_word, (wordCounts.get(day.normalized_faith_word) ?? 0) + 1);
    }
    dayCounts.set(day.day_number, (dayCounts.get(day.day_number) ?? 0) + 1);
  }

  const daysWithLessThan3Questions = days
    .filter((day) => (questionsByDay.get(day.day_number)?.length ?? 0) < 3)
    .map((day) => day.day_number);

  return {
    totalDays: days.length,
    totalQuestions: questions.length,
    daysWithLessThan3Questions,
    daysWithoutWord: days.filter((day) => !day.faith_word || !day.normalized_faith_word).map((day) => day.day_number),
    daysWithoutReference: days.filter((day) => !day.bible_reference).map((day) => day.day_number),
    duplicatedWords: Array.from(wordCounts.entries()).filter(([, count]) => count > 1).map(([word]) => word),
    duplicatedDayNumbers: Array.from(dayCounts.entries()).filter(([, count]) => count > 1).map(([day]) => day),
    incompleteDays: daysWithLessThan3Questions.length
  };
}

export async function GET(request: Request) {
  try {
    console.info("[Admin] Fetching content");
    const supabase = requireAdminApi();
    const { searchParams } = new URL(request.url);
    const dayFilter = searchParams.get("day")?.trim();
    const query = normalizeText(searchParams.get("q"));
    const filter = searchParams.get("filter") ?? "all";

    const [daysResult, questionsResult] = await Promise.all([
      supabase
        .from("journey_days")
        .select("id, day_number, title, bible_reference, bible_book, faith_word, normalized_faith_word, estimated_minutes, reading_xp, quiz_xp, word_xp")
        .order("day_number", { ascending: true })
        .limit(500),
      supabase
        .from("journey_quiz_questions")
        .select("id, journey_day_id, day_number, question_order, question, option_a, option_b, option_c, correct_option, explanation")
        .order("day_number", { ascending: true })
        .order("question_order", { ascending: true })
        .limit(2000)
    ]);

    if (daysResult.error) throw daysResult.error;
    if (questionsResult.error) throw questionsResult.error;

    const days = (daysResult.data ?? []) as JourneyDayRow[];
    const questions = (questionsResult.data ?? []) as QuestionRow[];
    const diagnostics = buildDiagnostics(days, questions);
    const questionsByDay = new Map<number, QuestionRow[]>();
    for (const question of questions) {
      questionsByDay.set(question.day_number, [...(questionsByDay.get(question.day_number) ?? []), question]);
    }

    let content = days.map((day) => ({
      ...day,
      questions: questionsByDay.get(day.day_number) ?? []
    }));

    if (dayFilter) {
      const dayNumber = Number(dayFilter);
      if (Number.isFinite(dayNumber)) content = content.filter((day) => day.day_number === dayNumber);
    }

    if (query) {
      content = content.filter((day) => {
        const text = [
          day.day_number,
          day.title,
          day.bible_reference,
          day.faith_word,
          day.normalized_faith_word,
          ...day.questions.flatMap((question) => [question.question, question.option_a, question.option_b, question.option_c, question.explanation])
        ].map(normalizeText).join(" ");
        return text.includes(query);
      });
    }

    if (filter === "missing_questions") {
      content = content.filter((day) => day.questions.length < 3);
    } else if (filter === "incomplete") {
      content = content.filter((day) => day.questions.length < 3 || !day.faith_word || !day.bible_reference);
    }

    return adminSuccess({ days: content, diagnostics });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    console.info("[Admin] Update content");
    const supabase = requireAdminApi();
    const body = (await request.json()) as {
      type?: "journey" | "question";
      id?: string;
      values?: Record<string, unknown>;
    };

    if (!body.id || !body.values) return adminError("Informe o tipo, id e valores para atualizar.", 400);
    const type = body.type === "question" ? "question" : "journey";
    const table = type === "question" ? "journey_quiz_questions" : "journey_days";
    const allowedFields =
      type === "question"
        ? ["question", "option_a", "option_b", "option_c", "correct_option", "explanation"]
        : ["title", "bible_reference", "faith_word", "normalized_faith_word", "estimated_minutes", "reading_xp", "quiz_xp", "word_xp"];
    const values = Object.fromEntries(Object.entries(body.values).filter(([key]) => allowedFields.includes(key)));

    const { error } = await supabase.from(table).update(values).eq("id", body.id);
    if (error) throw error;
    return adminSuccess({ updated: true });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
