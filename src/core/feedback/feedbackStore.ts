import { FeedbackInput, FeedbackMessage, FeedbackTone } from "./feedbackTypes";

export interface FeedbackSnapshot {
  messages: FeedbackMessage[];
}

export class FeedbackStore {
  private messages: FeedbackMessage[] = [];
  private currentSnapshot: FeedbackSnapshot = { messages: this.messages };
  private readonly listeners = new Set<() => void>();
  private readonly maxVisible: number;

  constructor(maxVisible = 3) {
    this.maxVisible = maxVisible;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot(): FeedbackSnapshot {
    return this.currentSnapshot;
  }

  show(input: FeedbackInput): FeedbackMessage {
    const dedupeKey = input.dedupeKey ?? `${input.scope ?? "route"}:${input.tone}:${input.message}`;
    const withoutDuplicate = this.messages.filter((message) => message.dedupeKey !== dedupeKey);
    const message: FeedbackMessage = {
      id: input.operationId ?? `feedback_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
      tone: input.tone,
      message: input.message,
      title: input.title,
      duration: input.duration ?? "standard",
      scope: input.scope ?? "route",
      dedupeKey,
      action: input.action,
      createdAt: Date.now(),
      operationId: input.operationId,
    };
    this.replaceMessages([...withoutDuplicate, message].slice(-this.maxVisible));
    return message;
  }

  dismiss(id: string): void {
    this.replaceMessages(this.messages.filter((message) => message.id !== id));
  }

  clearRouteScoped(): void {
    this.replaceMessages(this.messages.filter((message) => message.scope !== "route"));
  }

  clearAll(): void {
    this.replaceMessages([]);
  }

  tone(tone: FeedbackTone, message: string, input: Omit<FeedbackInput, "tone" | "message"> = {}): FeedbackMessage {
    return this.show({ ...input, tone, message });
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private replaceMessages(nextMessages: FeedbackMessage[]): void {
    if (sameMessages(this.messages, nextMessages)) return;
    this.messages = nextMessages;
    this.currentSnapshot = { messages: this.messages };
    this.emit();
  }
}

function sameMessages(left: FeedbackMessage[], right: FeedbackMessage[]): boolean {
  return left.length === right.length && left.every((message, index) => message === right[index]);
}
