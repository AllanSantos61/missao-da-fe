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
  if (message.includes("�")) {
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
  const xpToday = safeNonNegativeInteger(params.xpToday);
  const totalXP = safeNonNegativeInteger(params.totalXP);
  const resultUrl = getResultUrl(params);
  const completedAll = Boolean(params.readingDone) && quizScore === quizTotal && Boolean(params.wordSolved);

  if (params.variant === "premium") {
    return assertCleanUtf8([
      "🙏 Hoje completei mais uma etapa da minha Jornada da Fé.",
      "",
      `📖 Dia ${currentDay} de 365`,
      `🔥 Sequência de ${streak} dias`,
      `⭐ XP acumulado: ${totalXP}`,
      "",
      "Lendo o Novo Testamento em apenas 10 minutos por dia.",
      "",
      "Veja meu progresso:",
      "",
      resultUrl
    ].join("\n"));
  }

  if (completedAll || params.variant === "complete") {
    return assertCleanUtf8([
      "🙏 Acabei de concluir minha Missão da Fé!",
      "",
      `📖 Jornada: Dia ${currentDay} de 365`,
      `🧠 Quiz: ${quizScore}/${quizTotal}`,
      `✝️ Palavra da Fé: ${wordScore}/6`,
      `🔥 Sequência: ${streak} dias`,
      `⭐ XP conquistado hoje: ${xpToday}`,
      "",
      "Cada dia é um passo para concluir todo o Novo Testamento.",
      "",
      "Veja meu resultado:",
      "",
      resultUrl,
      "",
      "Comece sua jornada também 🙌"
    ].join("\n"));
  }

  return assertCleanUtf8([
    "🙏 Estou avançando na minha Missão da Fé de hoje.",
    "",
    `📖 Jornada: Dia ${currentDay} de 365`,
    `🧠 Quiz: ${quizScore}/${quizTotal}`,
    `✝️ Palavra da Fé: ${wordScore}/6`,
    `⭐ XP conquistado hoje: ${xpToday}`,
    "",
    "Uma missão diária para ler o Novo Testamento com constância.",
    "",
    "Veja meu progresso:",
    "",
    resultUrl
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
