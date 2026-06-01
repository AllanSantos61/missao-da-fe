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

  if (message.includes("\uFFFD") || decoded.includes("\uFFFD")) {
    throw new Error(`${scenario.name}: emoji quebrado na mensagem.`);
  }

  if (/Dia 0\b/.test(message) || /Dia 0\b/.test(decoded)) {
    throw new Error(`${scenario.name}: mensagem gerou Dia 0.`);
  }

  for (const emoji of ["🙏", "📖", "🧠", "✝️", "🔥", "⭐", "🏆", "🙌"]) {
    if (!decoded.includes(emoji)) {
      throw new Error(`${scenario.name}: emoji ausente ${emoji}`);
    }
  }

  console.log(`${scenario.name}: OK`);
}

const partialMessage = generateShareMessage({
  currentDay: 0,
  streak: 0,
  totalXP: 10,
  quizScore: 0,
  quizTotal: 3,
  wordScore: 0,
  readingDone: false,
  resultUrl: "https://missao-da-fe.vercel.app/resultado/parcial",
  variant: "partial"
});

if (partialMessage.includes("\uFFFD") || /Dia 0\b/.test(partialMessage)) {
  throw new Error("Mensagem parcial gerou encoding quebrado ou Dia 0.");
}

for (const emoji of ["🙏", "📖", "🧠", "✝️", "🔥", "⭐", "🙌"]) {
  if (!partialMessage.includes(emoji)) {
    throw new Error(`Mensagem parcial: emoji ausente ${emoji}`);
  }
}
