import type { DailyChallengeData } from "@/types/dailyChallenge";

export const dailyChallengeData: DailyChallengeData = {
  date: "2026-05-27",
  gospel: {
    title: "A misericórdia que levanta",
    reference: "Lucas 15, 1-7",
    excerpt:
      "Jesus contou a parábola do pastor que deixa as noventa e nove ovelhas no deserto e vai atrás daquela que se perdeu. Ao encontrá-la, coloca-a nos ombros com alegria e convida todos a celebrar.",
    reflection:
      "Deus não se cansa de procurar o coração que se afastou. A fé de hoje começa com esta certeza: você vale a busca de Deus.",
    dailyPractice:
      "Envie uma mensagem simples a alguém que anda distante. Sem cobrança, apenas presença.",
    xp: 30
  },
  quiz: {
    title: "Quiz da Fé",
    xp: 45,
    questions: [
      {
        id: "q1",
        question: "Qual é a principal mensagem da leitura de hoje?",
        options: [
          "Deus procura quem se perdeu com amor",
          "A fé depende de grandes discursos",
          "A alegria deve ficar escondida"
        ],
        correctAnswer: "Deus procura quem se perdeu com amor"
      },
      {
        id: "q2",
      question: "Que atitude Jesus ensina neste trecho?",
        options: [
          "Acolher e buscar quem esta distante",
          "Julgar antes de se aproximar",
          "Desistir de quem erra"
        ],
        correctAnswer: "Acolher e buscar quem esta distante"
      },
      {
        id: "q3",
        question: "Qual palavra melhor resume a passagem?",
        options: ["Misericórdia", "Medo", "Indiferença"],
        correctAnswer: "Misericórdia"
      }
    ]
  },
  word: {
    title: "Palavra da Fé",
    secret: "GRACA",
    xp: 35
  },
  challengeOrder: ["gospel", "quiz", "word"]
};
