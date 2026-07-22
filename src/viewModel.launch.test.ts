import { describe, expect, it } from "vitest";
import { AppData, Task, createMeta } from "./domain";
import { PRIORITY_IDS, STATUS_IDS, createSeedData } from "./seed";
import { buildTaskView, filterTasks, getViewPreference, saveViewPreference, sortTasks } from "./viewModel";
import { runBulkTaskCommand } from "./features/tasks/bulkTaskCommands";

const baseTask = (data: AppData): Task => data.tasks[0];
const task = (data: AppData, patch: Partial<Task>): Task => ({ ...baseTask(data), ...createMeta("task"), title: patch.title ?? "Task", statusId: STATUS_IDS.open, priorityId: PRIORITY_IDS.normal, scheduledDate: null, revealDate: null, parentTaskId: null, childTaskIds: [], mustDoToday: false, aggregate: false, deletedAt: null, ...patch });

describe("launch task views", () => {
  it("uses Today section precedence and excludes future reveal tasks from ordinary views", () => {
    const data = createSeedData();
    const overdue = task(data, { title: "Overdue", scheduledDate: "2026-06-29", mustDoToday: true });
    const due = task(data, { title: "Due", scheduledDate: "2026-06-30" });
    const deferred = task(data, { title: "Deferred", scheduledDate: "2026-06-30", revealDate: "2026-07-02" });
    const view = buildTaskView({ ...data, tasks: [overdue, due, deferred] }, "today", { showClosed: false, sort: "default", grouping: "none" }, "2026-06-30");
    expect(view.sections.map((section) => section.key)).toEqual(["overdue", "due-today"]);
    expect(view.sections.flatMap((section) => section.tasks.map((item) => item.id))).toEqual([overdue.id, due.id]);
    expect(view.duplicateTaskIds).toEqual([]);
  });

  it("shows Deferred only in broad Tasks and detail contexts", () => {
    const data = createSeedData();
    const deferred = task(data, { revealDate: "2026-07-02" });
    expect(buildTaskView({ ...data, tasks: [deferred] }, "inbox", { showClosed: false, sort: "default", grouping: "none" }, "2026-06-30").sections).toEqual([]);
    expect(buildTaskView({ ...data, tasks: [deferred] }, "tasks", { showClosed: false, sort: "default", grouping: "none" }, "2026-06-30").sections[0].key).toBe("deferred");
  });

  it("applies Closed membership before Show Closed filtering", () => {
    const data = createSeedData();
    const closedToday = task(data, { statusId: STATUS_IDS.completed, scheduledDate: "2026-06-30" });
    const closedFuture = task(data, { statusId: STATUS_IDS.completed, scheduledDate: "2026-07-01" });
    const hidden = buildTaskView({ ...data, tasks: [closedToday, closedFuture] }, "today", { showClosed: false, sort: "default", grouping: "none" }, "2026-06-30");
    const shown = buildTaskView({ ...data, tasks: [closedToday, closedFuture] }, "today", { showClosed: true, sort: "default", grouping: "none" }, "2026-06-30");
    expect(hidden.filteredCount).toBe(0);
    expect(shown.sections.flatMap((section) => section.tasks.map((item) => item.id))).toEqual([closedToday.id]);
  });

  it("excludes old undated closed high-priority tasks from Today when Closed is shown", () => {
    const data = createSeedData();
    const closedOldHighPriority = task(data, { statusId: STATUS_IDS.completed, priorityId: PRIORITY_IDS.high, completedAt: "2026-06-28T00:00:00.000Z", updatedAt: "2026-06-28T00:00:00.000Z" });
    const closedTodayHighPriority = task(data, { statusId: STATUS_IDS.completed, priorityId: PRIORITY_IDS.high, completedAt: "2026-06-30T00:00:00.000Z", updatedAt: "2026-06-30T00:00:00.000Z" });
    const shown = buildTaskView({ ...data, tasks: [closedOldHighPriority, closedTodayHighPriority] }, "today", { showClosed: true, sort: "default", grouping: "none" }, "2026-06-30");
    expect(shown.sections.flatMap((section) => section.tasks.map((item) => item.id))).toEqual([closedTodayHighPriority.id]);
  });

  it("sorts by title and filters Tags with AND logic", () => {
    const data = createSeedData();
    const [firstTag, secondTag] = data.tags;
    const alpha = task(data, { title: "Alpha", tagIds: [firstTag.id, secondTag.id] });
    const beta = task(data, { title: "beta", tagIds: [firstTag.id] });
    expect(sortTasks(data, [beta, alpha], "title").map((item) => item.title)).toEqual(["Alpha", "beta"]);
    expect(filterTasks(data, [alpha, beta], { tagIds: [firstTag.id, secondTag.id] })).toEqual([alpha]);
  });

  it("retains only required structural ancestors for matching descendants", () => {
    const data = createSeedData();
    const [firstTag, secondTag] = data.tags;
    const parent = task(data, { title: "Parent", aggregate: true });
    const matching = task(data, { title: "Matching child", parentTaskId: parent.id, tagIds: [firstTag.id, secondTag.id] });
    const sibling = task(data, { title: "Unrelated sibling", parentTaskId: parent.id, tagIds: [firstTag.id] });
    const result = buildTaskView({ ...data, tasks: [parent, matching, sibling] }, "tasks", { showClosed: false, sort: "default", grouping: "none", filters: { tagIds: [firstTag.id, secondTag.id] } }, "2026-06-30");
    expect(result.matchingTaskIds).toEqual([matching.id]);
    expect(result.structuralAncestorIds).toEqual([parent.id]);
    expect(result.visibleHierarchyIds).toEqual(expect.arrayContaining([parent.id, matching.id]));
    expect(result.visibleHierarchyIds).not.toContain(sibling.id);
    expect(result.filteredCount).toBe(1);
  });

  it("does not include descendants merely because an ancestor matches", () => {
    const data = createSeedData();
    const [firstTag] = data.tags;
    const parent = task(data, { title: "Parent", aggregate: true, tagIds: [firstTag.id] });
    const child = task(data, { title: "Child", parentTaskId: parent.id, tagIds: [] });
    const result = buildTaskView({ ...data, tasks: [parent, child] }, "tasks", { showClosed: false, sort: "default", grouping: "none", filters: { tagIds: [firstTag.id] } }, "2026-06-30");
    expect(result.matchingTaskIds).toEqual([parent.id]);
    expect(result.visibleHierarchyIds).toEqual([parent.id]);
  });

  it("persists view preferences and falls back from invalid values", () => {
    const data = createSeedData();
    const saved = saveViewPreference(data, "tasks", { showClosed: true, presentation: "compact", sort: "title" });
    expect(getViewPreference(saved, "all")).toMatchObject({ viewId: "tasks", showClosed: true, presentation: "compact", sort: "title" });
  });

  it("deduplicates parent and child overlap in bulk operations", () => {
    const data = createSeedData();
    const parent = task(data, { aggregate: true });
    const child = task(data, { parentTaskId: parent.id, priorityId: PRIORITY_IDS.low });
    const source = { ...data, tasks: [parent, child] };
    const result = runBulkTaskCommand(source, [parent.id, child.id], { type: "complete", statusId: STATUS_IDS.completed, cancelledStatusId: STATUS_IDS.cancelled });
    expect(result.affectedTaskIds.sort()).toEqual([parent.id, child.id].sort());
    expect(new Set(result.affectedTaskIds).size).toBe(2);
  });

  it("uses aggregate cascades for bulk Cancel while preserving prior closed leaves", () => {
    const data = createSeedData();
    const parent = task(data, { aggregate: true });
    const open = task(data, { parentTaskId: parent.id });
    const completed = task(data, { parentTaskId: parent.id, statusId: STATUS_IDS.completed, completedAt: "2026-06-01T00:00:00.000Z" });
    const cancelled = task(data, { parentTaskId: parent.id, statusId: STATUS_IDS.cancelled, cancelledAt: "2026-06-01T00:00:00.000Z" });
    const result = runBulkTaskCommand({ ...data, tasks: [parent, open, completed, cancelled] }, [parent.id], { type: "cancel", statusId: STATUS_IDS.cancelled, completedStatusId: STATUS_IDS.completed });
    expect(result.data.tasks.find((item) => item.id === open.id)?.statusId).toBe(STATUS_IDS.cancelled);
    expect(result.data.tasks.find((item) => item.id === completed.id)?.statusId).toBe(STATUS_IDS.completed);
    expect(result.data.tasks.find((item) => item.id === cancelled.id)?.statusId).toBe(STATUS_IDS.cancelled);
    expect(result.data.tasks.find((item) => item.id === parent.id)?.statusId).toBe(STATUS_IDS.cancelled);
  });

  it("reopens aggregate ancestors for an active bulk Status target", () => {
    const data = createSeedData();
    const parent = task(data, { aggregate: true, statusId: STATUS_IDS.completed, completedAt: "2026-06-01T00:00:00.000Z" });
    const child = task(data, { parentTaskId: parent.id, statusId: STATUS_IDS.cancelled, cancelledAt: "2026-06-01T00:00:00.000Z" });
    const result = runBulkTaskCommand({ ...data, tasks: [parent, child] }, [child.id], { type: "status", statusId: STATUS_IDS.inProgress });
    expect(result.data.tasks.find((item) => item.id === child.id)?.statusId).toBe(STATUS_IDS.inProgress);
    expect(result.data.tasks.find((item) => item.id === parent.id)?.statusId).toBe(STATUS_IDS.inProgress);
  });
});
