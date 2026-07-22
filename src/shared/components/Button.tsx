import { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ variant = "secondary", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; children: ReactNode }) {
  return <button {...props} className={`button ${variant === "secondary" ? "" : variant} ${className}`.trim()}>{children}</button>;
}
