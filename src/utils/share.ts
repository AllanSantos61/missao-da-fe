export type ShareMessageParams = {
  currentDay?: number | null;
  day?: number | null;
  quizScore?: number | null;
  quizTotal?: number | null;
  wordScore?: number | null;
  wordAttempts?: number | null;
  wordSolved?: boolean | null;
  streak?: number | null;
  xpToday?: number | null;
  totalXP?: number | null;
  readingDone?: boolean | null;
  resultUrl?: string | null;
  url?: string | null;
  publicResultUrl?: string | null;
  variant?: "complete" | "premium" | "partial";
};

function safePositiveInteger(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 1) return fallback;
  return Math.round(numberValue);
}

function safeNonNegativeInteger(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return fallback;
  return Math.round(numberValue);
}

function getResultUrl(params: ShareMessageParams) {
  return (
    params.resultUrl?.trim() ||
    params.publicResultUrl?.trim() ||
    params.url?.trim() ||
    "https://missao-da-fe.vercel.app"
  );
}

function assertCleanUtf8(message: string) {
  if (message.includes("\uFFFD")) {
    throw new Error("Share message contains replacement character.");
  }
  return message;
}

export function generateShareMessage(params: ShareMessageParams) {
  const currentDay = safePositiveInteger(params.currentDay ?? params.day, 1);
  const quizTotal = safePositiveInteger(params.quizTotal, 3);
  const quizScore = Math.min(safeNonNegativeInteger(params.quizScore), quizTotal);
  const wordScore = Math.min(
    safeNonNegativeInteger(params.wordScore ?? params.wordAttempts),
    6
  );
  const streak = safeNonNegativeInteger(params.streak);
  const totalXP = safeNonNegativeInteger(params.totalXP);
  const resultUrl = getResultUrl(params);
  const completedAll = Boolean(params.readingDone) && quizScore === quizTotal && Boolean(params.wordSolved);

  if (completedAll || params.variant === "complete" || params.variant === "premium") {
    return assertCleanUtf8([
      "🏆 Missão concluída!",
      "",
      `🙏 Dia ${currentDay} de 365`,
      "",
      "📖 Leitura concluída",
      "🧠 Quiz concluído",
      "✝️ Palavra da Fé concluída",
      "",
      `🔥 Sequência: ${streak} dias`,
      `⭐ XP total: ${totalXP}`,
      "",
      "Um passo de cada vez até concluir todo o Novo Testamento.",
      "",
      resultUrl,
      "",
      "Comece sua jornada também 🙌"
    ].join("\n"));
  }

  return assertCleanUtf8([
    "🙏 Estou participando da Missão da Fé!",
    "",
    `📖 Dia ${currentDay} de 365`,
    `🔥 Sequência: ${streak} dias`,
    `⭐ XP total: ${totalXP}`,
    "",
    "Hoje concluí:",
    "",
    params.readingDone ? "📖 Leitura" : "📖 Leitura em andamento",
    quizScore > 0 ? "🧠 Quiz" : "🧠 Quiz em andamento",
    wordScore > 0 ? "✝️ Palavra da Fé" : "✝️ Palavra da Fé em andamento",
    "",
    "Estou lendo o Novo Testamento inteiro em apenas 10 minutos por dia.",
    "",
    "Veja meu progresso:",
    "",
    resultUrl,
    "",
    "Comece sua jornada também 🙌"
  ].join("\n"));
}

export function buildWhatsAppShareUrl(params: ShareMessageParams) {
  return `https://wa.me/?text=${encodeURIComponent(generateShareMessage(params))}`;
}

export function buildStandaloneWordShareUrl(params: {
  attempts: number;
  solved: boolean;
  url: string;
}) {
  const attempts = Math.min(safePositiveInteger(params.attempts, 6), 6);
  const message = assertCleanUtf8([
    "🙏 Descobri a Palavra da Fé de hoje!",
    "",
    `✝️ Palavra da Fé: ${params.solved ? `${attempts}/6` : "quase consegui"}`,
    "",
    "Agora vou completar minha Missão da Fé.",
    "",
    params.url || "https://missao-da-fe.vercel.app"
  ].join("\n"));

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
