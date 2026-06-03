import { formatDias, formatUnit } from "@/utils/pluralize";

export type ShareMessageParams = {
  playerName?: string | null;
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

function normalizePlayerName(playerName?: string | null) {
  const trimmed = playerName?.trim();
  return trimmed && trimmed.toLowerCase() !== "visitante" ? trimmed : "Alguém";
}

function assertCleanUtf8(message: string) {
  if (message.includes("\uFFFD")) {
    throw new Error("Share message contains replacement character.");
  }
  return message;
}

function withoutDuplicateUrls(lines: string[]) {
  const seenUrls = new Set<string>();
  return lines.filter((line) => {
    const trimmed = line.trim();
    if (!/^https?:\/\//i.test(trimmed)) return true;
    if (seenUrls.has(trimmed)) return false;
    seenUrls.add(trimmed);
    return true;
  });
}

export function generateShareMessage(params: ShareMessageParams) {
  const currentDay = safePositiveInteger(params.currentDay ?? params.day, 1);
  const streak = safeNonNegativeInteger(params.streak);
  const totalXP = safeNonNegativeInteger(params.totalXP);
  const resultUrl = getResultUrl(params);
  const playerName = normalizePlayerName(params.playerName);
  const quizTotal = safePositiveInteger(params.quizTotal, 3);
  const quizScore = Math.min(safeNonNegativeInteger(params.quizScore), quizTotal);
  const completedAll = Boolean(params.readingDone) && quizScore === quizTotal && Boolean(params.wordSolved);

  const title = completedAll || params.variant === "complete" || params.variant === "premium"
    ? `🏆 Dia ${currentDay} de 365 concluído!`
    : `🙏 Estou no Dia ${currentDay} da Jornada da Fé`;

  const lines = [
    `🙏 ${playerName} está na Missão da Fé`,
    title,
    `🔥 Sequência: ${formatDias(streak)}`,
    `⭐ XP total: ${formatUnit(totalXP, "ponto", "pontos")}`,
    "Leia todo o Novo Testamento em apenas 10 minutos por dia.",
    "Todos os dias:",
    "📖 Um trecho da Bíblia",
    "🧠 Um quiz rápido",
    "✝️ Uma Palavra da Fé",
    "🙏 Aceita o desafio?",
    resultUrl
  ];

  return assertCleanUtf8(withoutDuplicateUrls(lines).join("\n"));
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
  const message = assertCleanUtf8(withoutDuplicateUrls([
    "🙏 Descobri a Palavra da Fé de hoje!",
    "",
    `✝️ Palavra da Fé: ${params.solved ? `${attempts}/6` : "quase consegui"}`,
    "",
    "Agora vou completar minha Missão da Fé.",
    "",
    params.url || "https://missao-da-fe.vercel.app"
  ]).join("\n"));

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
