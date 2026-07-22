export type FeedbackTone = "success" | "info" | "warning" | "error";
export type FeedbackScope = "route" | "global" | "persistent";
export type FeedbackDuration = "short" | "standard" | "long" | "persistent" | number;

export interface FeedbackAction {
  label: string;
  run: () => void | Promise<void>;
}

export interface FeedbackMessage {
  id: string;
  tone: FeedbackTone;
  message: string;
  title?: string;
  duration: FeedbackDuration;
  scope: FeedbackScope;
  dedupeKey?: string;
  action?: FeedbackAction;
  createdAt: number;
  operationId?: string;
}

export interface FeedbackInput {
  tone: FeedbackTone;
  message: string;
  title?: string;
  duration?: FeedbackDuration;
  scope?: FeedbackScope;
  dedupeKey?: string;
  action?: FeedbackAction;
  operationId?: string;
}

export function feedbackDurationMs(duration: FeedbackDuration): number | null {
  if (duration === "persistent") return null;
  if (typeof duration === "number") return duration;
  if (duration === "short") return 2500;
  if (duration === "long") return 2500;
  return 2500;
}
