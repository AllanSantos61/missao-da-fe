type ShareMessageParams = {
  gospelDone: boolean;
  quizScore: number;
  quizTotal: number;
  wordAttempts: number;
  wordSolved: boolean;
  streak: number;
  url: string;
};

export function buildWhatsAppShareUrl({
  gospelDone,
  quizScore,
  quizTotal,
  wordAttempts,
  wordSolved,
  streak,
  url
}: ShareMessageParams) {
  const message = [
    "Fiz minha Missão da Fé de hoje 🙏",
    `Evangelho: ${gospelDone ? "concluído" : "pendente"}`,
    `Quiz: ${quizScore}/${quizTotal}`,
    `Palavra: ${wordSolved ? wordAttempts : "-"}/6`,
    `Sequência: 🔥 ${streak} dias`,
    "Você consegue fazer também?",
    url
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
