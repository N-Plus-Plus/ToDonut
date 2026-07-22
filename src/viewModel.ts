import {
  AppData,
  StandardViewId,
  Task,
  TaskGroupingField,
  TaskSortField,
  ViewPreference,
  createMeta,
  isTaskClosed,
  isTaskDeferred,
  isTaskRevealed,
  localDate,
  missedOccurrenceGroups,
  nowIso,
  orderedActivePriorities,
  statusCategory,
} from "./domain";

export type ViewId =
  | "today"
  | "upcoming"
  | "inbox"
  | "projects"
  | "areas"
  | "lists"
  | "all"
  | "overdue"
  | "someday"
  | "trash"
  | "recurrence"
  | "settings"
  | "diagnostics"
  | "bakery";
export type TaskViewId =
  | "today"
  | "inbox"
  | "tasks"
  | "upcoming"
  | "overdue"
  | "someday"
  | "project-detail"
  | "area-detail";
export interface TaskFilters {
  areaId?: string;
  projectId?: string;
  location?: "inbox" | "someday";
  statusId?: string;
  priorityId?: string;
  scheduledState?: "any" | "dated" | "undated" | "overdue" | "today" | "future";
  mustDoToday?: boolean;
  tagIds?: string[];
  closed?: "active" | "closed";
  deferred?: boolean;
}
export interface TaskViewOptions {
  showClosed: boolean;
  sort: TaskSortField;
  grouping: TaskGroupingField;
  filters?: TaskFilters;
  projectId?: string;
  areaId?: string;
}
export interface TaskViewSection {
  key: string;
  title: string;
  tasks: Task[];
  tone?: "closed" | "deferred";
}
export interface TaskViewResult {
  sections: TaskViewSection[];
  baseCount: number;
  filteredCount: number;
  hiddenClosedCount: number;
  deferredCount: number;
  duplicateTaskIds: string[];
  matchingTaskIds: string[];
  structuralAncestorIds: string[];
  visibleHierarchyIds: string[];
}

export function activeTasks(data: AppData, today = localDate()): Task[] {
  return data.tasks.filter(
    (task) =>
      !task.deletedAt &&
      !task.aggregate &&
      !isTaskClosed(data, task) &&
      isTaskRevealed(task, today),
  );
}

export function buildTaskView(
  data: AppData,
  viewId: TaskViewId,
  options: TaskViewOptions,
  today = localDate(),
): TaskViewResult {
  const base = baseTasksForView(data, viewId, options, today);
  const deferredAllowed =
    viewId === "tasks" ||
    viewId === "project-detail" ||
    viewId === "area-detail";
  const hiddenClosedCount = base.filter((task) =>
    isTaskClosed(data, task),
  ).length;
  const eligible = base
    .filter((task) => deferredAllowed || !isTaskDeferred(task, today))
    .filter((task) => options.showClosed || !isTaskClosed(data, task));
  const filters = options.filters ?? {};
  const filtering = hasActiveFilters(filters);
  const filterCandidates = filtering
    ? expandHierarchyCandidates(data, eligible)
        .filter((task) => deferredAllowed || !isTaskDeferred(task, today))
        .filter((task) => options.showClosed || !isTaskClosed(data, task))
    : eligible;
  const filtered = filterTasks(data, filterCandidates, filters, today);
  const hierarchy = filtering
    ? filteredHierarchyProjection(data, filtered)
    : {
        matchingTaskIds: filtered.map((task) => task.id),
        structuralAncestorIds: [],
        visibleHierarchyIds: expandHierarchyCandidates(data, filtered).map((task) => task.id),
      };
  const visible = filtering
    ? data.tasks.filter((task) =>
        hierarchy.visibleHierarchyIds.includes(task.id),
      )
    : filtered;
  const deferred = deferredAllowed
    ? filtered.filter((task) => isTaskDeferred(task, today))
    : [];
  const ordinary = filtered.filter((task) => !isTaskDeferred(task, today));
  const sections =
    filtering && visible.length
      ? [{ key: "filtered", title: "Filtered Tasks", tasks: visible }]
      : sectionTasks(data, viewId, ordinary, deferred, options, today);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const task of sections.flatMap((section) => section.tasks)) {
    if (seen.has(task.id)) duplicates.add(task.id);
    seen.add(task.id);
  }
  return {
    sections,
    baseCount: base.length,
    filteredCount: filtered.length,
    hiddenClosedCount,
    deferredCount: deferred.length,
    duplicateTaskIds: [...duplicates],
    ...hierarchy,
  };
}

export function filteredHierarchyProjection(data: AppData, matches: Task[]) {
  const matchingTaskIds = [...new Set(matches.map((task) => task.id))];
  const matching = new Set(matchingTaskIds);
  const structural = new Set<string>();
  for (const task of matches) {
    let parentId = task.parentTaskId;
    const visited = new Set<string>();
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      if (!matching.has(parentId)) structural.add(parentId);
      parentId =
        data.tasks.find(
          (candidate) => candidate.id === parentId && !candidate.deletedAt,
        )?.parentTaskId ?? null;
    }
  }
  return {
    matchingTaskIds,
    structuralAncestorIds: [...structural],
    visibleHierarchyIds: [...new Set([...matchingTaskIds, ...structural])],
  };
}

function expandHierarchyCandidates(data: AppData, base: Task[]): Task[] {
  const ids = new Set(base.map((task) => task.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const task of data.tasks) {
      if (
        !task.deletedAt &&
        task.parentTaskId &&
        ids.has(task.parentTaskId) &&
        !ids.has(task.id)
      ) {
        ids.add(task.id);
        changed = true;
      }
    }
  }
  return data.tasks.filter((task) => ids.has(task.id));
}

function hasActiveFilters(filters: TaskFilters): boolean {
  return Object.values(filters).some((value) =>
    Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== "",
  );
}

export function todayTasks(
  data: AppData,
  today = localDate(),
): { overdue: Task[]; main: Task[]; deferred: Task[] } {
  const view = buildTaskView(
    data,
    "today",
    { showClosed: false, sort: "default", grouping: "none" },
    today,
  );
  return {
    overdue:
      view.sections.find((section) => section.key === "overdue")?.tasks ?? [],
    main: view.sections.flatMap((section) => section.tasks),
    deferred: [],
  };
}

export function upcomingTasks(
  data: AppData,
  today = localDate(),
): Record<string, Task[]> {
  return groupTasks(
    data,
    baseTasksForView(data, "upcoming", {}, today),
    "scheduledDate",
  );
}

export const inboxTasks = (data: AppData, today = localDate()) =>
  buildTaskView(
    data,
    "inbox",
    { showClosed: false, sort: "default", grouping: "none" },
    today,
  ).sections.flatMap((section) => section.tasks);
export const somedayTasks = (data: AppData, today = localDate()) =>
  buildTaskView(
    data,
    "someday",
    { showClosed: false, sort: "default", grouping: "none" },
    today,
  ).sections.flatMap((section) => section.tasks);
export const overdueTasks = (data: AppData, today = localDate()) =>
  buildTaskView(
    data,
    "overdue",
    { showClosed: false, sort: "scheduledDate", grouping: "none" },
    today,
  ).sections.flatMap((section) => section.tasks);
export const allOpenTasks = (data: AppData, today = localDate()) =>
  buildTaskView(
    data,
    "tasks",
    { showClosed: false, sort: "default", grouping: "none" },
    today,
  ).sections.flatMap((section) => section.tasks);

function baseTasksForView(
  data: AppData,
  viewId: TaskViewId,
  options: Pick<TaskViewOptions, "projectId" | "areaId">,
  today: string,
): Task[] {
  const nonDeleted = data.tasks.filter((task) => !task.deletedAt);
  if (viewId === "tasks")
    return nonDeleted.filter(
      (task) =>
        !task.parentTaskId || task.aggregate || isTaskDeferred(task, today),
    );
  if (viewId === "project-detail")
    return nonDeleted.filter(
      (task) =>
        task.location.type === "project" &&
        task.location.projectId === options.projectId &&
        !task.parentTaskId,
    );
  if (viewId === "area-detail")
    return nonDeleted.filter(
      (task) =>
        task.location.type === "area" &&
        task.location.areaId === options.areaId &&
        !task.parentTaskId,
    );
  const leaf = nonDeleted.filter((task) => !task.aggregate);
  if (viewId === "today") {
    const topRanks = orderedActivePriorities(data)
      .slice(-2)
      .map((priority) => priority.id);
    return leaf.filter((task) => {
      if (task.location.type === "someday") return false;
      if (task.scheduledDate && task.scheduledDate > today) return false;
      if (
        isTaskClosed(data, task) &&
        task.scheduledDate !== today &&
        localDate(new Date(task.completedAt ?? task.cancelledAt ?? task.updatedAt)) !== today
      )
        return false;
      return (
        task.scheduledDate === today ||
        (task.scheduledDate !== null && task.scheduledDate < today) ||
        (!task.scheduledDate && topRanks.includes(task.priorityId))
      );
    });
  }
  if (viewId === "inbox")
    return leaf.filter((task) => task.location.type === "inbox");
  if (viewId === "upcoming")
    return leaf.filter((task) =>
      Boolean(task.scheduledDate && task.scheduledDate > today),
    );
  if (viewId === "overdue")
    return leaf.filter((task) =>
      Boolean(task.scheduledDate && task.scheduledDate < today),
    );
  if (viewId === "someday")
    return leaf.filter((task) => task.location.type === "someday");
  return [];
}

function sectionTasks(
  data: AppData,
  viewId: TaskViewId,
  ordinary: Task[],
  deferred: Task[],
  options: TaskViewOptions,
  today: string,
): TaskViewSection[] {
  if (viewId === "today") {
    const picked = new Set<string>();
    const pick = (
      key: string,
      title: string,
      predicate: (task: Task) => boolean,
      tone?: TaskViewSection["tone"],
    ) => {
      const tasks = sortTasks(
        data,
        ordinary.filter((task) => !picked.has(task.id) && predicate(task)),
        options.sort,
      );
      tasks.forEach((task) => picked.add(task.id));
      return tasks.length ? [{ key, title, tasks, tone }] : [];
    };
    return [
      ...pick("overdue", "Overdue", (task) =>
        Boolean(task.scheduledDate && task.scheduledDate < today),
      ),
      ...pick("due-today", "Due Today", (task) => task.scheduledDate === today),
      ...pick(
        "high-priority",
        "High Priority, No Due Date",
        (task) => !task.scheduledDate,
      ),
      ...pick("closed", "Closed", (task) => isTaskClosed(data, task), "closed"),
    ];
  }
  const open = ordinary.filter((task) => !isTaskClosed(data, task));
  const closed = ordinary.filter((task) => isTaskClosed(data, task));
  const sections = groupedSections(
    data,
    sortTasks(data, open, options.sort),
    options.grouping,
  );
  if (deferred.length)
    sections.push({
      key: "deferred",
      title: "Deferred",
      tasks: sortTasks(data, deferred, options.sort),
      tone: "deferred",
    });
  if (closed.length)
    sections.push({
      key: "closed",
      title: "Closed",
      tasks: sortTasks(data, closed, options.sort),
      tone: "closed",
    });
  return sections;
}

function groupedSections(
  data: AppData,
  tasks: Task[],
  grouping: TaskGroupingField,
): TaskViewSection[] {
  if (grouping === "none")
    return tasks.length ? [{ key: "tasks", title: "Tasks", tasks }] : [];
  return orderedGroupKeys(data, groupTasks(data, tasks, grouping), grouping)
    .map((key) => ({
      key,
      title: key,
      tasks: tasks.filter((task) => groupKey(data, task, grouping) === key),
    }))
    .filter((section) => section.tasks.length);
}

export function sortTasks(
  data: AppData,
  tasks: Task[],
  sort: TaskSortField,
): Task[] {
  return [...tasks].sort((a, b) => {
    const ap =
      data.priorities.find((priority) => priority.id === a.priorityId)?.rank ??
      3;
    const bp =
      data.priorities.find((priority) => priority.id === b.priorityId)?.rank ??
      3;
    const due = (a.scheduledDate ?? "9999-99-99").localeCompare(
      b.scheduledDate ?? "9999-99-99",
    );
    const stable =
      a.order - b.order ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id);
    if (sort === "scheduledDate") return due || stable;
    if (sort === "priority") return bp - ap || due || stable;
    if (sort === "manual") return stable;
    if (sort === "title")
      return (
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
        stable
      );
    return bp - ap || due || stable;
  });
}

export function filterTasks(
  data: AppData,
  tasks: Task[],
  filters: TaskFilters,
  today = localDate(),
): Task[] {
  return tasks.filter((task) => {
    if (filters.areaId && locationAreaId(data, task) !== filters.areaId)
      return false;
    if (
      filters.projectId &&
      !(
        task.location.type === "project" &&
        task.location.projectId === filters.projectId
      )
    )
      return false;
    if (filters.location && task.location.type !== filters.location)
      return false;
    if (filters.statusId && task.statusId !== filters.statusId) return false;
    if (filters.priorityId && task.priorityId !== filters.priorityId)
      return false;
    if (
      filters.tagIds?.length &&
      !filters.tagIds.every((tagId) => task.tagIds.includes(tagId))
    )
      return false;
    if (
      filters.deferred !== undefined &&
      isTaskDeferred(task, today) !== filters.deferred
    )
      return false;
    if (
      filters.closed === "active" &&
      statusCategory(data, task.statusId) !== "active"
    )
      return false;
    if (
      filters.closed === "closed" &&
      statusCategory(data, task.statusId) === "active"
    )
      return false;
    if (filters.scheduledState === "dated" && !task.scheduledDate) return false;
    if (filters.scheduledState === "undated" && task.scheduledDate)
      return false;
    if (
      filters.scheduledState === "overdue" &&
      !(task.scheduledDate && task.scheduledDate < today)
    )
      return false;
    if (filters.scheduledState === "today" && task.scheduledDate !== today)
      return false;
    if (
      filters.scheduledState === "future" &&
      !(task.scheduledDate && task.scheduledDate > today)
    )
      return false;
    return true;
  });
}

export function groupTasks(
  data: AppData,
  tasks: Task[],
  grouping: TaskGroupingField,
): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((groups, task) => {
    const key = groupKey(data, task, grouping);
    groups[key] = [...(groups[key] ?? []), task];
    return groups;
  }, {});
}

export function defaultViewPreference(viewId: StandardViewId): ViewPreference {
  const normalized = normalisePreferenceViewId(viewId);
  const at = new Date().toISOString();
  return {
    ...createMeta(`view_${normalized}`),
    id: `view_${normalized}`,
    kind: "viewPreference",
    viewId: normalized,
    sort: defaultSortForView(normalized),
    grouping: defaultGroupingForView(normalized),
    presentation: "compact",
    showClosed: false,
    collapsedKeys: [],
    createdAt: at,
    updatedAt: at,
  };
}

export function getViewPreference(
  data: AppData,
  viewId: StandardViewId,
): ViewPreference {
  const normalized = normalisePreferenceViewId(viewId);
  const found = data.viewPreferences.find(
    (preference) =>
      normalisePreferenceViewId(preference.viewId) === normalized &&
      !preference.deletedAt,
  );
  const fallback = defaultViewPreference(normalized);
  if (!found) return fallback;
  return {
    ...fallback,
    ...found,
    viewId: normalized,
    sort: validSort(found.sort) ? found.sort : fallback.sort,
    grouping: validGrouping(found.grouping)
      ? found.grouping
      : fallback.grouping,
    presentation:
      found.presentation === "compact" || found.presentation === "detailed"
        ? found.presentation
        : fallback.presentation,
    showClosed: Boolean(found.showClosed),
  };
}

export function saveViewPreference(
  data: AppData,
  viewId: StandardViewId,
  patch: Partial<
    Pick<ViewPreference, "sort" | "grouping" | "presentation" | "showClosed">
  >,
): AppData {
  const current = getViewPreference(data, viewId);
  const at = nowIso();
  const next: ViewPreference = {
    ...current,
    ...patch,
    updatedAt: at,
    version: current.version + 1,
  };
  const exists = data.viewPreferences.some(
    (preference) => preference.id === current.id,
  );
  return {
    ...data,
    viewPreferences: exists
      ? data.viewPreferences.map((preference) =>
          preference.id === current.id ? next : preference,
        )
      : [...data.viewPreferences, next],
  };
}

export function collapseMissedRecurrences(
  data: AppData,
  tasks: Task[],
  today = localDate(),
) {
  const missed = missedOccurrenceGroups(data, today);
  const hidden = new Set(missed.flatMap((group) => group.taskIds.slice(1)));
  return {
    tasks: tasks.filter((task) => !hidden.has(task.id)),
    summaries: missed.map((group) => ({
      type: "missedRecurrence" as const,
      ...group,
    })),
  };
}

export function normalisePreferenceViewId(
  viewId: StandardViewId,
): StandardViewId {
  return viewId === "all" ? "tasks" : viewId;
}

function defaultSortForView(viewId: StandardViewId): TaskSortField {
  return viewId === "upcoming" || viewId === "overdue"
    ? "scheduledDate"
    : "default";
}

function defaultGroupingForView(viewId: StandardViewId): TaskGroupingField {
  return viewId === "upcoming" || viewId === "overdue"
    ? "scheduledDate"
    : "none";
}

function validSort(value: TaskSortField): boolean {
  return ["default", "scheduledDate", "priority", "manual", "title"].includes(
    value,
  );
}

function validGrouping(value: TaskGroupingField): boolean {
  return [
    "none",
    "area",
    "project",
    "status",
    "priority",
    "scheduledDate",
    "tag",
  ].includes(value);
}

function groupKey(
  data: AppData,
  task: Task,
  grouping: TaskGroupingField,
): string {
  if (grouping === "none") return "Tasks";
  if (grouping === "area")
    return locationAreaId(data, task)
      ? (data.areas.find((area) => area.id === locationAreaId(data, task))
          ?.title ?? "Unknown Area")
      : "No Area";
  if (grouping === "project") {
    if (task.location.type === "project") {
      const projectId = task.location.projectId;
      return (
        data.projects.find((project) => project.id === projectId)?.title ??
        "Unknown Project"
      );
    }
    return task.location.type === "inbox"
      ? "Inbox"
      : task.location.type === "someday"
        ? "Someday"
        : "Standalone Area";
  }
  if (grouping === "status")
    return (
      data.statuses.find((status) => status.id === task.statusId)?.name ??
      "Unknown Status"
    );
  if (grouping === "priority")
    return (
      data.priorities.find((priority) => priority.id === task.priorityId)
        ?.name ?? "Unknown Priority"
    );
  if (grouping === "scheduledDate") return task.scheduledDate ?? "No Due Date";
  const tagId = firstTagId(data, task);
  return tagId
    ? (data.tags.find((tag) => tag.id === tagId)?.name ?? "Unknown Tag")
    : "No Tags";
}

function firstTagId(data: AppData, task: Task): string | null {
  const ordered = data.tags
    .filter((tag) => !tag.deletedAt && task.tagIds.includes(tag.id))
    .sort((a, b) => {
      const ag = a.tagGroupId
        ? (data.tagGroups.find(
            (group) => group.id === a.tagGroupId && !group.deletedAt,
          )?.order ?? 9999)
        : 9999;
      const bg = b.tagGroupId
        ? (data.tagGroups.find(
            (group) => group.id === b.tagGroupId && !group.deletedAt,
          )?.order ?? 9999)
        : 9999;
      return ag - bg || a.order - b.order || a.name.localeCompare(b.name);
    });
  return ordered[0]?.id ?? null;
}

function locationAreaId(data: AppData, task: Task): string | null {
  if (task.location.type === "area") return task.location.areaId;
  if (task.location.type === "project") {
    const projectId = task.location.projectId;
    return (
      data.projects.find((project) => project.id === projectId)?.areaId ?? null
    );
  }
  return null;
}

function orderedGroupKeys(
  data: AppData,
  groups: Record<string, Task[]>,
  grouping: TaskGroupingField,
): string[] {
  const keys = Object.keys(groups);
  if (grouping === "status")
    return orderedByNames(
      keys,
      data.statuses
        .filter((status) => !status.deletedAt)
        .sort((a, b) => a.order - b.order)
        .map((status) => status.name),
    );
  if (grouping === "priority")
    return orderedByNames(
      keys,
      data.priorities
        .filter((priority) => !priority.deletedAt)
        .sort((a, b) => b.rank - a.rank)
        .map((priority) => priority.name),
    );
  if (grouping === "tag")
    return orderedByNames(keys, [
      ...data.tags
        .filter((tag) => !tag.deletedAt)
        .sort((a, b) => a.order - b.order)
        .map((tag) => tag.name),
      "No Tags",
    ]);
  if (grouping === "scheduledDate")
    return keys.sort((a, b) =>
      (a === "No Due Date" ? "9999-99-99" : a).localeCompare(
        b === "No Due Date" ? "9999-99-99" : b,
      ),
    );
  return keys.sort((a, b) => a.localeCompare(b));
}

function orderedByNames(keys: string[], preferred: string[]): string[] {
  const rank = new Map(preferred.map((name, index) => [name, index]));
  return keys.sort(
    (a, b) =>
      (rank.get(a) ?? 9999) - (rank.get(b) ?? 9999) || a.localeCompare(b),
  );
}
