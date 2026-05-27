type ShareMessageParams = {
  gospelDone: boolean;
  quizScore: number;
  quizTotal: number;
  wordAttempts: number;
  wordSolved: boolean;
  streak: number;
  xpToday: number;
  journeyProgress?: string;
  url: string;
};

export function buildWhatsAppShareUrl({
  gospelDone,
  quizScore,
  quizTotal,
  wordAttempts,
  wordSolved,
  streak,
  xpToday,
  journeyProgress,
  url
}: ShareMessageParams) {
  const completedCount = [gospelDone, quizScore === quizTotal, wordSolved].filter(Boolean).length;
  const premiumMessage = [
    "🙏 Missão da Fé concluída!",
    "",
    "📖 Jornada do Novo Testamento",
    `🧠 Quiz da Fé: ${quizScore}/${quizTotal}`,
    `✝ Palavra da Fé: ${wordAttempts}/6`,
    "",
    `🔥 Sequência: ${streak} dias`,
    `⭐ XP ganho hoje: ${xpToday}`,
    journeyProgress ? `📚 Progresso: ${journeyProgress}` : null,
    "",
    "Você consegue completar a missão de hoje também?",
    url
  ].filter(Boolean);

  const partialMessage = [
    "🙏 Comecei minha Missão da Fé de hoje",
    "",
    `${gospelDone ? "✅" : "⬜"} Jornada do Novo Testamento`,
    `${quizScore > 0 ? "✅" : "⬜"} Quiz da Fé: ${quizScore}/${quizTotal}`,
    `${wordSolved ? "✅" : "⬜"} Palavra da Fé${wordSolved ? `: ${wordAttempts}/6` : ""}`,
    "",
    `🔥 Sequência: ${streak} dias`,
    `⭐ XP de hoje: ${xpToday}`,
    "",
    "Vem fazer a sua também?",
    url
  ];

  const message = (completedCount === 3 ? premiumMessage : partialMessage).join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
