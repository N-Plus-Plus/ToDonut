import { CSSProperties, ReactNode } from "react";
import { Circle, CircleCheck } from "lucide-react";

export function CircleCheckbox({
  checked,
  onChange,
  children,
  ariaLabel,
  checkedColor,
  disabled = false,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
  ariaLabel?: string;
  checkedColor?: string;
  disabled?: boolean;
  className?: string;
}) {
  return <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`checkbox-row circle-checkbox ${checked ? "is-checked" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
      onClick={() => onChange(!checked)}
    >
    <span className="circle-checkbox__icon" aria-hidden="true" style={checked ? { color: checkedColor ?? "var(--palette-mint-light)" } as CSSProperties : undefined}>
      {checked ? <CircleCheck /> : <Circle />}
    </span>
    {children !== undefined && <span className="circle-checkbox__label">{children}</span>}
  </button>;
}
