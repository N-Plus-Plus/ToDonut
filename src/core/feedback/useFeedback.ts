import { useMemo } from "react";
import { FeedbackInput } from "./feedbackTypes";
import { useFeedbackStore } from "./FeedbackProvider";

export function useFeedback() {
  const store = useFeedbackStore();
  return useMemo(() => ({
    show: (input: FeedbackInput) => store.show(input),
    success: (message: string, input: Omit<FeedbackInput, "tone" | "message"> = {}) => store.tone("success", message, input),
    info: (message: string, input: Omit<FeedbackInput, "tone" | "message"> = {}) => store.tone("info", message, input),
    warning: (message: string, input: Omit<FeedbackInput, "tone" | "message"> = {}) => store.tone("warning", message, input),
    error: (message: string, input: Omit<FeedbackInput, "tone" | "message"> = {}) => store.tone("error", message, input),
    dismiss: (id: string) => store.dismiss(id),
    clearRouteScoped: () => store.clearRouteScoped(),
  }), [store]);
}
