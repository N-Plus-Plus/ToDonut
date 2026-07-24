import { Component, Zap, type LucideIcon } from "lucide-react";
import { CSSProperties, Suspense, lazy } from "react";

const eagerIcons: Record<string, LucideIcon> = { component: Component, zap: Zap };
const DynamicLucideIcon = lazy(() => import("./DynamicLucideIcon"));

export function LucideIconSequence({ iconNames, label, style }: { iconNames: string[]; label?: string; style?: CSSProperties }) {
  return <span className="lucide-icon-sequence" aria-label={label} aria-hidden={label ? undefined : "true"} style={style}>
    {iconNames.map((iconName, index) => {
      const Icon = eagerIcons[iconName];
      return Icon
        ? <Icon key={`${iconName}:${index}`} aria-hidden="true" />
        : <Suspense key={`${iconName}:${index}`} fallback={<span className="lucide-icon-sequence__placeholder" aria-hidden="true" />}><DynamicLucideIcon iconName={iconName} /></Suspense>;
    })}
  </span>;
}
