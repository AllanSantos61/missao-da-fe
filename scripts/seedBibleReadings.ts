import { getSeedClient } from "./seedClient";

const books = [
  ["Mateus", 28],
  ["Marcos", 16],
  ["Lucas", 24],
  ["João", 21],
  ["Atos", 28],
  ["Romanos", 16],
  ["1 Coríntios", 16],
  ["2 Coríntios", 13],
  ["Gálatas", 6],
  ["Efésios", 6],
  ["Filipenses", 4],
  ["Colossenses", 4],
  ["1 Tessalonicenses", 5],
  ["2 Tessalonicenses", 3],
  ["1 Timóteo", 6],
  ["2 Timóteo", 4],
  ["Tito", 3],
  ["Filemom", 1],
  ["Hebreus", 13],
  ["Tiago", 5],
  ["1 Pedro", 5],
  ["2 Pedro", 3],
  ["1 João", 5],
  ["2 João", 1],
  ["3 João", 1],
  ["Judas", 1],
  ["Apocalipse", 22]
] as const;

const source = "Bible API (translation=almeida) sob demanda; o banco guarda apenas metadados da leitura.";

function makeSegments() {
  const chapters = books.flatMap(([book, chapterCount]) =>
    Array.from({ length: chapterCount }, (_, index) => ({
      book,
      chapter: index + 1
    }))
  );

  const extraSegmentsNeeded = 365 - chapters.length;
  const splitChapterKeys = new Set(
    chapters
      .filter((item) => !["2 João", "3 João", "Judas", "Filemom"].includes(item.book))
      .slice(0, extraSegmentsNeeded)
      .map((item) => `${item.book}-${item.chapter}`)
  );

  const segments: Array<{
    book: string;
    chapterStart: number;
    verseStart?: number;
    chapterEnd?: number;
    verseEnd?: number;
    reference: string;
    title: string;
  }> = [];

  chapters.forEach((item) => {
    if (splitChapterKeys.has(`${item.book}-${item.chapter}`)) {
      segments.push({
        book: item.book,
        chapterStart: item.chapter,
        verseStart: 1,
        verseEnd: 17,
        reference: `${item.book} ${item.chapter}, 1-17`,
        title: `${item.book} ${item.chapter} — primeira parte`
      });
      segments.push({
        book: item.book,
        chapterStart: item.chapter,
        verseStart: 18,
        reference: `${item.book} ${item.chapter}, 18 em diante`,
        title: `${item.book} ${item.chapter} — segunda parte`
      });
    } else {
      segments.push({
        book: item.book,
        chapterStart: item.chapter,
        reference: `${item.book} ${item.chapter}`,
        title: `${item.book} ${item.chapter}`
      });
    }
  });

  return segments.slice(0, 365).map((segment, index) => ({
    order_index: index + 1,
    testament: "novo_testamento",
    book: segment.book,
    chapter_start: segment.chapterStart,
    verse_start: segment.verseStart ?? null,
    chapter_end: segment.chapterEnd ?? null,
    verse_end: segment.verseEnd ?? null,
    reference: segment.reference,
    title: segment.title,
    content: null,
    source,
    estimated_minutes: segment.verseStart ? 8 : 10,
    active: true
  }));
}

async function main() {
  const supabase = getSeedClient();
  const rows = makeSegments();

  for (const row of rows) {
    const { error } = await supabase.from("bible_readings").upsert(row, { onConflict: "order_index" });
    if (error) throw error;
  }

  console.log(`Seeded ${rows.length} bible_readings rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
