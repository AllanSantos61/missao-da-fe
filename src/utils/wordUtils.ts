import type { LetterStatus } from "@/types/challenge";

export function normalizeWord(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

export function getWordLetterStatuses(guess: string, secret: string): LetterStatus[] {
  const normalizedGuess = normalizeWord(guess);
  const normalizedSecret = normalizeWord(secret);
  const remainingLetters = normalizedSecret.split("");
  const statuses: LetterStatus[] = Array.from({ length: normalizedSecret.length }, () => "absent");

  normalizedGuess.split("").forEach((letter, index) => {
    if (letter === normalizedSecret[index]) {
      statuses[index] = "correct";
      remainingLetters[index] = "";
    }
  });

  normalizedGuess.split("").forEach((letter, index) => {
    if (statuses[index] === "correct") return;

    const foundIndex = remainingLetters.indexOf(letter);
    if (foundIndex >= 0) {
      statuses[index] = "present";
      remainingLetters[foundIndex] = "";
    }
  });

  return statuses;
}
