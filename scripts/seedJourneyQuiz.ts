import { getSeedClient } from "./seedClient";

type JourneyDay = {
  id: string;
  day_number: number;
  title: string;
  bible_reference: string;
  bible_book: string | null;
  faith_word: string;
};

function questionsForDay(day: JourneyDay) {
  const book = day.bible_book || "Novo Testamento";

  return [
    {
      journey_day_id: day.id,
      day_number: day.day_number,
      question_order: 1,
      question: `Qual é a leitura principal do Dia ${day.day_number} da Jornada da Fé?`,
      option_a: day.bible_reference,
      option_b: "Salmo 1",
      option_c: "Gênesis 1",
      correct_option: "A",
      explanation: `O Dia ${day.day_number} acompanha a sequência do Novo Testamento em ${day.bible_reference}.`
    },
    {
      journey_day_id: day.id,
      day_number: day.day_number,
      question_order: 2,
      question: `Em qual livro bíblico está a missão deste dia?`,
      option_a: book,
      option_b: "Êxodo",
      option_c: "Provérbios",
      correct_option: "A",
      explanation: `A referência deste dia pertence ao livro de ${book}.`
    },
    {
      journey_day_id: day.id,
      day_number: day.day_number,
      question_order: 3,
      question: "Qual atitude combina melhor com a Jornada da Fé?",
      option_a: "Ler com atenção e responder com fé",
      option_b: "Pular as partes mais difíceis",
      option_c: "Competir sem refletir",
      correct_option: "A",
      explanation: "A jornada une leitura, reflexão e constância diária."
    }
  ];
}

export async function seedJourneyQuiz() {
  const supabase = getSeedClient();
  const { data, error } = await supabase
    .from("journey_days")
    .select("id, day_number, title, bible_reference, bible_book, faith_word")
    .eq("active", true)
    .order("day_number", { ascending: true })
    .limit(365);

  if (error) throw error;
  if (!data || data.length < 365) {
    throw new Error(`Expected 365 journey_days rows, found ${data?.length ?? 0}. Run npm run seed:journey first.`);
  }

  const rows = (data as JourneyDay[]).flatMap(questionsForDay);
  const { error: upsertError } = await supabase
    .from("journey_quiz_questions")
    .upsert(rows, { onConflict: "day_number,question_order" });

  if (upsertError) throw upsertError;
  console.log(`Seeded ${rows.length} journey_quiz_questions rows.`);
}

if (process.argv[1]?.endsWith("seedJourneyQuiz.ts")) {
  seedJourneyQuiz().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
