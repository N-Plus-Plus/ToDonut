import { describe, expect, it } from "vitest";
import { createSeedData } from "../../seed";
import { archiveListCommand, archiveProjectCommand, deleteProjectCommand, projectRelationshipCounts, purgeCommand, restoreCommand, softDeleteCommand, unarchiveListCommand, unarchiveProjectCommand, undoProjectDeletionCommand } from "./lifecycleCommands";

describe("lifecycle commands", () => {
  it("soft deletes and restores with activity events", () => {
    const data = createSeedData();
    const task = data.tasks[0];
    const deleted = softDeleteCommand(data, "task", task.id);
    expect(deleted.tasks[0].deletedAt).toBeTruthy();
    expect(deleted.activity.at(-1)?.type).toBe("softDeleted");
    const restored = restoreCommand(deleted, "task", task.id);
    expect(restored.tasks[0].deletedAt).toBeNull();
    expect(restored.activity.at(-1)?.type).toBe("restored");
  });

  it("archives Projects and Lists without detaching relationships", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const list = data.referenceLists[0];
    const archivedProject = archiveProjectCommand(data, project.id);
    expect(archivedProject.projects[0].archivedAt).toBeTruthy();
    expect(archivedProject.tasks[0].location).toEqual({ type: "project", projectId: project.id });
    expect(archivedProject.referenceLists[0].projectId).toBe(project.id);
    const restoredProject = unarchiveProjectCommand(archivedProject, project.id);
    expect(restoredProject.projects[0].archivedAt).toBeNull();
    const archivedList = archiveListCommand(data, list.id);
    expect(archivedList.referenceLists[0].archivedAt).toBeTruthy();
    expect(archivedList.referenceListEntries).toEqual(data.referenceListEntries);
    expect(unarchiveListCommand(archivedList, list.id).referenceLists[0].archivedAt).toBeNull();
  });

  it("counts and detaches every current Project Task and List relationship on deletion", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const child = { ...data.tasks[0], id: "child_task", parentTaskId: data.tasks[0].id, deletedAt: "2026-07-01T01:00:00.000Z" };
    const archivedList = { ...data.referenceLists[0], id: "archived_list", archivedAt: "2026-07-01T02:00:00.000Z" };
    const fixture = { ...data, tasks: [...data.tasks, child], referenceLists: [...data.referenceLists, archivedList] };
    expect(projectRelationshipCounts(fixture, project.id)).toEqual({ taskCount: 2, listCount: 2 });
    const deleted = deleteProjectCommand(fixture, project.id);
    expect(deleted.data.projects[0].deletedAt).toBeTruthy();
    expect(deleted.data.tasks.every((task) => task.location.type !== "project")).toBe(true);
    expect(deleted.data.referenceLists.every((list) => list.projectId !== project.id && list.location.type !== "project")).toBe(true);
    expect(deleted.data.tasks.every((task) => task.location.type === "area" && task.location.areaId === project.areaId)).toBe(true);
    expect(deleted.data.referenceLists.every((list) => list.location.type === "area" && list.areaId === project.areaId)).toBe(true);
    expect(deleted.data.tasks.find((task) => task.id === child.id)?.parentTaskId).toBe(data.tasks[0].id);
  });

  it("falls back to Inbox and loose Lists when the deleted Project has no valid Area", () => {
    const data = createSeedData();
    const project = { ...data.projects[0], areaId: null };
    const fixture = { ...data, projects: [project] };
    const deleted = deleteProjectCommand(fixture, project.id).data;
    expect(deleted.tasks[0].location).toEqual({ type: "inbox" });
    expect(deleted.referenceLists[0].location).toEqual({ type: "loose" });
    expect(deleted.referenceLists[0].projectId).toBeNull();
  });

  it("undo restores Project deletion relationships while later restore only restores the Project", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const deleted = deleteProjectCommand(data, project.id);
    const undone = undoProjectDeletionCommand(deleted.data, deleted.receipt);
    expect(undone.projects[0].deletedAt).toBeNull();
    expect(undone.tasks[0].location).toEqual({ type: "project", projectId: project.id });
    expect(undone.referenceLists[0].projectId).toBe(project.id);
    const restored = restoreCommand(deleted.data, "project", project.id);
    expect(restored.projects[0].deletedAt).toBeNull();
    expect(restored.tasks[0].location).not.toEqual({ type: "project", projectId: project.id });
    expect(restored.referenceLists[0].projectId).toBeNull();
  });

  it("demotes an archived Project to Deleted without keeping archive state", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const archived = archiveProjectCommand(data, project.id);
    const deleted = deleteProjectCommand(archived, project.id).data;
    expect(deleted.projects[0].deletedAt).toBeTruthy();
    expect(deleted.projects[0].archivedAt).toBeNull();
  });

  it("purges deleted Projects, Lists and Task subtrees from storage", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const list = data.referenceLists[0];
    const task = data.tasks[0];
    const child = { ...task, id: "child_task", title: "Child", parentTaskId: task.id, deletedAt: null };
    const entry = { ...data.referenceListEntries[0], id: "entry_to_purge", referenceListId: list.id, deletedAt: null };
    const withRecords = { ...data, tasks: [...data.tasks, child], referenceListEntries: [...data.referenceListEntries, entry] };
    const deletedProject = deleteProjectCommand(withRecords, project.id).data;
    const deletedList = softDeleteCommand(deletedProject, "referenceList", list.id);
    const deletedTask = softDeleteCommand(deletedList, "task", task.id);
    const purgedProject = purgeCommand(deletedTask, "project", project.id);
    const purgedList = purgeCommand(purgedProject, "referenceList", list.id);
    const purgedTask = purgeCommand(purgedList, "task", task.id);
    expect(purgedTask.projects.some((candidate) => candidate.id === project.id)).toBe(false);
    expect(purgedTask.referenceLists.some((candidate) => candidate.id === list.id)).toBe(false);
    expect(purgedTask.referenceListEntries.some((candidate) => candidate.referenceListId === list.id)).toBe(false);
    expect(purgedTask.tasks.some((candidate) => candidate.id === task.id || candidate.id === child.id)).toBe(false);
  });
});
