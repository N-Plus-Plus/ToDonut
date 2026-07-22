import { AppData, Area, Project, QuantifierSelections, ReferenceList, Task, applyMutuallyExclusiveTags, closeSatisfiedAggregates, createActivity, createMeta, defaultStatusId, normaliseQuantifierSelections, nowIso, statusCategory } from "../../domain";

export interface ProjectProgress {
  total: number;
  open: number;
  completed: number;
  cancelled: number;
  percentClosed: number;
}

export interface ProjectDraft {
  title: string;
  description: string;
  areaId: string | null;
  statusId?: string;
  color: string;
  icon: string;
  tagIds: string[];
  quantifierSelections?: QuantifierSelections;
}

export interface AreaDraft {
  title: string;
  description: string;
  color: string;
  icon: string;
}

export interface AreaDeletionReceipt {
  areaId: string;
  area: Area;
  projects: Array<{ id: string; areaId: string | null }>;
  tasks: Array<{ id: string; location: Task["location"] }>;
  lists: Array<{ id: string; location: ReferenceList["location"]; areaId: string | null; projectId: string | null }>;
  deletedAt: string;
}

export function activeOrderedAreas(data: AppData): Area[] {
  return data.areas.filter((area) => !area.deletedAt && !area.archivedAt).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function deletedAreas(data: AppData): Area[] {
  return data.areas.filter((area) => area.deletedAt).sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "") || a.title.localeCompare(b.title));
}

export function archivedAreas(data: AppData): Area[] {
  return data.areas.filter((area) => !area.deletedAt && area.archivedAt).sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? "") || a.title.localeCompare(b.title));
}

export function activeOrderedProjects(data: AppData): Project[] {
  return data.projects.filter((project) => !project.deletedAt && !project.archivedAt && statusCategory(data, project.statusId) === "active").sort(sortProjects);
}

export function completedProjects(data: AppData): Project[] {
  return data.projects.filter((project) => !project.deletedAt && !project.archivedAt && statusCategory(data, project.statusId) !== "active").sort(sortProjects);
}

export function projectsByArea(data: AppData, areaId: string, includeCompleted = false): Project[] {
  return data.projects.filter((project) => project.areaId === areaId && !project.deletedAt && !project.archivedAt && (includeCompleted || statusCategory(data, project.statusId) === "active")).sort(sortProjects);
}

export function standaloneTasksByArea(data: AppData, areaId: string): Task[] {
  return data.tasks.filter((task) => !task.deletedAt && task.location.type === "area" && task.location.areaId === areaId && !task.parentTaskId).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function directListsByArea(data: AppData, areaId: string): ReferenceList[] {
  return data.referenceLists.filter((list) => !list.deletedAt && !list.archivedAt && list.location.type === "area" && list.location.areaId === areaId).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function tasksByProject(data: AppData, projectId: string): Task[] {
  return data.tasks.filter((task) => !task.deletedAt && task.location.type === "project" && task.location.projectId === projectId).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function rootTasksByProject(data: AppData, projectId: string): Task[] {
  return tasksByProject(data, projectId).filter((task) => !task.parentTaskId);
}

export function listsByProject(data: AppData, projectId: string): ReferenceList[] {
  return data.referenceLists.filter((list) => !list.deletedAt && !list.archivedAt && (list.projectId === projectId || (list.location.type === "project" && list.location.projectId === projectId))).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function projectProgress(data: AppData, projectId: string): ProjectProgress {
  const actionable = tasksByProject(data, projectId).filter((task) => !task.aggregate);
  const completed = actionable.filter((task) => statusCategory(data, task.statusId) === "completed").length;
  const cancelled = actionable.filter((task) => statusCategory(data, task.statusId) === "cancelled").length;
  const total = actionable.length;
  const open = total - completed - cancelled;
  return { total, open, completed, cancelled, percentClosed: total ? Math.round(((completed + cancelled) / total) * 100) : 0 };
}

export function createProjectCommand(data: AppData, draft: ProjectDraft): AppData {
  const clean = normaliseProjectDraft(data, draft);
  const category = statusCategory(data, clean.statusId);
  const closedAt = category === "active" ? null : nowIso();
  const project: Project = { ...createMeta("project"), kind: "project", ...clean, quantifierSelections: clean.quantifierSelections ?? {}, order: data.projects.filter((candidate) => !candidate.deletedAt).length + 1, completedAt: category === "completed" ? closedAt : null, cancelledAt: category === "cancelled" ? closedAt : null, archivedAt: null, taskPresentation: "compact" };
  return { ...data, projects: [...data.projects, project], activity: [...data.activity, createActivity("project", project.id, "created", `Project created: ${project.title}`)] };
}

export function updateProjectCommand(data: AppData, projectId: string, draft: ProjectDraft): AppData {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt);
  if (!project) throw new Error("Project not found.");
  if (project.archivedAt || statusCategory(data, project.statusId) !== "active") throw new Error("Reopen or unarchive the Project before editing.");
  const clean = normaliseProjectDraft(data, { ...draft, quantifierSelections: draft.quantifierSelections ?? project.quantifierSelections });
  const at = nowIso();
  const category = statusCategory(data, clean.statusId);
  const updated: Project = { ...project, ...clean, completedAt: category === "completed" ? project.completedAt ?? at : null, cancelledAt: category === "cancelled" ? project.cancelledAt ?? at : null, updatedAt: at, version: project.version + 1 };
  const events = [
    project.title !== updated.title ? createActivity("project", project.id, "titleChanged", "Project title changed", project.title, updated.title) : null,
    project.description !== updated.description ? createActivity("project", project.id, "descriptionChanged", "Project description changed", project.description, updated.description) : null,
    project.areaId !== updated.areaId ? createActivity("project", project.id, "moved", "Project Area changed", project.areaId, updated.areaId) : null,
    project.statusId !== updated.statusId ? createActivity("project", project.id, "statusChanged", "Project Status changed", project.statusId, updated.statusId) : null,
    project.color !== updated.color ? createActivity("project", project.id, "colorChanged", "Project colour changed", project.color, updated.color) : null,
    project.icon !== updated.icon ? createActivity("project", project.id, "iconChanged", "Project icon changed", project.icon, updated.icon) : null,
    JSON.stringify(project.tagIds) !== JSON.stringify(updated.tagIds) ? createActivity("project", project.id, "tagsChanged", "Project Tags changed", project.tagIds, updated.tagIds) : null,
    JSON.stringify(project.quantifierSelections) !== JSON.stringify(updated.quantifierSelections) ? createActivity("project", project.id, "quantifiersChanged", "Project quantifiers changed", project.quantifierSelections, updated.quantifierSelections) : null,
  ].filter(Boolean) as AppData["activity"];
  return { ...data, projects: data.projects.map((candidate) => candidate.id === projectId ? updated : candidate), activity: [...data.activity, ...events] };
}

export function completeProjectCommand(data: AppData, projectId: string): { data: AppData; changedTaskIds: string[] } {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt && !candidate.archivedAt);
  if (!project) throw new Error("Project not found.");
  const completedStatusId = data.statuses.find((status) => status.category === "completed" && !status.deletedAt)?.id;
  const cancelledStatusId = data.statuses.find((status) => status.category === "cancelled" && !status.deletedAt)?.id;
  if (!completedStatusId || !cancelledStatusId) throw new Error("Completed and Cancelled Statuses are required.");
  const at = nowIso();
  const openActionable = tasksByProject(data, projectId).filter((task) => !task.aggregate && statusCategory(data, task.statusId) === "active");
  let next: AppData = {
    ...data,
    tasks: data.tasks.map((task) => openActionable.some((candidate) => candidate.id === task.id) ? { ...task, statusId: completedStatusId, completedAt: at, cancelledAt: null, updatedAt: at, version: task.version + 1 } : task),
    activity: [
      ...data.activity,
      ...openActionable.map((task) => createActivity("task", task.id, "completed", `Completed by Project cascade: ${project.title}`, task.statusId, completedStatusId)),
    ],
  };
  next = closeSatisfiedAggregates(next, completedStatusId, cancelledStatusId);
  const current = next.projects.find((candidate) => candidate.id === projectId) ?? project;
  const updated = { ...current, statusId: completedStatusId, completedAt: at, cancelledAt: null, updatedAt: at, version: current.version + 1 };
  return {
    changedTaskIds: openActionable.map((task) => task.id),
    data: {
      ...next,
      projects: next.projects.map((candidate) => candidate.id === projectId ? updated : candidate),
      activity: [...next.activity, createActivity("project", projectId, "completed", `Project completed: ${project.title}`, null, { cascadeTaskCount: openActionable.length })],
    },
  };
}

export function reopenProjectCommand(data: AppData, projectId: string): AppData {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt);
  if (!project) throw new Error("Project not found.");
  if (statusCategory(data, project.statusId) === "active") return data;
  const at = nowIso();
  const updated = { ...project, statusId: defaultStatusId(data), completedAt: null, cancelledAt: null, updatedAt: at, version: project.version + 1 };
  return { ...data, projects: data.projects.map((candidate) => candidate.id === projectId ? updated : candidate), activity: [...data.activity, createActivity("project", projectId, "restored", `Project reopened: ${project.title}`)] };
}

export function createAreaCommand(data: AppData, draft: AreaDraft): AppData {
  const clean = normaliseAreaDraft(data, draft);
  const area: Area = { ...createMeta("area"), kind: "area", ...clean, order: activeOrderedAreas(data).length + 1, archivedAt: null };
  return { ...data, areas: [...data.areas, area], activity: [...data.activity, createActivity("area", area.id, "created", `Area created: ${area.title}`)] };
}

export function updateAreaCommand(data: AppData, areaId: string, draft: AreaDraft): AppData {
  const area = data.areas.find((candidate) => candidate.id === areaId && !candidate.deletedAt);
  if (!area) throw new Error("Area not found.");
  if (area.archivedAt) throw new Error("Unarchive the Area before editing.");
  const clean = normaliseAreaDraft(data, draft, areaId);
  const at = nowIso();
  const updated = { ...area, ...clean, updatedAt: at, version: area.version + 1 };
  return {
    ...data,
    areas: data.areas.map((candidate) => candidate.id === areaId ? updated : candidate),
    activity: [...data.activity, createActivity("area", areaId, "titleChanged", "Area saved", area, updated)],
  };
}

export function reorderProjectCommand(data: AppData, projectId: string, direction: -1 | 1): AppData {
  return reorderRecords(data, "projects", projectId, direction, "project");
}

export function reorderAreaCommand(data: AppData, areaId: string, direction: -1 | 1): AppData {
  return reorderRecords(data, "areas", areaId, direction, "area");
}

export function archiveAreaCommand(data: AppData, areaId: string): AppData {
  const area = data.areas.find((candidate) => candidate.id === areaId && !candidate.deletedAt);
  if (!area) throw new Error("Area not found.");
  if (area.archivedAt) return data;
  const at = nowIso();
  const updated = { ...area, archivedAt: at, updatedAt: at, version: area.version + 1 };
  return {
    ...data,
    areas: data.areas.map((candidate) => candidate.id === areaId ? updated : candidate),
    activity: [...data.activity, createActivity("area", areaId, "archived", `Area archived: ${area.title}`, area, updated)],
  };
}

export function unarchiveAreaCommand(data: AppData, areaId: string): AppData {
  const area = data.areas.find((candidate) => candidate.id === areaId && !candidate.deletedAt);
  if (!area) throw new Error("Area not found.");
  if (!area.archivedAt) return data;
  const at = nowIso();
  const updated = { ...area, archivedAt: null, updatedAt: at, version: area.version + 1 };
  return {
    ...data,
    areas: data.areas.map((candidate) => candidate.id === areaId ? updated : candidate),
    activity: [...data.activity, createActivity("area", areaId, "unarchived", `Area unarchived: ${area.title}`, area, updated)],
  };
}

export function areaReferenceCounts(data: AppData, areaId: string) {
  return {
    projectCount: data.projects.filter((project) => project.areaId === areaId).length,
    taskCount: data.tasks.filter((task) => task.location.type === "area" && task.location.areaId === areaId).length,
    listCount: data.referenceLists.filter((list) => list.location.type === "area" && list.location.areaId === areaId).length,
  };
}

export function deleteAreaCommand(data: AppData, areaId: string): { data: AppData; receipt: AreaDeletionReceipt } {
  const area = data.areas.find((candidate) => candidate.id === areaId && !candidate.deletedAt);
  if (!area) throw new Error("Area not found.");
  const at = nowIso();
  const projects = data.projects.filter((project) => project.areaId === areaId);
  const tasks = data.tasks.filter((task) => task.location.type === "area" && task.location.areaId === areaId);
  const lists = data.referenceLists.filter((list) => list.location.type === "area" && list.location.areaId === areaId);
  const receipt: AreaDeletionReceipt = {
    areaId,
    area,
    projects: projects.map((project) => ({ id: project.id, areaId: project.areaId })),
    tasks: tasks.map((task) => ({ id: task.id, location: task.location })),
    lists: lists.map((list) => ({ id: list.id, location: list.location, areaId: list.areaId, projectId: list.projectId })),
    deletedAt: at,
  };
  return {
    receipt,
    data: {
      ...data,
      areas: data.areas.map((candidate) => candidate.id === areaId ? { ...candidate, archivedAt: null, deletedAt: at, updatedAt: at, version: candidate.version + 1 } : candidate),
      projects: data.projects.map((project) => project.areaId === areaId ? { ...project, areaId: null, updatedAt: at, version: project.version + 1 } : project),
      tasks: data.tasks.map((task) => task.location.type === "area" && task.location.areaId === areaId ? { ...task, location: { type: "inbox" }, updatedAt: at, version: task.version + 1 } : task),
      referenceLists: data.referenceLists.map((list) => list.location.type === "area" && list.location.areaId === areaId ? { ...list, location: { type: "loose" }, areaId: null, projectId: null, updatedAt: at, version: list.version + 1 } : list),
      activity: [...data.activity, createActivity("area", areaId, "softDeleted", `Area moved to Trash: ${area.title}`, null, areaReferenceCounts(data, areaId))],
    },
  };
}

export function undoAreaDeletionCommand(data: AppData, receipt: AreaDeletionReceipt): AppData {
  const at = nowIso();
  return {
    ...data,
    areas: data.areas.map((area) => area.id === receipt.areaId ? { ...receipt.area, deletedAt: null, updatedAt: at, version: area.version + 1 } : area),
    projects: data.projects.map((project) => {
      const previous = receipt.projects.find((candidate) => candidate.id === project.id);
      return previous ? { ...project, areaId: previous.areaId, updatedAt: at, version: project.version + 1 } : project;
    }),
    tasks: data.tasks.map((task) => {
      const previous = receipt.tasks.find((candidate) => candidate.id === task.id);
      return previous ? { ...task, location: previous.location, updatedAt: at, version: task.version + 1 } : task;
    }),
    referenceLists: data.referenceLists.map((list) => {
      const previous = receipt.lists.find((candidate) => candidate.id === list.id);
      return previous ? { ...list, location: previous.location, areaId: previous.areaId, projectId: previous.projectId, updatedAt: at, version: list.version + 1 } : list;
    }),
    activity: [...data.activity, createActivity("area", receipt.areaId, "undo", `Area deletion undone: ${receipt.area.title}`)],
  };
}

export function restoreAreaCommand(data: AppData, areaId: string): AppData {
  const area = data.areas.find((candidate) => candidate.id === areaId && candidate.deletedAt);
  if (!area) throw new Error("Deleted Area not found.");
  const at = nowIso();
  return { ...data, areas: data.areas.map((candidate) => candidate.id === areaId ? { ...candidate, deletedAt: null, updatedAt: at, version: candidate.version + 1 } : candidate), activity: [...data.activity, createActivity("area", areaId, "restored", `Area restored: ${area.title}`)] };
}

export interface EntityConversionResult { data: AppData; createdId: string }

export function promoteTaskToProjectCommand(data: AppData, taskId: string): EntityConversionResult {
  const task = data.tasks.find((candidate) => candidate.id === taskId && !candidate.deletedAt);
  if (!task) throw new Error("Task not found.");
  const status = data.statuses.find((candidate) => candidate.id === task.statusId && !candidate.deletedAt);
  if (!status) throw new Error("The Task needs an available Status before it can become a Project.");
  const sourceLocation = task.location;
  const areaId = sourceLocation.type === "area"
    ? sourceLocation.areaId
    : sourceLocation.type === "project"
      ? data.projects.find((project) => project.id === sourceLocation.projectId && !project.deletedAt)?.areaId ?? null
      : null;
  const checklist = task.checklist.length
    ? `Checklist preserved from Task:\n${task.checklist.map((item) => `- ${item.checked ? "[x]" : "[ ]"} ${item.text}`).join("\n")}`
    : "";
  const description = [task.description.trim(), checklist].filter(Boolean).join("\n\n");
  const at = nowIso();
  const meta = createMeta("project");
  const project: Project = {
    ...meta,
    kind: "project",
    title: task.title,
    description,
    color: status.color,
    icon: "folder",
    areaId,
    statusId: status.id,
    order: data.projects.filter((candidate) => !candidate.deletedAt).length + 1,
    completedAt: status.category === "completed" ? task.completedAt ?? at : null,
    cancelledAt: status.category === "cancelled" ? task.cancelledAt ?? at : null,
    archivedAt: null,
    taskPresentation: "compact",
    tagIds: task.tagIds.filter((tagId) => data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("project"))),
    quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, task.quantifierSelections),
  };
  const directChildIds = new Set(data.tasks.filter((candidate) => candidate.parentTaskId === task.id).map((candidate) => candidate.id));
  const subtreeIds = new Set([task.id, ...collectTaskDescendants(data, task.id).map((candidate) => candidate.id)]);
  const tasks = data.tasks
    .filter((candidate) => candidate.id !== task.id)
    .map((candidate) => {
      if (candidate.id === task.parentTaskId) return { ...candidate, childTaskIds: candidate.childTaskIds.filter((id) => id !== task.id), updatedAt: at, version: candidate.version + 1 };
      if (!subtreeIds.has(candidate.id)) return candidate;
      return { ...candidate, location: { type: "project", projectId: project.id } as const, parentTaskId: directChildIds.has(candidate.id) ? null : candidate.parentTaskId, updatedAt: at, version: candidate.version + 1 };
    });
  return {
    createdId: project.id,
    data: {
      ...data,
      projects: [...data.projects, project],
      tasks,
      recurrenceGenerations: data.recurrenceGenerations.filter((generation) => generation.taskId !== task.id),
      activity: [...data.activity.filter((event) => !(event.entityKind === "task" && event.entityId === task.id)), createActivity("project", project.id, "created", `Promoted from Task: ${task.title}`, { taskId: task.id }, { projectId: project.id })],
    },
  };
}

export function demoteProjectToTaskCommand(data: AppData, projectId: string): EntityConversionResult {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt);
  if (!project) throw new Error("Project not found.");
  const status = data.statuses.find((candidate) => candidate.id === project.statusId && !candidate.deletedAt);
  if (!status) throw new Error("The Project needs an available Status before it can become a Task.");
  const priorityId = data.settings.defaultPriorityId && data.priorities.some((priority) => priority.id === data.settings.defaultPriorityId && !priority.deletedAt)
    ? data.settings.defaultPriorityId
    : data.priorities.find((priority) => !priority.deletedAt)?.id;
  if (!priorityId) throw new Error("An available Priority is required before a Project can become a Task.");
  const location: Task["location"] = project.areaId ? { type: "area", areaId: project.areaId } : { type: "inbox" };
  const rootChildren = data.tasks.filter((task) => !task.deletedAt && task.location.type === "project" && task.location.projectId === project.id && !task.parentTaskId);
  const projectTaskIds = new Set(data.tasks.filter((task) => task.location.type === "project" && task.location.projectId === project.id).map((task) => task.id));
  const meta = createMeta("task");
  const task: Task = {
    ...meta,
    kind: "task",
    title: project.title,
    description: project.description,
    statusId: status.id,
    priorityId,
    scheduledDate: null,
    revealDate: null,
    location,
    parentTaskId: null,
    childTaskIds: rootChildren.map((child) => child.id),
    order: data.tasks.filter((candidate) => !candidate.deletedAt && !candidate.parentTaskId).length + 1,
    tagIds: project.tagIds.filter((tagId) => data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("task"))),
    quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, project.quantifierSelections),
    mustDoToday: false,
    aggregate: rootChildren.length > 0,
    completedAt: status.category === "completed" ? project.completedAt ?? nowIso() : null,
    cancelledAt: status.category === "cancelled" ? project.cancelledAt ?? nowIso() : null,
    checklist: [],
    recurrence: null,
  };
  const at = nowIso();
  return {
    createdId: task.id,
    data: {
      ...data,
      projects: data.projects.filter((candidate) => candidate.id !== project.id),
      tasks: [...data.tasks.map((candidate) => projectTaskIds.has(candidate.id) ? { ...candidate, location, parentTaskId: rootChildren.some((root) => root.id === candidate.id) ? task.id : candidate.parentTaskId, updatedAt: at, version: candidate.version + 1 } : candidate), task],
      referenceLists: data.referenceLists.map((list) => list.projectId === project.id || (list.location.type === "project" && list.location.projectId === project.id) ? { ...list, location: project.areaId ? { type: "area", areaId: project.areaId } as const : { type: "loose" } as const, areaId: project.areaId, projectId: null, updatedAt: at, version: list.version + 1 } : list),
      recurrenceRules: data.recurrenceRules.map((rule) => rule.template.location.type === "project" && rule.template.location.projectId === project.id ? { ...rule, template: { ...rule.template, location }, updatedAt: at, version: rule.version + 1 } : rule),
      activity: [...data.activity.filter((event) => !(event.entityKind === "project" && event.entityId === project.id)), createActivity("task", task.id, "created", `Demoted from Project: ${project.title}`, { projectId: project.id }, { taskId: task.id, childTaskIds: task.childTaskIds })],
    },
  };
}

function collectTaskDescendants(data: AppData, taskId: string): Task[] {
  const direct = data.tasks.filter((task) => task.parentTaskId === taskId);
  return direct.flatMap((task) => [task, ...collectTaskDescendants(data, task.id)]);
}

function sortProjects(a: Project, b: Project): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

function normaliseProjectDraft(data: AppData, draft: ProjectDraft): ProjectDraft & { statusId: string } {
  const title = draft.title.trim();
  if (!title) throw new Error("Project title is required.");
  if (draft.areaId && !data.areas.some((area) => area.id === draft.areaId && !area.deletedAt)) throw new Error("Choose an active Area.");
  const statusId = draft.statusId ?? defaultStatusId(data);
  if (!data.statuses.some((status) => status.id === statusId && !status.deletedAt)) throw new Error("Choose an active Status.");
  const validTags = draft.tagIds.filter((tagId) => data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("project")));
  return { title, description: draft.description.trim(), areaId: draft.areaId || null, statusId, color: draft.color, icon: draft.icon || "folder", tagIds: validTags.reduce((ids, id) => applyMutuallyExclusiveTags(data, ids, id, "project"), [] as string[]), quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, draft.quantifierSelections) };
}

function normaliseAreaDraft(data: AppData, draft: AreaDraft, editingAreaId?: string): AreaDraft {
  const title = draft.title.trim();
  if (!title) throw new Error("Area title is required.");
  if (data.areas.some((area) => area.id !== editingAreaId && !area.deletedAt && area.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase())) throw new Error("An active Area already uses that title.");
  return { title, description: draft.description.trim(), color: draft.color, icon: draft.icon || "folder" };
}

function reorderRecords<T extends Project | Area>(data: AppData, collection: "projects" | "areas", id: string, direction: -1 | 1, kind: "project" | "area"): AppData {
  const records = (data[collection] as T[]).filter((record) => !record.deletedAt).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const index = records.findIndex((record) => record.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= records.length) return data;
  const a = records[index];
  const b = records[target];
  const at = nowIso();
  const nextRecords = (data[collection] as T[]).map((record) => record.id === a.id ? { ...record, order: b.order, updatedAt: at, version: record.version + 1 } : record.id === b.id ? { ...record, order: a.order, updatedAt: at, version: record.version + 1 } : record);
  return { ...data, [collection]: nextRecords, activity: [...data.activity, createActivity(kind, id, "orderChanged", `${kind === "project" ? "Project" : "Area"} order changed`)] };
}
