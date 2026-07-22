import dynamicIconImports from "lucide-react/dynamicIconImports";

export type LucideIconName = keyof typeof dynamicIconImports;

export function isLucideIconName(value: string): value is LucideIconName {
  return Object.prototype.hasOwnProperty.call(dynamicIconImports, value);
}

export function invalidLucideIconNames(values: string[]): string[] {
  return values.filter((value) => !isLucideIconName(value));
}

export { dynamicIconImports };
