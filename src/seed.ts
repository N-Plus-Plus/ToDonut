import { AppData, Area, Priority, Project, ReferenceList, Status, Tag, TagGroup, Task, createActivity, createDefaultQuantifierDefinitions, createInitialBakeryState, createMeta } from "./domain";
import { elementPalette } from "./theme";

export const STATUS_IDS = { open: "status_open", inProgress: "status_in_progress", waiting: "status_waiting", blocked: "status_blocked", completed: "status_completed", cancelled: "status_cancelled" } as const;
export const PRIORITY_IDS = { lowest: "priority_lowest", low: "priority_low", normal: "priority_normal", high: "priority_high", highest: "priority_highest" } as const;

function seededMeta(id: string) { const at = "2026-06-30T00:00:00.000Z"; return { id, createdAt: at, updatedAt: at, version: 1, deletedAt: null }; }

export function createSeedData(): AppData {
  const statuses: Status[] = [
    { ...seededMeta(STATUS_IDS.open), kind: "status", name: "Open", color: elementPalette.aqua.light, icon: "circle-dot", category: "active", order: 1 },
    { ...seededMeta(STATUS_IDS.inProgress), kind: "status", name: "In progress", color: elementPalette.blueJeans.light, icon: "circle-play", category: "active", order: 2 },
    { ...seededMeta(STATUS_IDS.waiting), kind: "status", name: "Waiting", color: elementPalette.sunflower.dark, icon: "circle-pause", category: "active", order: 3 },
    { ...seededMeta(STATUS_IDS.blocked), kind: "status", name: "Blocked", color: elementPalette.grapefruit.dark, icon: "circle-alert", category: "active", order: 4 },
    { ...seededMeta(STATUS_IDS.completed), kind: "status", name: "Completed", color: elementPalette.grass.dark, icon: "circle-star", category: "completed", order: 5 },
    { ...seededMeta(STATUS_IDS.cancelled), kind: "status", name: "Cancelled", color: elementPalette.mediumGray.dark, icon: "circle-x", category: "cancelled", order: 6 },
  ];
  const priorities: Priority[] = [
    { ...seededMeta(PRIORITY_IDS.lowest), kind: "priority", name: "Drift", color: elementPalette.mediumGray.dark, icon: "chevrons-down", rank: 1 },
    { ...seededMeta(PRIORITY_IDS.low), kind: "priority", name: "Low", color: elementPalette.mint.dark, icon: "chevron-down", rank: 2 },
    { ...seededMeta(PRIORITY_IDS.normal), kind: "priority", name: "Normal", color: elementPalette.aqua.dark, icon: "minus", rank: 3 },
    { ...seededMeta(PRIORITY_IDS.high), kind: "priority", name: "High", color: elementPalette.sunflower.dark, icon: "chevron-up", rank: 4 },
    { ...seededMeta(PRIORITY_IDS.highest), kind: "priority", name: "Critical", color: elementPalette.grapefruit.light, icon: "chevrons-up", rank: 5 },
  ];
  const tagGroup: TagGroup = { ...createMeta("group"), kind: "tagGroup", name: "Energy", description: "Mutually exclusive energy context.", color: elementPalette.lavander.light, mutuallyExclusive: true, inherited: { energyContext: true }, order: 1 };
  const tags: Tag[] = ["Low energy", "Focused"].map((name, index) => ({ ...createMeta("tag"), kind: "tag", name, description: "", color: index === 0 ? elementPalette.mint.dark : elementPalette.pinkRose.dark, allowedScopes: ["task", "project", "referenceList"], tagGroupId: tagGroup.id, order: index + 1 }));
  const area: Area = { ...createMeta("area"), kind: "area", title: "Personal Systems", description: "", color: elementPalette.aqua.dark, icon: "folder", order: 1, archivedAt: null };
  const project: Project = { ...createMeta("project"), kind: "project", title: "Shape ToDonut", description: "Foundation project for the app itself.", color: elementPalette.bittersweet.light, icon: "folder", areaId: area.id, statusId: STATUS_IDS.open, order: 1, completedAt: null, cancelledAt: null, archivedAt: null, taskPresentation: "compact", tagIds: [], quantifierSelections: {} };
  const task: Task = { ...createMeta("task"), kind: "task", title: "Draft the next design pass", description: "Capture decisions that should become product behaviour.", statusId: STATUS_IDS.open, priorityId: PRIORITY_IDS.high, scheduledDate: new Date().toISOString().slice(0, 10), revealDate: null, location: { type: "project", projectId: project.id }, parentTaskId: null, childTaskIds: [], order: 1, tagIds: [], quantifierSelections: {}, mustDoToday: true, aggregate: false, completedAt: null, cancelledAt: null, checklist: [] };
  const referenceList: ReferenceList = { ...createMeta("ref"), kind: "referenceList", title: "Design notes", location: { type: "project", projectId: project.id }, areaId: null, projectId: project.id, order: 1, archivedAt: null, content: { type: "plainItems", items: [] }, tagIds: [], quantifierSelections: {}, color: elementPalette.aqua.light, icon: "lightbulb" };
  return { areas: [area], projects: [project], tasks: [task], referenceLists: [referenceList], referenceListEntries: [], statuses, priorities, tags, tagGroups: [tagGroup], quantifierDefinitions: createDefaultQuantifierDefinitions(), recurrenceRules: [], recurrenceGenerations: [], viewPreferences: [], activity: [createActivity("task", task.id, "created", "Seed task created")], settings: { upcomingDays: 14, timezone: "Australia/Sydney", backendProvider: "local-development", defaultPriorityId: PRIORITY_IDS.normal }, bakery: createInitialBakeryState() };
}
