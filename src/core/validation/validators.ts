export type ValidationResult = { valid: true } | { valid: false; code: string; message: string };

export function requiredText(value: string, label = "Title"): ValidationResult {
  return value.trim() ? { valid: true } : { valid: false, code: "required", message: `${label} is required.` };
}

export function safeHttpUrl(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return { valid: true };
  } catch {
    return { valid: false, code: "invalid-url", message: "Use a full http:// or https:// link." };
  }
  return { valid: false, code: "invalid-protocol", message: "Use a full http:// or https:// link." };
}

export function dateOnly(value: string): ValidationResult {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`))
    ? { valid: true }
    : { valid: false, code: "invalid-date", message: "Use a valid date." };
}
