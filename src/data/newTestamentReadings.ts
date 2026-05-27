import type { BibleReading } from "@/types/bibleJourney";

const placeholder =
  "Conteudo temporario para MVP. Substituir por texto biblico com licenca autorizada antes de publicar a leitura integral.";

export const fallbackNewTestamentReadings: BibleReading[] = [
  {
    orderIndex: 1,
    testament: "novo_testamento",
    book: "Mateus",
    chapterStart: 1,
    reference: "Mateus 1",
    title: "A genealogia e o nascimento de Jesus",
    content: placeholder,
    estimatedMinutes: 10
  },
  {
    orderIndex: 2,
    testament: "novo_testamento",
    book: "Mateus",
    chapterStart: 2,
    reference: "Mateus 2",
    title: "Os magos, a fuga e o retorno",
    content: placeholder,
    estimatedMinutes: 10
  },
  {
    orderIndex: 3,
    testament: "novo_testamento",
    book: "Mateus",
    chapterStart: 3,
    reference: "Mateus 3",
    title: "Joao Batista prepara o caminho",
    content: placeholder,
    estimatedMinutes: 8
  },
  {
    orderIndex: 4,
    testament: "novo_testamento",
    book: "Mateus",
    chapterStart: 4,
    reference: "Mateus 4",
    title: "Jesus no deserto e o início da missão",
    content: placeholder,
    estimatedMinutes: 10
  },
  {
    orderIndex: 5,
    testament: "novo_testamento",
    book: "Mateus",
    chapterStart: 5,
    reference: "Mateus 5",
    title: "O sermao da montanha",
    content: placeholder,
    estimatedMinutes: 12
  }
];
