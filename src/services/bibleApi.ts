import type { BibleReading } from "@/types/bibleJourney";

const BIBLE_API_BASE_URL = "https://bible-api.com";
const TRANSLATION = "almeida";
const CACHE_PREFIX = "missaoDaFeBibleApiCache";

export type BibleApiReading = {
  reference: string;
  text: string;
  translation: string;
  source: "api" | "cache" | "fallback";
  errorMessage?: string;
};

type BibleApiVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleApiResponse = {
  reference?: string;
  text?: string;
  translation_name?: string;
  verses?: BibleApiVerse[];
};

const bookMap: Record<string, string> = {
  MATEUS: "matthew",
  MARCOS: "mark",
  LUCAS: "luke",
  JOAO: "john",
  ATOS: "acts",
  ROMANOS: "romans",
  "1CORINTIOS": "1 corinthians",
  "2CORINTIOS": "2 corinthians",
  GALATAS: "galatians",
  EFESIOS: "ephesians",
  FILIPENSES: "philippians",
  COLOSSENSES: "colossians",
  "1TESSALONICENSES": "1 thessalonians",
  "2TESSALONICENSES": "2 thessalonians",
  "1TIMOTEO": "1 timothy",
  "2TIMOTEO": "2 timothy",
  TITO: "titus",
  FILEMOM: "philemon",
  HEBREUS: "hebrews",
  TIAGO: "james",
  "1PEDRO": "1 peter",
  "2PEDRO": "2 peter",
  "1JOAO": "1 john",
  "2JOAO": "2 john",
  "3JOAO": "3 john",
  JUDAS: "jude",
  APOCALIPSE: "revelation"
};

function repairMojibake(value: string) {
  return value
    .replace(/\u00c3\u0192\u00c2\u00a3|\u00c3\u00a3/g, "a")
    .replace(/\u00c3\u0192\u00c2\u00a1|\u00c3\u00a1/g, "a")
    .replace(/\u00c3\u0192\u00c2\u00a2|\u00c3\u00a2/g, "a")
    .replace(/\u00c3\u0192\u00c2\u00a9|\u00c3\u00a9/g, "e")
    .replace(/\u00c3\u0192\u00c2\u00aa|\u00c3\u00aa/g, "e")
    .replace(/\u00c3\u0192\u00c2\u00ad|\u00c3\u00ad/g, "i")
    .replace(/\u00c3\u0192\u00c2\u00b3|\u00c3\u00b3/g, "o")
    .replace(/\u00c3\u0192\u00c2\u00b4|\u00c3\u00b4/g, "o")
    .replace(/\u00c3\u0192\u00c2\u00ba|\u00c3\u00ba/g, "u")
    .replace(/\u00c3\u0192\u00c2\u00a7|\u00c3\u00a7/g, "c");
}

function normalizeKey(value: string) {
  return repairMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function getCacheKey(reference: string) {
  return `${CACHE_PREFIX}:${TRANSLATION}:${normalizeKey(reference)}`;
}

function readCache(reference: string): BibleApiReading | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.localStorage.getItem(getCacheKey(reference));
    return cached ? (JSON.parse(cached) as BibleApiReading) : null;
  } catch {
    return null;
  }
}

function saveCache(reference: string, reading: BibleApiReading) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getCacheKey(reference), JSON.stringify(reading));
  } catch {
    // Cache is a performance layer only; the reading still works without it.
  }
}

function getApiBookName(book: string) {
  return bookMap[normalizeKey(book)] ?? book;
}

function buildApiReferenceFromReading(reading: BibleReading) {
  const book = getApiBookName(reading.book);
  const chapter = reading.chapterStart;

  if (reading.verseStart && reading.verseEnd) {
    return `${book} ${chapter}:${reading.verseStart}-${reading.verseEnd}`;
  }

  return `${book} ${chapter}`;
}

function buildApiReferenceFromText(reference: string) {
  const repaired = repairMojibake(reference).replace(/,/g, ":").replace(/\s+em diante/gi, "");
  const match = repaired.match(/^(\d?\s?[^0-9,:\s]+)\s+(.+)$/);

  if (!match) return repaired;

  return `${getApiBookName(match[1])} ${match[2].replace(/\s+/g, "")}`;
}

function extractText(data: BibleApiResponse, reading?: BibleReading) {
  if (reading?.verseStart && data.verses?.length) {
    const verses = data.verses.filter((verse) => {
      const sameChapter = verse.chapter === reading.chapterStart;
      const afterStart = verse.verse >= Number(reading.verseStart);
      const beforeEnd = reading.verseEnd ? verse.verse <= reading.verseEnd : true;
      return sameChapter && afterStart && beforeEnd;
    });

    if (verses.length) return verses.map((verse) => verse.text.trim()).join(" ");
  }

  return data.text?.trim() ?? "";
}

function fallbackReading(reference: string, fallbackText?: string | null, error?: unknown): BibleApiReading {
  const message =
    "Nao foi possivel carregar o texto biblico online agora. Voce pode continuar a jornada; tentaremos novamente em breve.";

  return {
    reference,
    text:
      fallbackText?.trim() ||
      "Texto biblico indisponivel no momento. A referencia da missao esta salva, e a leitura sera carregada pela Bible API assim que a conexao estiver disponivel.",
    translation: TRANSLATION,
    source: "fallback",
    errorMessage: error instanceof Error ? `${message} (${error.message})` : message
  };
}

export async function fetchBibleReading(readingOrReference: BibleReading | string): Promise<BibleApiReading> {
  const reference = typeof readingOrReference === "string" ? readingOrReference : readingOrReference.reference;
  const apiReference =
    typeof readingOrReference === "string"
      ? buildApiReferenceFromText(readingOrReference)
      : buildApiReferenceFromReading(readingOrReference);
  const url = `${BIBLE_API_BASE_URL}/${encodeURIComponent(apiReference)}?translation=${TRANSLATION}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Bible API respondeu ${response.status}`);
  }

  const data = (await response.json()) as BibleApiResponse;
  const text = extractText(data, typeof readingOrReference === "string" ? undefined : readingOrReference);

  if (!text) {
    throw new Error("Bible API nao retornou texto para esta referencia.");
  }

  return {
    reference: data.reference ?? reference,
    text,
    translation: data.translation_name ?? TRANSLATION,
    source: "api"
  };
}

export async function getReadingByReference(reference: string, fallbackText?: string | null): Promise<BibleApiReading> {
  const cached = readCache(reference);
  if (cached) return { ...cached, source: "cache" };

  try {
    const reading = await fetchBibleReading(reference);
    saveCache(reference, reading);
    return reading;
  } catch (error) {
    return fallbackReading(reference, fallbackText, error);
  }
}

export async function getDailyReading(reading: BibleReading): Promise<BibleApiReading> {
  const cacheReference = [
    reading.reference,
    reading.chapterStart,
    reading.verseStart ?? "",
    reading.verseEnd ?? ""
  ].join(":");
  const cached = readCache(cacheReference);
  if (cached) return { ...cached, source: "cache" };

  try {
    const apiReading = await fetchBibleReading(reading);
    saveCache(cacheReference, apiReading);
    return apiReading;
  } catch (error) {
    return fallbackReading(reading.reference, reading.content, error);
  }
}
