import { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty"><p>{children}</p></div>;
}
