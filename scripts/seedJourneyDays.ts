import { getSeedClient, normalizeText } from "./seedClient";

const books = [
  ["Mateus", 28],
  ["Marcos", 16],
  ["Lucas", 24],
  ["Joao", 21],
  ["Atos", 28],
  ["Romanos", 16],
  ["1 Corintios", 16],
  ["2 Corintios", 13],
  ["Galatas", 6],
  ["Efesios", 6],
  ["Filipenses", 4],
  ["Colossenses", 4],
  ["1 Tessalonicenses", 5],
  ["2 Tessalonicenses", 3],
  ["1 Timoteo", 6],
  ["2 Timoteo", 4],
  ["Tito", 3],
  ["Filemom", 1],
  ["Hebreus", 13],
  ["Tiago", 5],
  ["1 Pedro", 5],
  ["2 Pedro", 3],
  ["1 Joao", 5],
  ["2 Joao", 1],
  ["3 Joao", 1],
  ["Judas", 1],
  ["Apocalipse", 22]
] as const;

type ReadingSegment = {
  book: string;
  chapterStart: number;
  verseStart: number | null;
  verseEnd: number | null;
  reference: string;
  title: string;
};

function buildReadingSegments() {
  const chapters = books.flatMap(([book, chapterCount]) =>
    Array.from({ length: chapterCount }, (_, index) => ({ book, chapter: index + 1 }))
  );
  const splitCount = 365 - chapters.length;
  const splitKeys = new Set(chapters.slice(0, splitCount).map((item) => `${item.book}-${item.chapter}`));

  return chapters.flatMap<ReadingSegment>((item) => {
    if (!splitKeys.has(`${item.book}-${item.chapter}`)) {
      return [
        {
          book: item.book,
          chapterStart: item.chapter,
          verseStart: null,
          verseEnd: null,
          reference: `${item.book} ${item.chapter}`,
          title: `${item.book} ${item.chapter}`
        }
      ];
    }

    return [
      {
        book: item.book,
        chapterStart: item.chapter,
        verseStart: 1,
        verseEnd: 17,
        reference: `${item.book} ${item.chapter}:1-17`,
        title: `${item.book} ${item.chapter} - primeira parte`
      },
      {
        book: item.book,
        chapterStart: item.chapter,
        verseStart: 18,
        verseEnd: null,
        reference: `${item.book} ${item.chapter}:18`,
        title: `${item.book} ${item.chapter} - segunda parte`
      }
    ];
  });
}

async function getUniqueFaithWords() {
  const supabase = getSeedClient();
  const { data, error } = await supabase
    .from("faith_words")
    .select("word, normalized_word")
    .eq("active", true)
    .limit(1000);

  if (error) throw error;

  const unique = new Map<string, string>();
  for (const row of data ?? []) {
    const normalized = normalizeText(row.normalized_word || row.word);
    if (normalized.length === 5 && !unique.has(normalized)) {
      unique.set(normalized, row.word);
    }
  }

  if (unique.size < 365) {
    throw new Error(`A tabela faith_words precisa ter 365 palavras unicas de 5 letras. Encontradas: ${unique.size}.`);
  }

  return Array.from(unique.entries()).slice(0, 365).map(([normalized, word]) => ({ normalized, word }));
}

export async function seedJourneyDays() {
  const supabase = getSeedClient();
  const readings = buildReadingSegments().slice(0, 365);
  const words = await getUniqueFaithWords();

  const rows = readings.map((reading, index) => ({
    day_number: index + 1,
    title: `Dia ${index + 1} - ${reading.title}`,
    bible_reference: reading.reference,
    bible_book: reading.book,
    chapter_start: reading.chapterStart,
    verse_start: reading.verseStart,
    chapter_end: null,
    verse_end: reading.verseEnd,
    estimated_minutes: reading.verseStart ? 8 : 10,
    faith_word: words[index].word,
    normalized_faith_word: words[index].normalized,
    reading_xp: 40,
    quiz_xp: 45,
    word_xp: 35,
    active: true
  }));

  const { error } = await supabase.from("journey_days").upsert(rows, { onConflict: "day_number" });
  if (error) throw error;
  console.log(`Seeded ${rows.length} journey_days rows.`);
}

if (process.argv[1]?.endsWith("seedJourneyDays.ts")) {
  seedJourneyDays().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
