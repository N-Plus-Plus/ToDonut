import { LazyExoticComponent, Suspense, lazy } from "react";
import { type LucideIcon } from "lucide-react";
import { dynamicIconImports, isLucideIconName } from "../../core/icons/lucideIconRegistry";

const lazyIcons = new Map<string, LazyExoticComponent<LucideIcon>>();

export default function DynamicLucideIcon({ iconName }: { iconName: string }) {
  if (!isLucideIconName(iconName)) return null;
  let Icon = lazyIcons.get(iconName);
  if (!Icon) {
    Icon = lazy(dynamicIconImports[iconName]);
    lazyIcons.set(iconName, Icon);
  }
  return <Suspense fallback={<span className="lucide-icon-sequence__placeholder" aria-hidden="true" />}><Icon aria-hidden="true" /></Suspense>;
}
