type ShareMessageParams = {
  day?: number;
  quizScore: number;
  quizTotal: number;
  wordAttempts: number;
  wordSolved: boolean;
  streak: number;
  xpToday: number;
  readingDone: boolean;
  url: string;
};

export function generateShareMessage({
  day,
  quizScore,
  quizTotal,
  wordAttempts,
  wordSolved,
  streak,
  xpToday,
  readingDone,
  url
}: ShareMessageParams) {
  const completedAll = readingDone && quizScore === quizTotal && wordSolved;

  if (completedAll) {
    return [
      "🙏 Missão da Fé concluída!",
      "",
      `📖 Jornada: Dia ${day ?? 1}/365`,
      `🧠 Quiz: ${quizScore}/${quizTotal}`,
      `✝️ Palavra: ${wordAttempts}/6`,
      `🔥 Sequência: ${streak} dias`,
      `⭐ XP hoje: ${xpToday}`,
      "",
      "Você consegue completar sua missão de hoje também?",
      url
    ].join("\n");
  }

  return [
    "🙏 Estou fazendo minha Missão da Fé de hoje",
    "",
    `${readingDone ? "✅" : "⬜"} Jornada: Dia ${day ?? 1}/365`,
    `${quizScore > 0 ? "✅" : "⬜"} Quiz: ${quizScore}/${quizTotal}`,
    `${wordSolved ? "✅" : "⬜"} Palavra da Fé${wordSolved ? `: ${wordAttempts}/6` : ""}`,
    `⭐ XP hoje: ${xpToday}`,
    "",
    "Vem completar a sua missão também.",
    url
  ].join("\n");
}

export function buildWhatsAppShareUrl(params: ShareMessageParams) {
  return `https://wa.me/?text=${encodeURIComponent(generateShareMessage(params))}`;
}
