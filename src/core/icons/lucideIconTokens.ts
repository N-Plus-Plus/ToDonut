export function normaliseLucideIconName(value: string): string {
  return value.replace(/\s+/g, "").toLocaleLowerCase();
}

export function parseLucideIconTokens(value: string): string[] {
  return value.split("|").map(normaliseLucideIconName).filter(Boolean);
}
