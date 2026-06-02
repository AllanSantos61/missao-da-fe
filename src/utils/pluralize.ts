export function formatUnit(value: number, singular: string, plural: string) {
  const safeValue = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
  return `${safeValue} ${safeValue === 1 ? singular : plural}`;
}

export function formatDias(value: number) {
  return formatUnit(value, "dia", "dias");
}

export function formatSemanas(value: number) {
  return formatUnit(value, "semana", "semanas");
}

export function formatConquistas(value: number) {
  return formatUnit(value, "conquista", "conquistas");
}
