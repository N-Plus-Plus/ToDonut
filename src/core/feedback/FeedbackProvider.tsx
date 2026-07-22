import { createContext, ReactNode, useContext, useRef, useSyncExternalStore } from "react";
import { FeedbackStore } from "./feedbackStore";

const FeedbackContext = createContext<FeedbackStore | null>(null);
const EMPTY_FEEDBACK_SNAPSHOT = { messages: [] };

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<FeedbackStore | null>(null);
  if (!storeRef.current) storeRef.current = new FeedbackStore();
  return <FeedbackContext.Provider value={storeRef.current}>{children}</FeedbackContext.Provider>;
}

export function useFeedbackStore(): FeedbackStore {
  const store = useContext(FeedbackContext);
  if (!store) throw new Error("FeedbackProvider is missing.");
  return store;
}

export function useFeedbackMessages() {
  const store = useFeedbackStore();
  return useSyncExternalStore(store.subscribe.bind(store), () => store.snapshot(), () => EMPTY_FEEDBACK_SNAPSHOT);
}
