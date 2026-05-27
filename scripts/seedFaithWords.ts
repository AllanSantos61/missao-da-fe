import { normalizeText, upsertInChunks } from "./seedClient";

const approvedWords = [
  "JESUS", "MARIA", "GRAÇA", "MISSA", "SANTO", "SALMO", "CREIO", "REZAR", "ANJOS", "CRIST",
  "PEDRO", "PAULO", "LUCAS", "MARCOS", "TOMAS", "MATEO", "JUDEA", "SIAO", "MOISE",
  "DAVID", "ELIAS", "ELISE", "ISAAC", "JACOB", "SARAI", "RUTE", "ESTER", "JONAS", "NAZAR",
  "GALIL", "BETEL", "SALEM", "SILOE", "CEDRO", "MONTE", "TEMPLO", "ALTAR", "CRUZ", "CRUZS",
  "VOTOS", "VIRGO", "AVEIA", "AVEPA", "TERCO", "CONTA", "ROSAS", "ROSAR", "GLORI", "HONRA",
  "LOUVA", "CANTA", "CANTO", "HINOS", "VERSO", "LIVRO", "VERBO", "CARNE", "SINAL", "LUZES",
  "PAZES", "MANSO", "JUSTO", "PUROS", "LIMPO", "SABER", "VIVER", "AMADO", "AMADA", "AMAR",
  "AMORE", "ZELOS", "ZELOU", "FIDEL", "FORTE", "PEDRA", "ROCHA", "TRIGO", "VINHO", "PEIXE",
  "REDES", "BARCO", "MANTO", "OLEOS", "UNCAO", "CURAR", "SARAR", "SALVA", "SALVO", "PERDO",
  "CHAGA", "DORSA", "CALIZ", "PAIXO", "PASCO", "JEJUM", "ESMOL", "VIGIA", "VIGIL", "ORANT",
  "ORACO", "CLERO", "FREI", "FREIS", "MONJA", "BISPO", "PAPA", "PADRE", "DIACO", "LEIGO",
  "LAICO", "CRISMA", "BATIS", "NOIVA", "NOIVO", "BODAS", "AGAPE", "BENCA", "BENZE", "BENZI",
  "SACRO", "SAGRA", "SAGRO", "HUMIL", "DOCEU", "DOCE", "SERVO", "SERVA", "OBRAS", "DONS",
  "DOMES", "DOMAR", "FRUTO", "VIRTU", "BONDA", "CASTO", "CASTA", "PUDE", "PAULO", "PEDRO"
];

const roots = [
  "JESUS", "MARIA", "GRACA", "MISSA", "SANTO", "SALMO", "CREIO", "REZAR", "ANJOS", "PEDRO",
  "PAULO", "LUCAS", "TOMAS", "DAVID", "ELIAS", "ESTER", "JONAS", "ALTAR", "CRUZS", "TERCO",
  "HONRA", "LOUVA", "CANTO", "HINOS", "LIVRO", "VERBO", "SINAL", "LUZES", "PAZES", "JUSTO",
  "PUROS", "VIVER", "AMADO", "FIDEL", "FORTE", "PEDRA", "ROCHA", "TRIGO", "VINHO", "PEIXE",
  "REDES", "BARCO", "MANTO", "UNCAO", "CURAR", "SARAR", "SALVA", "SALVO", "CHAGA", "JEJUM",
  "VIGIA", "BISPO", "PADRE", "LEIGO", "CRISMA", "AGAPE", "BENZE", "SACRO", "HUMIL", "SERVO"
];

function makeWords() {
  const words: string[] = [];

  for (const word of approvedWords) {
    const normalized = normalizeText(word);
    if (normalized.length === 5) words.push(word);
  }

  let index = 0;
  while (words.length < 500) {
    words.push(roots[index % roots.length]);
    index += 1;
  }

  return words.slice(0, 500).map((word, rowIndex) => ({
    word,
    normalized_word: normalizeText(word),
    category: rowIndex % 4 === 0 ? "bíblico" : rowIndex % 4 === 1 ? "oração" : rowIndex % 4 === 2 ? "virtude" : "liturgia",
    difficulty: rowIndex % 7 === 0 ? "facil" : "normal",
    active: true
  }));
}

async function main() {
  const rows = makeWords();
  const invalid = rows.filter((row) => row.normalized_word.length !== 5);
  if (invalid.length) throw new Error(`Invalid 5-letter words: ${invalid.map((row) => row.word).join(", ")}`);
  await upsertInChunks("faith_words", rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
