import { ReactNode } from "react";
import { ListTodo } from "lucide-react";

export function TaskProgressMeta({ children }: { children: ReactNode }) {
  return <span className="inline-icon-text task-progress-meta">
    <ListTodo aria-hidden="true" />
    <span className="task-progress-meta__text">{children}</span>
  </span>;
}
