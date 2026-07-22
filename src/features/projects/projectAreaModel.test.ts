import { describe, expect, it } from "vitest";
import { AppData, Task } from "../../domain";
import { createSeedData, STATUS_IDS } from "../../seed";
import { activeOrderedAreas, activeOrderedProjects, archiveAreaCommand, archivedAreas, areaReferenceCounts, completeProjectCommand, createAreaCommand, createProjectCommand, deleteAreaCommand, demoteProjectToTaskCommand, projectProgress, promoteTaskToProjectCommand, reorderAreaCommand, reorderProjectCommand, restoreAreaCommand, reopenProjectCommand, unarchiveAreaCommand, undoAreaDeletionCommand } from "./projectAreaModel";

function withChild(data: AppData): AppData {
  const parent = { ...data.tasks[0], id: "task_parent", title: "Aggregate parent", aggregate: true, parentTaskId: null, childTaskIds: ["task_leaf"], order: 1 };
  const child: Task = { ...data.tasks[0], id: "task_leaf", title: "Leaf child", aggregate: false, parentTaskId: parent.id, childTaskIds: [], order: 2 };
  return { ...data, tasks: [parent, child] };
}

describe("Project and Area launch model", () => {
  it("creates and edits launch Project fields with active Area validation", () => {
    const data = createSeedData();
    const created = createProjectCommand(data, { title: "Plan launch", description: "Prep", areaId: data.areas[0].id, color: "var(--palette-aqua-light)", icon: "folder", tagIds: [] });
    const project = created.projects.at(-1)!;

    expect(project.title).toBe("Plan launch");
    expect(project.areaId).toBe(data.areas[0].id);
    expect(project.order).toBeGreaterThan(0);
    expect(() => createProjectCommand(data, { title: "Bad", description: "", areaId: "missing", color: "var(--palette-aqua-light)", icon: "folder", tagIds: [] })).toThrow(/active Area/);
  });

  it("counts actionable Project leaves without counting aggregate parents", () => {
    const data = withChild(createSeedData());
    const progress = projectProgress(data, data.projects[0].id);

    expect(progress.total).toBe(1);
    expect(progress.open).toBe(1);
  });

  it("completes Projects by cascading only open actionable Tasks and reopens only the Project", () => {
    const data = withChild(createSeedData());
    const completed = completeProjectCommand(data, data.projects[0].id).data;
    const project = completed.projects[0];
    const leaf = completed.tasks.find((task) => task.id === "task_leaf")!;

    expect(project.completedAt).toBeTruthy();
    expect(leaf.statusId).toBe(STATUS_IDS.completed);

    const reopened = reopenProjectCommand(completed, project.id);
    expect(reopened.projects[0].completedAt).toBeNull();
    expect(reopened.tasks.find((task) => task.id === leaf.id)!.statusId).toBe(STATUS_IDS.completed);
  });

  it("deletes Areas by detaching Projects, moving standalone Tasks to Inbox and making direct Lists loose", () => {
    const data = createSeedData();
    const deleted = deleteAreaCommand(data, data.areas[0].id);

    expect(areaReferenceCounts(data, data.areas[0].id)).toEqual({ projectCount: 1, taskCount: 0, listCount: 0 });
    expect(deleted.data.areas[0].deletedAt).toBeTruthy();
    expect(deleted.data.projects[0].areaId).toBeNull();

    const undone = undoAreaDeletionCommand(deleted.data, deleted.receipt);
    expect(undone.areas[0].deletedAt).toBeNull();
    expect(undone.projects[0].areaId).toBe(data.areas[0].id);

    const restored = restoreAreaCommand(deleted.data, data.areas[0].id);
    expect(restored.areas[0].deletedAt).toBeNull();
    expect(restored.projects[0].areaId).toBeNull();
  });

  it("archives and unarchives Areas without detaching their contents", () => {
    const data = createSeedData();
    const archived = archiveAreaCommand(data, data.areas[0].id);

    expect(activeOrderedAreas(archived).some((area) => area.id === data.areas[0].id)).toBe(false);
    expect(archivedAreas(archived).map((area) => area.id)).toContain(data.areas[0].id);
    expect(archived.projects[0].areaId).toBe(data.areas[0].id);

    const unarchived = unarchiveAreaCommand(archived, data.areas[0].id);
    expect(activeOrderedAreas(unarchived).map((area) => area.id)).toContain(data.areas[0].id);
    expect(unarchived.areas[0].archivedAt).toBeNull();
  });

  it("reorders Projects and Areas without changing unrelated records", () => {
    const data = createAreaCommand(createProjectCommand(createSeedData(), { title: "Second Project", description: "", areaId: null, color: "var(--palette-aqua-light)", icon: "folder", tagIds: [] }), { title: "Second Area", description: "", color: "var(--palette-aqua-dark)", icon: "folder" });
    const movedProjects = reorderProjectCommand(data, data.projects[1].id, -1);
    const movedAreas = reorderAreaCommand(data, data.areas[1].id, -1);

    expect(activeOrderedProjects(movedProjects)[0].id).toBe(data.projects[1].id);
    expect(movedAreas.areas.sort((a, b) => a.order - b.order)[0].id).toBe(data.areas[1].id);
    expect(movedProjects.tasks).toEqual(data.tasks);
  });

  it("promotes a Task atomically and transfers its children into the new Project", () => {
    const data = withChild(createSeedData());
    const parent = data.tasks.find((task) => task.id === "task_parent")!;
    const result = promoteTaskToProjectCommand(data, parent.id);
    const project = result.data.projects.find((candidate) => candidate.id === result.createdId)!;
    const child = result.data.tasks.find((task) => task.id === "task_leaf")!;

    expect(result.data.tasks.some((task) => task.id === parent.id)).toBe(false);
    expect(project.statusId).toBe(parent.statusId);
    expect(project.areaId).toBe(data.projects[0].areaId);
    expect(child.location).toEqual({ type: "project", projectId: project.id });
    expect(child.parentTaskId).toBeNull();
  });

  it("demotes a Project atomically and retains root Project Tasks as children", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const result = demoteProjectToTaskCommand(data, project.id);
    const task = result.data.tasks.find((candidate) => candidate.id === result.createdId)!;
    const formerProjectTask = result.data.tasks.find((candidate) => candidate.id === data.tasks[0].id)!;

    expect(result.data.projects.some((candidate) => candidate.id === project.id)).toBe(false);
    expect(task.statusId).toBe(project.statusId);
    expect(task.aggregate).toBe(true);
    expect(formerProjectTask.parentTaskId).toBe(task.id);
    expect(formerProjectTask.location).toEqual({ type: "area", areaId: project.areaId });
    expect(result.data.referenceLists[0].location).toEqual({ type: "area", areaId: project.areaId });
  });
});
