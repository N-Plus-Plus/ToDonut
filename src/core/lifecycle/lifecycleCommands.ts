import { AppData, EntityKind, Project, ReferenceList, Task, createActivity, restoreEntity, softDeleteEntity } from "../../domain";

export function softDeleteCommand(data: AppData, entityKind: EntityKind, entityId: string): AppData {
  if (entityKind === "project") return deleteProjectCommand(data, entityId).data;
  if (entityKind === "referenceList") return deleteListCommand(data, entityId);
  return softDeleteEntity(data, entityKind, entityId);
}

export function restoreCommand(data: AppData, entityKind: EntityKind, entityId: string): AppData {
  return restoreEntity(data, entityKind, entityId);
}

export function purgeCommand(data: AppData, entityKind: EntityKind, entityId: string): AppData {
  if (entityKind === "task") return purgeTaskSubtree(data, entityId);
  if (entityKind === "referenceList") return purgeList(data, entityId);
  if (entityKind === "project") return purgeProject(data, entityId);
  if (entityKind === "area") return purgeArea(data, entityId);
  throw new Error("This record cannot be purged from Trash.");
}

export interface ProjectDeletionReceipt {
  projectId: string;
  project: Project;
  tasks: Array<{ id: string; location: Task["location"]; parentTaskId: string | null }>;
  lists: Array<{ id: string; location: ReferenceList["location"]; areaId: string | null; projectId: string | null }>;
  deletedAt: string;
}

export function archiveProjectCommand(data: AppData, projectId: string): AppData {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt);
  if (!project) throw new Error("Project not found.");
  if (project.archivedAt) return data;
  const at = new Date().toISOString();
  const updated = { ...project, archivedAt: at, updatedAt: at, version: project.version + 1 };
  return {
    ...data,
    projects: data.projects.map((candidate) => candidate.id === projectId ? updated : candidate),
    activity: [...data.activity, createActivity("project", projectId, "archived", `Project archived: ${project.title}`, project, updated)],
  };
}

export function unarchiveProjectCommand(data: AppData, projectId: string): AppData {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt);
  if (!project) throw new Error("Project not found.");
  if (!project.archivedAt) return data;
  const at = new Date().toISOString();
  const updated = { ...project, archivedAt: null, updatedAt: at, version: project.version + 1 };
  return {
    ...data,
    projects: data.projects.map((candidate) => candidate.id === projectId ? updated : candidate),
    activity: [...data.activity, createActivity("project", projectId, "unarchived", `Project unarchived: ${project.title}`, project, updated)],
  };
}

export function archiveListCommand(data: AppData, listId: string): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId && !candidate.deletedAt);
  if (!list) throw new Error("List not found.");
  if (list.archivedAt) return data;
  const at = new Date().toISOString();
  const updated = { ...list, archivedAt: at, updatedAt: at, version: list.version + 1 };
  return {
    ...data,
    referenceLists: data.referenceLists.map((candidate) => candidate.id === listId ? updated : candidate),
    activity: [...data.activity, createActivity("referenceList", listId, "archived", `List archived: ${list.title}`, list, updated)],
  };
}

export function unarchiveListCommand(data: AppData, listId: string): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId && !candidate.deletedAt);
  if (!list) throw new Error("List not found.");
  if (!list.archivedAt) return data;
  const at = new Date().toISOString();
  const validAreaId = list.areaId && data.areas.some((area) => area.id === list.areaId && !area.deletedAt) ? list.areaId : null;
  const validLocation: ReferenceList["location"] = list.location.type === "area" && !validAreaId ? { type: "loose" } : list.location;
  const updated = { ...list, archivedAt: null, location: validLocation, areaId: validAreaId, updatedAt: at, version: list.version + 1 };
  return {
    ...data,
    referenceLists: data.referenceLists.map((candidate) => candidate.id === listId ? updated : candidate),
    activity: [...data.activity, createActivity("referenceList", listId, "unarchived", `List unarchived: ${list.title}`, list, updated)],
  };
}

export function deleteListCommand(data: AppData, listId: string): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId && !candidate.deletedAt);
  if (!list) throw new Error("List not found.");
  const at = new Date().toISOString();
  const updated = { ...list, archivedAt: null, deletedAt: at, updatedAt: at, version: list.version + 1 };
  return {
    ...data,
    referenceLists: data.referenceLists.map((candidate) => candidate.id === listId ? updated : candidate),
    activity: [...data.activity, createActivity("referenceList", listId, "softDeleted", `List moved to Trash: ${list.title}`, { archivedAt: list.archivedAt }, { deletedAt: at })],
  };
}

export function projectRelationshipCounts(data: AppData, projectId: string): { taskCount: number; listCount: number } {
  return {
    taskCount: data.tasks.filter((task) => task.location.type === "project" && task.location.projectId === projectId).length,
    listCount: data.referenceLists.filter((list) => list.projectId === projectId || (list.location.type === "project" && list.location.projectId === projectId)).length,
  };
}

export function deleteProjectCommand(data: AppData, projectId: string): { data: AppData; receipt: ProjectDeletionReceipt } {
  const project = data.projects.find((candidate) => candidate.id === projectId && !candidate.deletedAt);
  if (!project) throw new Error("Project not found.");
  const at = new Date().toISOString();
  const validAreaId = project.areaId && data.areas.some((area) => area.id === project.areaId && !area.deletedAt) ? project.areaId : null;
  const taskFallback: Task["location"] = validAreaId ? { type: "area", areaId: validAreaId } : { type: "inbox" };
  const listFallback: ReferenceList["location"] = validAreaId ? { type: "area", areaId: validAreaId } : { type: "loose" };
  const affectedTasks = data.tasks.filter((task) => task.location.type === "project" && task.location.projectId === projectId);
  const affectedLists = data.referenceLists.filter((list) => list.projectId === projectId || (list.location.type === "project" && list.location.projectId === projectId));
  const receipt: ProjectDeletionReceipt = {
    projectId,
    project,
    tasks: affectedTasks.map((task) => ({ id: task.id, location: task.location, parentTaskId: task.parentTaskId })),
    lists: affectedLists.map((list) => ({ id: list.id, location: list.location, areaId: list.areaId, projectId: list.projectId })),
    deletedAt: at,
  };
  const events = [
    createActivity("project", projectId, "softDeleted", `Project moved to Trash: ${project.title}`, null, { taskCount: affectedTasks.length, listCount: affectedLists.length }),
    ...affectedTasks.flatMap((task) => [
      createActivity("task", task.id, "detached", `Task detached from deleted Project: ${project.title}`, task.location, taskFallback),
      createActivity("task", task.id, "fallbackApplied", validAreaId ? "Task moved to Project Area" : "Task moved to Inbox"),
    ]),
    ...affectedLists.flatMap((list) => [
      createActivity("referenceList", list.id, "detached", `List detached from deleted Project: ${project.title}`, list.location, listFallback),
      createActivity("referenceList", list.id, "fallbackApplied", validAreaId ? "List moved to Project Area" : "List made loose"),
    ]),
  ];
  return {
    receipt,
    data: {
      ...data,
      projects: data.projects.map((candidate) => candidate.id === projectId ? { ...candidate, archivedAt: null, deletedAt: at, updatedAt: at, version: candidate.version + 1 } : candidate),
      tasks: data.tasks.map((task) => affectedTasks.some((affected) => affected.id === task.id) ? { ...task, location: taskFallback, updatedAt: at, version: task.version + 1 } : task),
      referenceLists: data.referenceLists.map((list) => affectedLists.some((affected) => affected.id === list.id) ? { ...list, location: listFallback, areaId: validAreaId, projectId: null, updatedAt: at, version: list.version + 1 } : list),
      activity: [...data.activity, ...events],
    },
  };
}

function purgeArea(data: AppData, areaId: string): AppData {
  const area = data.areas.find((candidate) => candidate.id === areaId && candidate.deletedAt);
  if (!area) throw new Error("Deleted Area not found.");
  return {
    ...data,
    areas: data.areas.filter((candidate) => candidate.id !== areaId),
    activity: data.activity.filter((event) => !(event.entityKind === "area" && event.entityId === areaId)),
  };
}

function purgeProject(data: AppData, projectId: string): AppData {
  const project = data.projects.find((candidate) => candidate.id === projectId && candidate.deletedAt);
  if (!project) throw new Error("Deleted Project not found.");
  return {
    ...data,
    projects: data.projects.filter((candidate) => candidate.id !== projectId),
    activity: data.activity.filter((event) => !(event.entityKind === "project" && event.entityId === projectId)),
  };
}

function purgeList(data: AppData, listId: string): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId && candidate.deletedAt);
  if (!list) throw new Error("Deleted List not found.");
  const entryIds = new Set(data.referenceListEntries.filter((entry) => entry.referenceListId === listId).map((entry) => entry.id));
  return {
    ...data,
    referenceLists: data.referenceLists.filter((candidate) => candidate.id !== listId),
    referenceListEntries: data.referenceListEntries.filter((entry) => entry.referenceListId !== listId),
    activity: data.activity.filter((event) => {
      if (event.entityKind === "referenceList" && event.entityId === listId) return false;
      if (event.entityKind === "referenceListEntry" && entryIds.has(event.entityId)) return false;
      return true;
    }),
  };
}

function purgeTaskSubtree(data: AppData, taskId: string): AppData {
  const root = data.tasks.find((task) => task.id === taskId && task.deletedAt);
  if (!root) throw new Error("Deleted Task not found.");
  const collect = (id: string): Task[] => data.tasks.filter((task) => task.parentTaskId === id).flatMap((task) => [task, ...collect(task.id)]);
  const ids = new Set([root, ...collect(taskId)].map((task) => task.id));
  return {
    ...data,
    tasks: data.tasks
      .filter((task) => !ids.has(task.id))
      .map((task) => {
        const childTaskIds = task.childTaskIds.filter((id) => !ids.has(id));
        return childTaskIds.length === task.childTaskIds.length ? task : { ...task, childTaskIds };
      }),
    recurrenceGenerations: data.recurrenceGenerations.filter((generation) => !ids.has(generation.taskId)),
    activity: data.activity.filter((event) => !(event.entityKind === "task" && ids.has(event.entityId))),
  };
}

export function undoProjectDeletionCommand(data: AppData, receipt: ProjectDeletionReceipt): AppData {
  const at = new Date().toISOString();
  const movedTask = receipt.tasks.find((previous) => {
    const current = data.tasks.find((task) => task.id === previous.id);
    return current && current.location.type === "project" && current.location.projectId !== receipt.projectId;
  });
  const movedList = receipt.lists.find((previous) => {
    const current = data.referenceLists.find((list) => list.id === previous.id);
    return current && current.projectId && current.projectId !== receipt.projectId;
  });
  if (movedTask || movedList) throw new Error("Undo could not restore every relationship because a newer move exists.");
  return {
    ...data,
    projects: data.projects.map((project) => project.id === receipt.projectId ? { ...receipt.project, deletedAt: null, updatedAt: at, version: project.version + 1 } : project),
    tasks: data.tasks.map((task) => {
      const previous = receipt.tasks.find((candidate) => candidate.id === task.id);
      return previous ? { ...task, location: previous.location, parentTaskId: previous.parentTaskId, updatedAt: at, version: task.version + 1 } : task;
    }),
    referenceLists: data.referenceLists.map((list) => {
      const previous = receipt.lists.find((candidate) => candidate.id === list.id);
      return previous ? { ...list, location: previous.location, areaId: previous.areaId, projectId: previous.projectId, updatedAt: at, version: list.version + 1 } : list;
    }),
    activity: [...data.activity, createActivity("project", receipt.projectId, "undo", `Project deletion undone: ${receipt.project.title}`)],
  };
}
