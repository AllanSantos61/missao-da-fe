import { buildWhatsAppShareUrl, generateShareMessage } from "../src/utils/share";

const scenarios = [
  { name: "Android", currentDay: 12 },
  { name: "iOS", currentDay: 1 },
  { name: "WhatsApp Web", currentDay: 365 },
  { name: "Desktop browser", currentDay: 0 }
];

for (const scenario of scenarios) {
  const message = generateShareMessage({
    currentDay: scenario.currentDay,
    streak: 8,
    xpToday: 132,
    totalXP: 920,
    quizScore: 3,
    quizTotal: 3,
    wordScore: 6,
    wordAttempts: 6,
    wordSolved: true,
    readingDone: true,
    resultUrl: "https://missao-da-fe.vercel.app/resultado/teste",
    variant: "complete"
  });
  const url = buildWhatsAppShareUrl({
    currentDay: scenario.currentDay,
    streak: 8,
    xpToday: 132,
    totalXP: 920,
    quizScore: 3,
    quizTotal: 3,
    wordScore: 6,
    wordAttempts: 6,
    wordSolved: true,
    readingDone: true,
    resultUrl: "https://missao-da-fe.vercel.app/resultado/teste",
    variant: "complete"
  });
  const decoded = decodeURIComponent(url.split("text=")[1] ?? "");

  if (message.includes("�") || decoded.includes("�")) {
    throw new Error(`${scenario.name}: emoji quebrado na mensagem.`);
  }

  if (/Dia 0\b/.test(message) || /Dia 0\b/.test(decoded)) {
    throw new Error(`${scenario.name}: mensagem gerou Dia 0.`);
  }

  for (const emoji of ["🙏", "📖", "🧠", "✝️", "🔥", "⭐", "🙌"]) {
    if (!decoded.includes(emoji)) {
      throw new Error(`${scenario.name}: emoji ausente ${emoji}`);
    }
  }

  console.log(`${scenario.name}: OK`);
}
