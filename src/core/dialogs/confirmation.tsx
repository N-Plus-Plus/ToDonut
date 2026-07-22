import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { Modal } from "./Modal";

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "ordinary" | "destructive";
  onConfirm: () => void | Promise<void>;
}

const ConfirmationContext = createContext<((request: ConfirmationRequest) => void) | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const confirm = useCallback((next: ConfirmationRequest) => setRequest(next), []);
  return <ConfirmationContext.Provider value={confirm}>
    {children}
    {request && <Modal title={request.title} onClose={() => setRequest(null)}>
      <p>{request.message}</p>
      <div className="modal-actions">
        <button className="button ghost" onClick={() => setRequest(null)}>{request.cancelLabel ?? "Cancel"}</button>
        <button className={`button ${request.tone === "destructive" ? "danger" : "primary"}`} onClick={() => { void request.onConfirm(); setRequest(null); }}>{request.confirmLabel}</button>
      </div>
    </Modal>}
  </ConfirmationContext.Provider>;
}

export function useConfirmation() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error("ConfirmationProvider is missing.");
  return confirm;
}
