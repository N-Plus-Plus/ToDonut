import { ReactNode, RefObject, useEffect, useRef } from "react";
import { X } from "lucide-react";

const focusableSelector = "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex='-1'])";

function orderedFocusable(root: HTMLElement | null): HTMLElement[] {
  const focusable = Array.from(root?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
  return [...focusable.filter((item) => item.dataset.dialogClose !== "true"), ...focusable.filter((item) => item.dataset.dialogClose === "true")];
}

export function Modal({
  title,
  children,
  onClose,
  closeDisabled = false,
  initialFocusRef,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal_title_${Math.random().toString(36).slice(2)}`);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const initialFocusRefOnOpen = useRef(initialFocusRef);

  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRefOnOpen.current?.current ?? orderedFocusable(dialogRef.current)[0];
      target?.focus();
    }, 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabledRef.current) onCloseRef.current();
      if (event.key !== "Tab") return;
      const focusable = orderedFocusable(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      previousActive?.focus();
    };
  }, []);

  const safeClose = () => { if (!closeDisabled) onClose(); };
  return <div className="modal-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) safeClose(); }}>
    <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId.current}>
      <div className="modal-header"><h3 id={titleId.current}>{title}</h3><button type="button" className="icon-button button ghost" aria-label="Close dialog" data-dialog-close="true" onClick={safeClose} disabled={closeDisabled}><X aria-hidden="true" /></button></div>
      {children}
    </div>
  </div>;
}
