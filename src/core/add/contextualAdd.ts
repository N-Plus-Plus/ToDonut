import { CalendarPlus, ClipboardList, FolderKanban, LandPlot, ListPlus, ListTodo, LucideIcon, ShieldCheck, Tags } from "lucide-react";

export type AddActionId = "project" | "list" | "task" | "listItem" | "childTask" | "status" | "tagGroup" | "tag" | "area" | "schedule";
export type AddDestination = "today" | "upcoming" | "inbox" | "projects" | "areas" | "lists" | "all" | "overdue" | "someday" | "trash" | "recurrence" | "settings" | "diagnostics" | "bakery";
export type SettingsSubsection = "home" | "statuses" | "priorities" | "tags" | "tagGroups" | "quantifiers" | "recurrence" | "diagnostics";

export interface AddCapabilities {
  project: boolean;
  list: boolean;
  task: boolean;
  listItem: boolean;
  childTask: boolean;
  status: boolean;
  tag: boolean;
  tagGroup: boolean;
  area: boolean;
  schedule: boolean;
}

export interface AddContext {
  destination: AddDestination;
  openListId?: string | null;
  openAreaId?: string | null;
  openProjectId?: string | null;
  activeParentTaskId?: string | null;
  settingsSubsection?: SettingsSubsection;
  blockingOverlayOpen?: boolean;
  capabilities: AddCapabilities;
}

export interface AddActionDefinition {
  id: AddActionId;
  label: string;
  accessibleName: string;
  icon: LucideIcon;
  group: "persistent" | "contextual";
  order: number;
  capability: keyof AddCapabilities;
  isAvailable: (context: AddContext) => boolean;
}

export const defaultAddCapabilities: AddCapabilities = {
  project: true,
  list: true,
  task: true,
  listItem: true,
  childTask: false,
  status: true,
  tag: true,
  tagGroup: true,
  area: true,
  schedule: true,
};

export const addActionRegistry: AddActionDefinition[] = [
  { id: "project", label: "Project", accessibleName: "Create Project", icon: FolderKanban, group: "persistent", order: 10, capability: "project", isAvailable: () => true },
  { id: "list", label: "List", accessibleName: "Create List", icon: ClipboardList, group: "persistent", order: 20, capability: "list", isAvailable: () => true },
  { id: "task", label: "Task", accessibleName: "Create Task", icon: ListTodo, group: "persistent", order: 30, capability: "task", isAvailable: () => true },
  { id: "listItem", label: "List Item", accessibleName: "Create List Item", icon: ListPlus, group: "contextual", order: 110, capability: "listItem", isAvailable: (context) => Boolean(context.openListId) },
  { id: "status", label: "Status", accessibleName: "Create Status", icon: ShieldCheck, group: "contextual", order: 210, capability: "status", isAvailable: (context) => context.destination === "settings" && context.settingsSubsection === "statuses" },
  { id: "tag", label: "Tag", accessibleName: "Create Tag", icon: Tags, group: "contextual", order: 220, capability: "tag", isAvailable: (context) => context.destination === "settings" && context.settingsSubsection === "tags" },
  { id: "tagGroup", label: "Tag Group", accessibleName: "Create Tag Group", icon: Tags, group: "contextual", order: 220, capability: "tagGroup", isAvailable: (context) => context.destination === "settings" && context.settingsSubsection === "tagGroups" },
  { id: "schedule", label: "Schedule", accessibleName: "Create Schedule", icon: CalendarPlus, group: "contextual", order: 230, capability: "schedule", isAvailable: (context) => context.destination === "settings" && context.settingsSubsection === "recurrence" },
  { id: "area", label: "Area", accessibleName: "Create Area", icon: LandPlot, group: "contextual", order: 130, capability: "area", isAvailable: (context) => context.destination === "areas" && !context.openAreaId },
];

export function resolveAddActions(context: AddContext): AddActionDefinition[] {
  if (context.blockingOverlayOpen) return [];
  return addActionRegistry
    .filter((action) => context.capabilities[action.capability] && action.isAvailable(context))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
