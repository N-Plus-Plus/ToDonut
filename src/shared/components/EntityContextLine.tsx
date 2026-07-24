import { CSSProperties, ReactNode } from "react";
import { Component, FolderKanban, LandPlot, Zap } from "lucide-react";
import { AppData, QuantifierSelections, ReferenceListLocation, TaskLocation, orderedQuantifierDefinitions } from "../../domain";
import { LucideIconSequence } from "./LucideIconSequence";

export interface EntityContextItem {
  kind: "area" | "project" | string;
  prefix: string;
  title: string;
  color?: string | null;
  icon?: "zap" | "component";
  iconNames?: string[];
}

const contextRank: Record<string, number> = { area: 10, project: 20 };

export function EntityContextLine({ items, fallback = null }: { items: EntityContextItem[]; fallback?: ReactNode }) {
  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => (contextRank[left.item.kind] ?? 100) - (contextRank[right.item.kind] ?? 100) || left.index - right.index)
    .map(({ item }) => item);
  if (!ordered.length) return <>{fallback}</>;
  return <span className="entity-context-line">{ordered.map((item, index) => {
    const hasCustomIcons = Boolean(item.iconNames?.length);
    const Icon = item.kind === "area" ? LandPlot : item.kind === "project" ? FolderKanban : !hasCustomIcons && item.icon === "zap" ? Zap : !hasCustomIcons && item.icon === "component" ? Component : null;
    const accessibleLabel = item.kind === "area" ? `Area: ${item.title}` : item.kind === "project" ? `Project: ${item.title}` : item.icon ? `${item.prefix}: ${item.title}` : undefined;
    return <span key={`${item.kind}:${item.prefix}:${item.title}`}>
      {index > 0 && <span>, </span>}
      <span className={`entity-context-line__item ${Icon || hasCustomIcons ? "inline-icon-text" : ""} ${item.icon ? "entity-context-line__item--quantifier" : ""}`} aria-label={accessibleLabel} style={item.icon && item.color ? { color: item.color } : undefined}>
        {hasCustomIcons && <LucideIconSequence iconNames={item.iconNames!} style={item.color ? { color: item.color } : undefined} />}
        {Icon && <Icon aria-hidden="true" />}
        {!Icon && !hasCustomIcons && item.prefix ? `${item.prefix}: ` : ""}
        {!hasCustomIcons && <span className="entity-context-line__title" style={!item.icon && item.color ? { color: item.color } as CSSProperties : undefined}>{item.title}</span>}
      </span>
    </span>;
  })}</span>;
}

export function quantifierContextsForSelections(data: AppData, selections?: QuantifierSelections): EntityContextItem[] {
  if (!selections) return [];
  return orderedQuantifierDefinitions(data).flatMap((definition) => {
    const option = definition.options.find((candidate) => candidate.id === selections[definition.id]);
    return option ? [{ kind: `quantifier:${definition.id}`, prefix: definition.name, title: option.name, color: option.color, icon: definition.icon, iconNames: option.iconNames }] : [];
  });
}

export function quantifierMetadataContextsForSelections(data: AppData, selections?: QuantifierSelections): EntityContextItem[] {
  return quantifierContextsForSelections(data, selections).filter((item) => !item.iconNames?.length);
}

export function QuantifierTitleIcons({ data, selections }: { data: AppData; selections?: QuantifierSelections }) {
  const items = quantifierContextsForSelections(data, selections).filter((item) => item.iconNames?.length);
  if (!items.length) return null;
  return <span className="entity-title-quantifiers">{items.map((item) => (
    <span
      key={`${item.kind}:${item.title}`}
      className="entity-title-quantifier"
      aria-label={`${item.prefix}: ${item.title}`}
    >
      <LucideIconSequence iconNames={item.iconNames!} style={item.color ? { color: item.color } : undefined} />
    </span>
  ))}</span>;
}

export function entityContextsForLocation(data: AppData, location: TaskLocation | ReferenceListLocation): EntityContextItem[] {
  if (location.type === "area") {
    const area = data.areas.find((candidate) => candidate.id === location.areaId);
    return [{ kind: "area", prefix: "Area", title: area?.title ?? "Unknown area", color: area?.color }];
  }
  if (location.type !== "project") return [];
  const project = data.projects.find((candidate) => candidate.id === location.projectId);
  const area = project?.areaId ? data.areas.find((candidate) => candidate.id === project.areaId) : null;
  return [
    ...(area ? [{ kind: "area", prefix: "Area", title: area.title, color: area.color }] : []),
    { kind: "project", prefix: "Project", title: project?.title ?? "Unknown project", color: project?.color },
  ];
}
