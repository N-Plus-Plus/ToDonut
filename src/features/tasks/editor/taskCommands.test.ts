import { describe, expect, it } from "vitest";
import { Task, aggregateProgress, closeSatisfiedAggregates, createTaskCommand, defaultPriorityId, defaultStatusId, restoreTaskSubtree, saveTaskCommand, softDeleteTaskSubtree } from "../../../domain";
import { createSeedData } from "../../../seed";

describe("task editor domain commands", () => {
  it("keeps Must Do Today disabled for create and save", () => {
    const data = createSeedData();
    const createdData = createTaskCommand(data, {
      title: "Today flag", description: "", statusId: defaultStatusId(data), priorityId: defaultPriorityId(data),
      scheduledDate: null, revealDate: null, location: { type: "inbox" }, parentTaskId: null, tagIds: [], checklist: [],
    });
    const created = createdData.tasks.at(-1)!;
    expect(created.mustDoToday).toBe(false);
    const saved = saveTaskCommand(createdData, created.id, {
      title: created.title, description: created.description, statusId: created.statusId, priorityId: created.priorityId,
      scheduledDate: created.scheduledDate, revealDate: created.revealDate, mustDoToday: true, location: created.location,
      parentTaskId: null, tagIds: [], checklist: [],
    });
    expect(saved.tasks.find((task) => task.id === created.id)?.mustDoToday).toBe(false);
    expect(saved.activity.some((event) => event.summary === "Must Do Today changed")).toBe(false);
  });

  it("creates title-only Tasks in Inbox with defaults and no optional data", () => {
    const data = createSeedData();
    const next = createTaskCommand(data, {
      title: "Capture receipt",
      description: "",
      statusId: defaultStatusId(data),
      priorityId: defaultPriorityId(data),
      scheduledDate: null,
      revealDate: null,
      location: { type: "inbox" },
      parentTaskId: null,
      tagIds: [],
      checklist: [],
    });

    const created = next.tasks.at(-1)!;
    expect(created.title).toBe("Capture receipt");
    expect(created.location).toEqual({ type: "inbox" });
    expect(created.statusId).toBe(defaultStatusId(data));
    expect(created.priorityId).toBe(defaultPriorityId(data));
    expect(created.scheduledDate).toBeNull();
    expect(created.revealDate).toBeNull();
    expect(created.tagIds).toEqual([]);
    expect(created.description).toBe("");
    expect(created.checklist).toEqual([]);
  });

  it("rejects self and descendant parent relationships", () => {
    const data = createSeedData();
    const parent = data.tasks[0];
    const child: Task = { ...parent, id: "task_child", title: "Child", parentTaskId: parent.id, order: 2, childTaskIds: [], checklist: [] };
    const tree = { ...data, tasks: [parent, child] };

    expect(() => saveTaskCommand(tree, parent.id, { title: parent.title, description: "", statusId: parent.statusId, priorityId: parent.priorityId, scheduledDate: null, revealDate: null, location: parent.location, parentTaskId: parent.id, tagIds: [], checklist: [] })).toThrow(/own parent/);
    expect(() => saveTaskCommand(tree, parent.id, { title: parent.title, description: "", statusId: parent.statusId, priorityId: parent.priorityId, scheduledDate: null, revealDate: null, location: parent.location, parentTaskId: child.id, tagIds: [], checklist: [] })).toThrow(/descendant/);
  });

  it("converts a leaf parent to aggregate when assigning a child", () => {
    const data = createSeedData();
    const parent = data.tasks[0];
    const next = createTaskCommand(data, {
      title: "New child",
      description: "",
      statusId: defaultStatusId(data),
      priorityId: defaultPriorityId(data),
      scheduledDate: null,
      revealDate: null,
      location: parent.location,
      parentTaskId: parent.id,
      tagIds: [],
      checklist: [],
    });

    expect(next.tasks.find((task) => task.id === parent.id)?.aggregate).toBe(true);
    expect(next.tasks.at(-1)?.parentTaskId).toBe(parent.id);
    expect(next.activity.some((event) => event.type === "aggregateConverted")).toBe(true);
  });

  it("persists checklist changes without completing the Task", () => {
    const data = createSeedData();
    const task = data.tasks[0];
    const next = saveTaskCommand(data, task.id, {
      title: task.title,
      description: task.description,
      statusId: task.statusId,
      priorityId: task.priorityId,
      scheduledDate: task.scheduledDate,
      revealDate: task.revealDate,
      location: task.location,
      parentTaskId: null,
      tagIds: task.tagIds,
      checklist: [{ id: "check_1", text: "Verify", checked: true, order: 1, createdAt: task.createdAt, updatedAt: task.updatedAt }],
    });

    const saved = next.tasks.find((candidate) => candidate.id === task.id)!;
    expect(saved.checklist[0].checked).toBe(true);
    expect(saved.statusId).toBe(task.statusId);
  });

  it("makes checklist content inactive when a leaf converts to aggregate", () => {
    const data = createSeedData();
    const parent = { ...data.tasks[0], checklist: [{ id: "check_1", text: "Keep history", checked: false, order: 1, createdAt: data.tasks[0].createdAt, updatedAt: data.tasks[0].updatedAt }] };
    const fixture = { ...data, tasks: [parent] };
    const next = createTaskCommand(fixture, {
      title: "Child work",
      description: "",
      statusId: defaultStatusId(fixture),
      priorityId: defaultPriorityId(fixture),
      scheduledDate: null,
      revealDate: null,
      location: parent.location,
      parentTaskId: parent.id,
      tagIds: [],
      checklist: [],
    });

    const converted = next.tasks.find((candidate) => candidate.id === parent.id)!;
    expect(converted.aggregate).toBe(true);
    expect(converted.checklist).toEqual([]);
    expect(next.tasks.at(-1)?.checklist).toEqual([]);
    expect(next.activity.find((event) => event.type === "aggregateConverted")?.oldValue).toMatchObject({ inactiveFields: { checklist: parent.checklist } });
  });

  it("counts actionable descendants once and excludes aggregate parents", () => {
    const data = createSeedData();
    const root = data.tasks[0];
    const withChild = createTaskCommand(data, { title: "Child", description: "", statusId: defaultStatusId(data), priorityId: defaultPriorityId(data), scheduledDate: null, revealDate: null, location: root.location, parentTaskId: root.id, tagIds: [], checklist: [] });
    const child = withChild.tasks.at(-1)!;
    const withGrandchild = createTaskCommand(withChild, { title: "Grandchild", description: "", statusId: defaultStatusId(withChild), priorityId: defaultPriorityId(withChild), scheduledDate: null, revealDate: null, location: root.location, parentTaskId: child.id, tagIds: [], checklist: [] });

    expect(aggregateProgress(withGrandchild, root.id)).toMatchObject({ total: 1, open: 1, completed: 0, cancelled: 0, percent: 0 });
    expect(withGrandchild.tasks.filter((task) => task.aggregate)).toHaveLength(2);
  });

  it("auto-closes satisfied aggregate ancestors", () => {
    const data = createSeedData();
    const completedStatusId = data.statuses.find((status) => status.category === "completed")!.id;
    const cancelledStatusId = data.statuses.find((status) => status.category === "cancelled")!.id;
    const root = data.tasks[0];
    const withChild = createTaskCommand(data, { title: "Child", description: "", statusId: defaultStatusId(data), priorityId: defaultPriorityId(data), scheduledDate: null, revealDate: null, location: root.location, parentTaskId: root.id, tagIds: [], checklist: [] });
    const child = withChild.tasks.at(-1)!;
    const completed = { ...withChild, tasks: withChild.tasks.map((task) => task.id === child.id ? { ...task, statusId: completedStatusId } : task) };

    const closed = closeSatisfiedAggregates(completed, completedStatusId, cancelledStatusId);
    expect(closed.tasks.find((task) => task.id === root.id)?.statusId).toBe(completedStatusId);
  });

  it("soft deletes and restores complete Task subtrees", () => {
    const data = createSeedData();
    const root = data.tasks[0];
    const withChild = createTaskCommand(data, { title: "Child", description: "", statusId: defaultStatusId(data), priorityId: defaultPriorityId(data), scheduledDate: null, revealDate: null, location: root.location, parentTaskId: root.id, tagIds: [], checklist: [] });
    const child = withChild.tasks.at(-1)!;

    const deleted = softDeleteTaskSubtree(withChild, root.id);
    expect(deleted.tasks.find((task) => task.id === root.id)?.deletedAt).toBeTruthy();
    expect(deleted.tasks.find((task) => task.id === child.id)?.deletedAt).toBeTruthy();

    const restored = restoreTaskSubtree(deleted, root.id);
    expect(restored.tasks.find((task) => task.id === root.id)?.deletedAt).toBeNull();
    expect(restored.tasks.find((task) => task.id === child.id)?.deletedAt).toBeNull();
  });
});
