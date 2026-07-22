import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ActivityEvent, AppData, EntityKind } from "../../domain";

export function ActivityHistory({ data, entityKind, entityId, showHeading = true }: { data: AppData; entityKind: EntityKind; entityId: string; showHeading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const events = data.activity.filter((event) => event.entityKind === entityKind && event.entityId === entityId).sort((a, b) => b.at.localeCompare(a.at));
  const content = events.length === 0 ? <p className="task-meta">No recorded changes.</p> : <ol className="history-list">{events.map((event) => <HistoryItem key={event.id} data={data} event={event} />)}</ol>;
  if (!showHeading) return <section className="history-panel">{content}</section>;
  return <section className="history-panel"><button type="button" className="details-toggle disclosure-heading" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />} HISTORY</button>{expanded && content}</section>;
}

function HistoryItem({ data, event }: { data: AppData; event: ActivityEvent }) {
  return <li><time dateTime={event.at}>{new Date(event.at).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" })}</time><strong>{event.summary}</strong>{(event.oldValue !== undefined || event.newValue !== undefined) && <dl><dt>Old</dt><dd>{formatValue(data, event.oldValue)}</dd><dt>New</dt><dd>{formatValue(data, event.newValue)}</dd></dl>}</li>;
}

function formatValue(data: AppData, value: unknown, keyHint?: string): string {
  if (value === undefined) return "Not recorded";
  if (value === null) return "None";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return resolveDisplayString(data, value, keyHint);
  if (Array.isArray(value)) {
    if (!value.length) return "None";
    return value.map((item) => formatValue(data, item, keyHint)).join(", ");
  }
  if (typeof value === "object") {
    const recordName = displayRecordObject(value);
    if (recordName) return recordName;
    const location = displayLocation(data, value);
    if (location) return location;
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !hiddenHistoryKeys.has(key))
      .map(([key, entry]) => `${historyLabel(key)}: ${formatValue(data, entry, key)}`)
      .join("; ") || "No displayable change";
  }
  return String(value);
}

const hiddenHistoryKeys = new Set(["id", "kind", "version", "createdAt", "updatedAt"]);

const historyLabels: Record<string, string> = {
  active: "Active",
  affectedTaskIds: "Tasks",
  aggregateCount: "Aggregate Tasks",
  allowedScopes: "Scopes",
  archivedAt: "Archived",
  areaId: "Area",
  cancelledAt: "Cancelled",
  category: "Category",
  checked: "Checked",
  checklist: "Checklist",
  collapsedCount: "Collapsed count",
  color: "Colour",
  completedAt: "Completed",
  completedIds: "Completed Tasks",
  deletedAt: "Deleted",
  description: "Description",
  destination: "Destination",
  dueOnOccurrence: "Due on occurrence",
  entryIds: "List Items",
  firstMissedDate: "First missed date",
  firstScheduledDate: "First scheduled date",
  frequency: "Frequency",
  groupId: "Tag Group",
  icon: "Icon",
  inactiveFields: "Inactive fields",
  interval: "Interval",
  itemCount: "Item count",
  itemIds: "Items",
  label: "Label",
  lastGeneratedDate: "Last generated date",
  lastMissedDate: "Last missed date",
  location: "Location",
  mutuallyExclusive: "Mutually exclusive",
  name: "Name",
  nextBoundaryDate: "Next occurrence",
  operation: "Operation",
  order: "Order",
  parentTaskId: "Parent Task",
  pausedAt: "Paused",
  priorityId: "Priority",
  projectId: "Project",
  referenceListId: "List",
  revealDate: "Reveal On",
  rule: "Rule",
  ruleId: "Schedule",
  scheduledDate: "Due Date",
  siblingIds: "Sibling order",
  since: "Since",
  statusId: "Status",
  tagGroupId: "Tag Group",
  tagIds: "Tags",
  taskCount: "Task count",
  taskId: "Task",
  taskIds: "Tasks",
  template: "Task template",
  text: "Text",
  title: "Title",
  triggeringChildId: "Triggering child Task",
  weekdays: "Weekdays",
};

function historyLabel(key: string): string {
  return historyLabels[key] ?? key.replace(/Id$/, "").replace(/Ids$/, "s").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (char) => char.toUpperCase());
}

function resolveDisplayString(data: AppData, value: string, keyHint?: string): string {
  if (!value) return "None";
  const hinted = resolveByHint(data, value, keyHint);
  if (hinted) return hinted;
  const direct = resolveRecordName(data, value);
  if (direct) return direct;
  if (looksLikeEntityId(value)) return "Unavailable record";
  return value;
}

function resolveByHint(data: AppData, value: string, keyHint?: string): string | null {
  if (!keyHint) return null;
  if (keyHint === "areaId") return data.areas.find((record) => record.id === value)?.title ?? "Unavailable Area";
  if (keyHint === "projectId") return data.projects.find((record) => record.id === value)?.title ?? "Unavailable Project";
  if (keyHint === "taskId" || keyHint === "parentTaskId" || keyHint === "triggeringChildId") return data.tasks.find((record) => record.id === value)?.title ?? "Unavailable Task";
  if (keyHint === "statusId") return data.statuses.find((record) => record.id === value)?.name ?? "Unavailable Status";
  if (keyHint === "priorityId") return data.priorities.find((record) => record.id === value)?.name ?? "Unavailable Priority";
  if (keyHint === "tagGroupId" || keyHint === "groupId") return data.tagGroups.find((record) => record.id === value)?.name ?? "Unavailable Tag Group";
  if (keyHint === "referenceListId") return data.referenceLists.find((record) => record.id === value)?.title ?? "Unavailable List";
  if (keyHint === "ruleId") return data.recurrenceRules.find((record) => record.id === value)?.label ?? "Unavailable Schedule";
  if (keyHint.endsWith("Ids")) return resolveRecordName(data, value);
  return null;
}

function resolveRecordName(data: AppData, id: string): string | null {
  return data.areas.find((record) => record.id === id)?.title
    ?? data.projects.find((record) => record.id === id)?.title
    ?? data.tasks.find((record) => record.id === id)?.title
    ?? data.referenceLists.find((record) => record.id === id)?.title
    ?? data.referenceListEntries.find((record) => record.id === id)?.text
    ?? data.statuses.find((record) => record.id === id)?.name
    ?? data.priorities.find((record) => record.id === id)?.name
    ?? data.tags.find((record) => record.id === id)?.name
    ?? data.tagGroups.find((record) => record.id === id)?.name
    ?? data.recurrenceRules.find((record) => record.id === id)?.label
    ?? null;
}

function looksLikeEntityId(value: string): boolean {
  return /^(area|project|task|ref|refentry|status|priority|tag|group|rule|recur|evt)_/.test(value);
}

function displayRecordObject(value: object): string | null {
  const candidate = value as { title?: unknown; name?: unknown; label?: unknown; text?: unknown };
  if (typeof candidate.title === "string") return candidate.title;
  if (typeof candidate.name === "string") return candidate.name;
  if (typeof candidate.label === "string") return candidate.label;
  if (typeof candidate.text === "string") return candidate.text;
  return null;
}

function displayLocation(data: AppData, value: object): string | null {
  const location = value as { type?: unknown; projectId?: unknown; areaId?: unknown };
  if (location.type === "inbox") return "Inbox";
  if (location.type === "someday") return "Someday";
  if (location.type === "loose") return "Loose";
  if (location.type === "project" && typeof location.projectId === "string") return `Project: ${resolveDisplayString(data, location.projectId, "projectId")}`;
  if (location.type === "area" && typeof location.areaId === "string") return `Area: ${resolveDisplayString(data, location.areaId, "areaId")}`;
  return null;
}
