import { upsertInChunks } from "./seedClient";

const topics = [
  ["Novo Testamento", "Jesus anuncia o Reino de Deus", "Jesus", "Moisés", "Davi", "O Novo Testamento apresenta Jesus como centro da fé cristã."],
  ["Evangelhos", "Qual evangelho começa com a genealogia de Jesus?", "Mateus", "Jonas", "Tobias", "Mateus inicia com a genealogia e o nascimento de Jesus."],
  ["Parábolas", "Na parábola do filho pródigo, quem acolhe o filho que volta?", "O pai", "O soldado", "O escriba", "A parábola destaca a misericórdia do pai."],
  ["Apóstolos", "Qual apóstolo é conhecido por negar Jesus e depois confirmar sua fé?", "Pedro", "Pilatos", "Herodes", "Pedro nega Jesus, mas depois assume missão de liderança."],
  ["Sacramentos", "Qual sacramento marca a entrada na vida cristã?", "Batismo", "Matrimônio", "Ordem", "O Batismo é a porta da vida cristã."],
  ["Oração", "Qual oração Jesus ensinou aos discípulos?", "Pai-Nosso", "Salve Rainha", "Credo Niceno", "O Pai-Nosso aparece nos Evangelhos como oração ensinada por Jesus."],
  ["Liturgia", "Qual celebração recorda a paixão, morte e ressurreição de Cristo?", "Páscoa", "Pentecostes", "Advento", "A Páscoa é o centro do ano litúrgico cristão."],
  ["Virtudes", "Qual virtude nos leva a confiar em Deus?", "Fé", "Vaidade", "Medo", "A fé é confiança e adesão a Deus."],
  ["Catequese", "O que significa evangelizar?", "Anunciar a Boa Nova", "Guardar silêncio sempre", "Evitar a comunidade", "Evangelizar é anunciar Cristo com vida e palavra."],
  ["Santos", "Os santos são exemplos de quê?", "Seguimento de Cristo", "Fama humana", "Poder político", "Os santos apontam para Cristo e inspiram a vida cristã."]
];

const stems = [
  "Segundo a fé cristã,",
  "Na catequese católica,",
  "Na vida de oração,",
  "Ao ler o Novo Testamento,",
  "Na missão da Igreja,"
];

function makeQuestions() {
  return Array.from({ length: 1500 }, (_, index) => {
    const topic = topics[index % topics.length];
    const stem = stems[index % stems.length];
    const number = Math.floor(index / topics.length) + 1;

    return {
      question: `${stem} ${topic[1].charAt(0).toLowerCase()}${topic[1].slice(1)}? (${number})`,
      option_a: topic[2],
      option_b: topic[3],
      option_c: topic[4],
      correct_option: "A",
      explanation: topic[5],
      difficulty: index % 9 === 0 ? "facil" : "normal",
      category: topic[0],
      active: true
    };
  });
}

async function main() {
  await upsertInChunks("quiz_questions", makeQuestions());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
