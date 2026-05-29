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

const rawFaithWords = `
JESUS MARIA GRACA MISSA SANTO SALMO CREIO REZAR ANJOS PEDRO PAULO LUCAS TOMAS DAVID
ELIAS ESTER JONAS ALTAR TERCO HONRA LOUVA CANTO HINOS LIVRO VERBO SINAL LUZES PAZES
JUSTO PUROS VIVER AMADO FIDEL FORTE PEDRA ROCHA TRIGO VINHO PEIXE REDES BARCO MANTO
UNCAO CURAR SARAR SALVA SALVO CHAGA JEJUM VIGIA BISPO PADRE LEIGO AGAPE BENZE SACRO
HUMIL SERVO SERVA OBRAS FRUTO CASTO CASTA NOIVA NOIVO BODAS CLERO FREIS MONJA DIACO
LAICO BATIS ROSAS GLORI VOTOS MONTE CEDRO SALEM BETEL SILOE NAZAR JUDEA GALIL MOISE
ISAAC JACOB SARAI ESTER RUTEU JOSES ELISE OSEIA NAUMI ABDIA SOFON AGEUS ESDRA
NEEAS JOBES JAIRO SIMAO ANDRE FELIP TIAGO MATEU NICOL SILAS LIDIA LOIDE ENEAS
DAMAS BETSA CAFAR EMAUS SIQUE SAREP TIBER SIDON TIROS PATMO MALTA CRETA SAMOS
MILET COSME ROMAS ASIAS ACAIA LISIA LICIA PANFI PONTO MEDOS PARTO ELAMI ARABE
ZELOU ORANT ORACO SACRA SACRO BENCA BENZI UNGIR UNIDO DEVOT DEVOS CRIST CRISTO
LUZIR AMPAR DOCAO DOADO DOAIS DOAID ORDEM FONTE FESTA CEIAS SENTA LAVAR SERVI
VINDE IDEAI IDEAO IDEAS ENVIA ENVIO CHAMA CHAME SEGUI SEGUE CRUZA CRUZR PASCO
PAIXO CALIZ CORDE LIRIO CEDRO OLIVA RAMOS PALMA CINTO TUNCA VESTE PANOS LENCO
AREIA BARRO POCOU AGUAS MARES LAGOS RIOSA PORTA CASAQ CASAS TENDQ TENDA CAMPO
SEARA CEIFA GRAOS GRAOZ PAOES FERME FERVO FEROR FERVI DORES CHORE CHORA CEGOS
SURDO MUDOS LEPRO PARIR NASCE NASCI MORRE MORRI VENCE VITOR VIDAQ VIDAS ALMAS
CORPO SANGR UNGUE OLEOS NARDO AROMA INCEN OFERT DIZIM ESMOL POBRE RICOS VIUVA
ORFAO MISER MANSA MANSO MANSR PUREZ LIMPO LIMPA PACES PACIF BOMDE BOAMA BOANO
VERAZ VERDA RETOS RETAS RETOR
`;

const namePrefixes = [
  "AB", "AD", "AM", "AN", "AR", "AS", "AZ", "BA", "BE", "BO", "CA", "CE", "DA", "DE", "DI", "DO",
  "EL", "EM", "EN", "ER", "ES", "EU", "GA", "GE", "GI", "HA", "HE", "HI", "IA", "JA", "JE", "JO",
  "JU", "LA", "LE", "LI", "MA", "ME", "MI", "MO", "NA", "NE", "NI", "NO", "OB", "OS", "PA", "PE",
  "RA", "RE", "RI", "SA", "SE", "SI", "SO", "TA", "TE", "TI", "TO", "ZA", "ZE", "ZI"
];
const nameSuffixes = ["AEL", "IAS", "EAS", "IEL", "EUS", "IOS", "AIA", "EIA", "OAS", "ELO", "INO", "ARO"];

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
      return [{
        book: item.book,
        chapterStart: item.chapter,
        verseStart: null,
        verseEnd: null,
        reference: `${item.book} ${item.chapter}`,
        title: `${item.book} ${item.chapter}`
      }];
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
  }).slice(0, 365);
}

function buildFaithWords() {
  const unique = new Map<string, string>();

  for (const word of rawFaithWords.split(/\s+/)) {
    const normalized = normalizeText(word);
    if (normalized.length === 5 && !unique.has(normalized)) {
      unique.set(normalized, word);
    }
  }

  for (const prefix of namePrefixes) {
    for (const suffix of nameSuffixes) {
      const normalized = normalizeText(`${prefix}${suffix}`).slice(0, 5);
      if (normalized.length === 5 && !unique.has(normalized)) {
        unique.set(normalized, normalized);
      }
      if (unique.size >= 365) break;
    }
    if (unique.size >= 365) break;
  }

  if (unique.size < 365) {
    throw new Error(`Nao foi possivel gerar 365 palavras unicas de 5 letras. Total: ${unique.size}.`);
  }

  return Array.from(unique.entries()).slice(0, 365).map(([normalized, word]) => ({ normalized, word }));
}

function buildQuizRows(days: Array<{ id: string; day_number: number; bible_reference: string; bible_book: string | null }>) {
  return days.flatMap((day) => {
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
        explanation: `O Dia ${day.day_number} segue a sequência do Novo Testamento em ${day.bible_reference}.`
      },
      {
        journey_day_id: day.id,
        day_number: day.day_number,
        question_order: 2,
        question: "Qual atitude ajuda a viver melhor esta missão?",
        option_a: "Ler com atenção e responder com fé",
        option_b: "Pular a leitura para ganhar tempo",
        option_c: "Responder sem refletir",
        correct_option: "A",
        explanation: "A Jornada da Fé une leitura, atenção e constância."
      },
      {
        journey_day_id: day.id,
        day_number: day.day_number,
        question_order: 3,
        question: `Em qual livro está a leitura deste dia?`,
        option_a: book,
        option_b: "Êxodo",
        option_c: "Provérbios",
        correct_option: "A",
        explanation: `A referência deste dia pertence ao livro de ${book}.`
      }
    ];
  });
}

async function main() {
  const supabase = getSeedClient();
  const readings = buildReadingSegments();
  const words = buildFaithWords();

  const dayRows = readings.map((reading, index) => ({
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

  const dayUpsert = await supabase.from("journey_days").upsert(dayRows, { onConflict: "day_number" });
  if (dayUpsert.error) throw dayUpsert.error;

  const { data: savedDays, error: selectError } = await supabase
    .from("journey_days")
    .select("id, day_number, bible_reference, bible_book")
    .order("day_number", { ascending: true })
    .limit(365);

  if (selectError) throw selectError;
  if (!savedDays || savedDays.length !== 365) {
    throw new Error(`Esperava 365 registros em journey_days, encontrei ${savedDays?.length ?? 0}.`);
  }

  const quizRows = buildQuizRows(savedDays);
  const quizUpsert = await supabase
    .from("journey_quiz_questions")
    .upsert(quizRows, { onConflict: "day_number,question_order" });

  if (quizUpsert.error) throw quizUpsert.error;

  console.log("Seed completo da Jornada da Fe:");
  console.log(`- ${dayRows.length} dias`);
  console.log(`- ${words.length} palavras`);
  console.log(`- ${quizRows.length} perguntas`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
