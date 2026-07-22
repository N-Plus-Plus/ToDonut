import { AppData, Task, TaskMoveDestination, applyMutuallyExclusiveTags, closeSatisfiedAggregates, completeAggregate, createActivity, descendants, isTaskClosed, moveTaskSubtreeCommand, nowIso, reopenTaskCommand, statusCategory } from "../../domain";

export type BulkTaskCommand =
  | { type: "move"; destination: TaskMoveDestination }
  | { type: "addTags"; tagIds: string[] }
  | { type: "removeTags"; tagIds: string[] }
  | { type: "status"; statusId: string }
  | { type: "priority"; priorityId: string }
  | { type: "reschedule"; scheduledDate: string | null }
  | { type: "complete"; statusId: string; cancelledStatusId: string }
  | { type: "cancel"; statusId: string; completedStatusId: string }
  | { type: "trash" };

export interface BulkTaskResult { data: AppData; affectedTaskIds: string[]; cascadeCount: number; summary: string }

export function runBulkTaskCommand(data: AppData, selectedTaskIds: string[], command: BulkTaskCommand): BulkTaskResult {
  const selected = selectedTaskIds.map((id) => data.tasks.find((task) => task.id === id && !task.deletedAt)).filter(Boolean) as Task[];
  const roots = dedupeCoveredTasks(data, selected);
  if (!roots.length) throw new Error("Select at least one visible Task.");
  const affected = affectedTasks(data, roots, command);
  if (!affected.length) throw new Error("No selected Tasks are eligible for this action.");
  const at = nowIso();
  const affectedIds = new Set(affected.map((task) => task.id));
  let next: AppData = data;
  if (command.type === "complete") {
    next = data;
    for (const root of roots) {
      if (root.aggregate) next = completeAggregate(next, root.id, command.statusId);
    }
    const remaining = affected.filter((task) => !task.aggregate);
    next = updateTasks(next, remaining, (task) => isTaskClosed(next, task) ? task : { ...task, statusId: command.statusId, completedAt: at, cancelledAt: null }, "completed", "Bulk completed");
    next = closeSatisfiedAggregates(next, command.statusId, command.cancelledStatusId);
  } else if (command.type === "cancel") {
    const openLeaves = affected.filter((task) => !task.aggregate && statusCategory(data, task.statusId) === "active");
    next = updateTasks(data, openLeaves, (task) => ({ ...task, statusId: command.statusId, cancelledAt: at, completedAt: null }), "cancelled", "Bulk cancelled");
    next = closeSatisfiedAggregates(next, command.completedStatusId, command.statusId);
  } else if (command.type === "trash") {
    next = updateTasks(data, affected, (task) => ({ ...task, deletedAt: at }), "softDeleted", "Bulk moved to Trash");
  } else if (command.type === "move") {
    next = data;
    for (const root of roots) next = moveTaskSubtreeCommand(next, root.id, command.destination);
  } else if (command.type === "addTags") {
    next = updateTasks(data, affected.filter((task) => !task.aggregate), (task) => ({ ...task, tagIds: command.tagIds.reduce((ids, tagId) => applyMutuallyExclusiveTags(data, ids, tagId, "task"), task.tagIds) }), "tagsChanged", "Bulk Tags added");
  } else if (command.type === "removeTags") {
    next = updateTasks(data, affected.filter((task) => !task.aggregate), (task) => ({ ...task, tagIds: task.tagIds.filter((tagId) => !command.tagIds.includes(tagId)) }), "tagsChanged", "Bulk Tags removed");
  } else if (command.type === "status") {
    const category = statusCategory(data, command.statusId);
    if (category === "completed") {
      const cancelledStatusId = data.statuses.find((status) => status.category === "cancelled" && !status.deletedAt)?.id ?? command.statusId;
      for (const root of roots) next = root.aggregate ? completeAggregate(next, root.id, command.statusId) : updateTasks(next, [next.tasks.find((task) => task.id === root.id)!], (task) => ({ ...task, statusId: command.statusId, completedAt: at, cancelledAt: null }), "completed", "Bulk Status changed");
      next = closeSatisfiedAggregates(next, command.statusId, cancelledStatusId);
    } else if (category === "cancelled") {
      const completedStatusId = data.statuses.find((status) => status.category === "completed" && !status.deletedAt)?.id ?? command.statusId;
      const openLeaves = roots.flatMap((root) => root.aggregate ? descendants(next, root.id).filter((task) => !task.aggregate && statusCategory(next, task.statusId) === "active") : statusCategory(next, root.statusId) === "active" ? [root] : []);
      next = updateTasks(next, uniqueById(openLeaves), (task) => ({ ...task, statusId: command.statusId, completedAt: null, cancelledAt: at }), "cancelled", "Bulk Status changed");
      next = closeSatisfiedAggregates(next, completedStatusId, command.statusId);
    } else {
      for (const root of roots) {
        const current = next.tasks.find((task) => task.id === root.id)!;
        next = current.aggregate || isTaskClosed(next, current) ? reopenTaskCommand(next, current.id, command.statusId) : updateTasks(next, [current], (task) => ({ ...task, statusId: command.statusId, completedAt: null, cancelledAt: null }), "statusChanged", "Bulk Status changed");
      }
    }
  } else if (command.type === "priority") {
    next = updateTasks(data, affected.filter((task) => !task.aggregate), (task) => ({ ...task, priorityId: command.priorityId }), "priorityChanged", "Bulk Priority changed");
  } else if (command.type === "reschedule") {
    next = updateTasks(data, affected.filter((task) => !task.aggregate), (task) => ({ ...task, scheduledDate: command.scheduledDate }), "scheduledDateChanged", "Bulk Due Date changed");
  }
  const changedTaskIds = data.tasks.filter((before) => next.tasks.find((after) => after.id === before.id)?.version !== before.version).map((task) => task.id);
  const finalAffectedIds = changedTaskIds.length ? changedTaskIds : [...affectedIds];
  return { data: { ...next, activity: [...next.activity, createActivity("task", roots[0].id, "statusChanged", bulkSummary(command, finalAffectedIds.length), null, { operation: command.type, affectedTaskIds: finalAffectedIds })] }, affectedTaskIds: finalAffectedIds, cascadeCount: Math.max(0, finalAffectedIds.length - roots.length), summary: bulkSummary(command, finalAffectedIds.length) };
}

function affectedTasks(data: AppData, roots: Task[], command: BulkTaskCommand): Task[] {
  const includeDescendants = command.type === "complete" || command.type === "cancel" || command.type === "trash" || command.type === "move";
  const tasks = includeDescendants ? roots.flatMap((task) => [task, ...descendants(data, task.id).filter((child) => !child.deletedAt)]) : roots;
  return uniqueById(tasks);
}

function dedupeCoveredTasks(data: AppData, selected: Task[]): Task[] {
  const selectedIds = new Set(selected.map((task) => task.id));
  return selected.filter((task) => !ancestorIds(data, task).some((id) => selectedIds.has(id)));
}

function ancestorIds(data: AppData, task: Task): string[] {
  const ids: string[] = [];
  let current = task.parentTaskId ? data.tasks.find((candidate) => candidate.id === task.parentTaskId) : null;
  while (current) {
    ids.push(current.id);
    current = current.parentTaskId ? data.tasks.find((candidate) => candidate.id === current!.parentTaskId) : null;
  }
  return ids;
}

function updateTasks(data: AppData, tasks: Task[], change: (task: Task) => Task, eventType: Parameters<typeof createActivity>[2], summary: string): AppData {
  const at = nowIso();
  const changed = new Map<string, Task>();
  const events = [];
  for (const task of tasks) {
    const updated = { ...change(task), updatedAt: at, version: task.version + 1 };
    if (JSON.stringify(task) === JSON.stringify(updated)) continue;
    changed.set(task.id, updated);
    events.push(createActivity("task", task.id, eventType, summary, task, updated));
  }
  return { ...data, tasks: data.tasks.map((task) => changed.get(task.id) ?? task), activity: [...data.activity, ...events] };
}

function uniqueById(tasks: Task[]): Task[] {
  return [...new Map(tasks.map((task) => [task.id, task])).values()];
}

function bulkSummary(command: BulkTaskCommand, count: number): string {
  const label = command.type === "addTags" ? "Tags added" : command.type === "removeTags" ? "Tags removed" : command.type === "reschedule" ? "Due Date changed" : command.type === "trash" ? "Moved to Trash" : command.type;
  return `Bulk ${label}: ${count} Task${count === 1 ? "" : "s"}`;
}
