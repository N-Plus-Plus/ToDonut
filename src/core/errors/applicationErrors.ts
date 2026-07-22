export type ApplicationErrorCategory =
  | "validation"
  | "authentication"
  | "authorisation"
  | "connection"
  | "conflict"
  | "persistence"
  | "configuration"
  | "unknown";

export interface ApplicationError {
  category: ApplicationErrorCategory;
  message: string;
  technicalMessage?: string;
}

export function normaliseApplicationError(error: unknown): ApplicationError {
  if (error && typeof error === "object" && "category" in error && "message" in error) {
    return error as ApplicationError;
  }
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Something went wrong.";
  const lower = message.toLowerCase();
  if (lower.includes("conflict") || lower.includes("newer update")) return { category: "conflict", message, technicalMessage: message };
  if (lower.includes("auth") || lower.includes("session") || lower.includes("sign in")) return { category: "authentication", message, technicalMessage: message };
  if (lower.includes("permission") || lower.includes("rls") || lower.includes("author")) return { category: "authorisation", message, technicalMessage: message };
  if (lower.includes("network") || lower.includes("timeout") || lower.includes("fetch") || lower.includes("connection")) return { category: "connection", message, technicalMessage: message };
  if (lower.includes("config") || lower.includes("environment")) return { category: "configuration", message, technicalMessage: message };
  if (lower.includes("required") || lower.includes("invalid") || lower.includes("http://") || lower.includes("https://")) return { category: "validation", message, technicalMessage: message };
  if (error instanceof Error) return { category: "persistence", message, technicalMessage: error.stack ?? message };
  return { category: "unknown", message, technicalMessage: message };
}
