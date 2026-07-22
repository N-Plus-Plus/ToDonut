import { useEffect, useRef, useState } from "react";
import { FeedbackMessage as FeedbackMessageType, feedbackDurationMs } from "./feedbackTypes";
import { useFeedbackMessages, useFeedbackStore } from "./FeedbackProvider";

export function FeedbackHost() {
  const { messages } = useFeedbackMessages();

  if (!messages.length) return <div className="feedback-live" aria-live="polite" aria-atomic="true" />;

  return <div className="feedback-host" aria-live="polite" aria-atomic="true">
    {messages.map((message) => <FeedbackMessage key={message.id} message={message} />)}
  </div>;
}

function FeedbackMessage({ message }: { message: FeedbackMessageType }) {
  const store = useFeedbackStore();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(feedbackDurationMs(message.duration));
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const duration = remaining.current;
    if (duration === null || paused || message.scope === "persistent") return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => store.dismiss(message.id), duration);
    return () => {
      window.clearTimeout(timer);
      if (startedAt.current !== null && remaining.current !== null) {
        remaining.current = Math.max(
          0,
          remaining.current - (Date.now() - startedAt.current),
        );
      }
    };
  }, [message.id, message.scope, paused, store]);

  function updateSelectionPause() {
    const selection = window.getSelection();
    setPaused(Boolean(selection && !selection.isCollapsed));
  }

  return <div
    className={`feedback-message ${message.tone}`}
    role={message.tone === "error" ? "alert" : "status"}
    onPointerEnter={() => setPaused(true)}
    onPointerLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
    onMouseDown={updateSelectionPause}
    onMouseUp={updateSelectionPause}
    onKeyUp={updateSelectionPause}
  >
    <div className="feedback-message__body">{message.title && <strong>{message.title}</strong>}<span>{message.message}</span></div>
    {message.action && <button className="button ghost" onClick={() => { void message.action?.run(); store.dismiss(message.id); }}>{message.action.label}</button>}
    <button className="icon-button button ghost" aria-label="Dismiss message" onClick={() => store.dismiss(message.id)}>X</button>
  </div>;
}
