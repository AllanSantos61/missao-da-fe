import type { DailyChallengeData } from "@/types/dailyChallenge";

export const dailyChallengeData: DailyChallengeData = {
  date: "2026-05-27",
  gospel: {
    title: "A misericordia que levanta",
    reference: "Lucas 15, 1-7",
    excerpt:
      "Jesus contou a parabola do pastor que deixa as noventa e nove ovelhas no deserto e vai atras daquela que se perdeu. Ao encontra-la, coloca-a nos ombros com alegria e convida todos a celebrar.",
    reflection:
      "Deus nao se cansa de procurar o coracao que se afastou. A fe de hoje comeca com esta certeza: voce vale a busca de Deus.",
    dailyPractice:
      "Envie uma mensagem simples a alguem que anda distante. Sem cobranca, apenas presenca.",
    xp: 30
  },
  quiz: {
    title: "Quiz da Fe",
    xp: 45,
    questions: [
      {
        id: "q1",
        question: "Qual e a principal mensagem do Evangelho de hoje?",
        options: [
          "Deus procura quem se perdeu com amor",
          "A fe depende de grandes discursos",
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
        options: ["Misericordia", "Medo", "Indiferenca"],
        correctAnswer: "Misericordia"
      }
    ]
  },
  word: {
    title: "Palavra da Fe",
    secret: "GRACA",
    xp: 35
  },
  challengeOrder: ["gospel", "quiz", "word"]
};
