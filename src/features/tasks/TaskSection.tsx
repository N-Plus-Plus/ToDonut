import { CSSProperties } from "react";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  PanelTopClose,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AppData,
  Task,
  aggregateProgress,
  childTasks,
  isTaskClosed,
} from "../../domain";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { EntityContextLine, QuantifierTitleIcons, entityContextsForLocation, quantifierMetadataContextsForSelections } from "../../shared/components/EntityContextLine";
import { TaskProgressMeta } from "../../shared/components/TaskProgressMeta";
import { CardActionMenu } from "../../shared/components/CardActionMenu";
import { TASK_COMPLETION_ANIMATION_MS } from "./completionTiming";

export function TaskSection({
  title,
  showHeading = true,
  data,
  tasks,
  visibleHierarchyIds,
  structuralAncestorIds,
  activeTaskId,
  selectTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask = () => undefined,
  reorderTask,
  canReorder = true,
  presentation = "detailed",
  selectionMode = false,
  selectedTaskIds = new Set<string>(),
  toggleSelected,
  exitingTaskIds = new Set<string>(),
  tone,
}: {
  title: string;
  showHeading?: boolean;
  data: AppData;
  tasks: Task[];
  visibleHierarchyIds?: string[];
  structuralAncestorIds?: string[];
  activeTaskId?: string | null;
  selectTask?: (task: Task) => void;
  completeTask: (task: Task) => void;
  deleteTask: (task: Task) => void;
  editTask: (task: Task) => void;
  moveTask: (task: Task) => void;
  promoteTask?: (task: Task) => void;
  reorderTask: (
    taskId: string,
    targetId: string | null,
    direction?: -1 | 1,
  ) => void;
  canReorder?: boolean;
  presentation?: "compact" | "detailed";
  selectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  toggleSelected?: (task: Task) => void;
  exitingTaskIds?: Set<string>;
  tone?: "closed" | "deferred";
}) {
  const [deferredExpanded, setDeferredExpanded] = useState(false);
  const isDeferredSection = tone === "deferred";
  const showTasks = !isDeferredSection || deferredExpanded;
  return (
    <section className={`task-section ${tone ? `task-section--${tone}` : ""}`}>
      {showHeading && (isDeferredSection ? (
        <h3 className="section-heading">
          <button
            type="button"
            className="section-disclosure"
            aria-expanded={deferredExpanded}
            onClick={() => setDeferredExpanded((expanded) => !expanded)}
          >
            <ChevronDown aria-hidden="true" />
            <span>{title}</span>
          </button>
        </h3>
      ) : <h3 className="section-heading">{title}</h3>)}
      {showTasks && (tasks.length === 0 ? (
        <EmptyState>No tasks here.</EmptyState>
      ) : (
        <TaskHierarchy
          data={data}
          tasks={tasks}
          visibleHierarchyIds={visibleHierarchyIds}
          structuralAncestorIds={structuralAncestorIds}
          includeClosedDescendants={tone === "closed"}
          activeTaskId={activeTaskId}
          selectTask={selectTask}
          completeTask={completeTask}
          deleteTask={deleteTask}
          editTask={editTask}
          moveTask={moveTask}
          promoteTask={promoteTask}
          reorderTask={reorderTask}
          canReorder={canReorder}
          presentation={presentation}
          selectionMode={selectionMode}
          selectedTaskIds={selectedTaskIds}
          toggleSelected={toggleSelected}
          exitingTaskIds={exitingTaskIds}
        />
      ))}
    </section>
  );
}

type TaskInteractionProps = {
  data: AppData;
  activeTaskId?: string | null;
  selectTask?: (task: Task) => void;
  completeTask: (task: Task) => void;
  deleteTask: (task: Task) => void;
  editTask: (task: Task) => void;
  moveTask: (task: Task) => void;
  promoteTask?: (task: Task) => void;
  reorderTask: (
    taskId: string,
    targetId: string | null,
    direction?: -1 | 1,
  ) => void;
  canReorder?: boolean;
  presentation?: "compact" | "detailed";
  selectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  toggleSelected?: (task: Task) => void;
  exitingTaskIds?: Set<string>;
};

export function TaskHierarchy({
  data,
  tasks,
  visibleHierarchyIds,
  structuralAncestorIds = [],
  includeClosedDescendants = false,
  activeTaskId,
  selectTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask = () => undefined,
  reorderTask,
  canReorder = true,
  presentation = "detailed",
  selectionMode = false,
  selectedTaskIds = new Set<string>(),
  toggleSelected,
  exitingTaskIds = new Set<string>(),
}: TaskInteractionProps & {
  tasks: Task[];
  visibleHierarchyIds?: string[];
  structuralAncestorIds?: string[];
  includeClosedDescendants?: boolean;
}) {
  const collect = (task: Task): Task[] =>
    childTasks(data, task.id)
      .filter((child) => includeClosedDescendants || !isTaskClosed(data, child))
      .flatMap((child) => [child, ...collect(child)]);
  const allTasks = [
    ...new Map(
      tasks
        .flatMap((task) => [task, ...collect(task)])
        .map((task) => [task.id, task]),
    ).values(),
  ];
  const visibleIds = new Set(
    visibleHierarchyIds ?? allTasks.map((task) => task.id),
  );
  const structuralIds = new Set(structuralAncestorIds);
  const roots = allTasks.filter(
    (task) => visibleIds.has(task.id) && (!task.parentTaskId || !visibleIds.has(task.parentTaskId)),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const toggle = (taskId: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  return (
    <div className="task-hierarchy" role="tree">
      {roots.map((task) => (
        <TaskNode
          key={task.id}
          data={data}
          visibleIds={visibleIds}
          structuralIds={structuralIds}
          task={task}
          depth={1}
          collapsed={collapsed}
          toggleCollapsed={toggle}
          activeTaskId={activeTaskId}
          selectTask={selectTask}
          completeTask={completeTask}
          deleteTask={deleteTask}
          editTask={editTask}
          moveTask={moveTask}
          promoteTask={promoteTask}
          reorderTask={reorderTask}
          canReorder={canReorder}
          presentation={presentation}
          selectionMode={selectionMode}
          selectedTaskIds={selectedTaskIds}
          toggleSelected={toggleSelected}
          exitingTaskIds={exitingTaskIds}
        />
      ))}
    </div>
  );
}

function TaskNode({
  data,
  visibleIds,
  structuralIds,
  task,
  depth,
  collapsed,
  toggleCollapsed,
  activeTaskId,
  selectTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask = () => undefined,
  reorderTask,
  canReorder = true,
  presentation = "detailed",
  selectionMode = false,
  selectedTaskIds = new Set<string>(),
  toggleSelected,
  exitingTaskIds = new Set<string>(),
}: TaskInteractionProps & {
  visibleIds: Set<string>;
  structuralIds: Set<string>;
  task: Task;
  depth: number;
  collapsed: Set<string>;
  toggleCollapsed: (taskId: string) => void;
}) {
  const children = childTasks(data, task.id).filter((child) =>
    visibleIds.has(child.id),
  );
  const isCollapsed = collapsed.has(task.id);
  return (
    <div
      className={`task-node ${depth === 1 ? "task-node--root" : ""}`}
      role="treeitem"
      aria-level={depth}
      aria-expanded={children.length ? !isCollapsed : undefined}
      style={{ "--tree-depth": Math.min(depth - 1, 4) } as CSSProperties}
    >
      <div className="task-node__row">
        {children.length ? (
          <button
            type="button"
            className="tree-toggle icon-button button ghost"
            aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${task.title}`}
            onClick={() => toggleCollapsed(task.id)}
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" />
            ) : (
              <ChevronDown aria-hidden="true" />
            )}
          </button>
        ) : (
          <span
            className="tree-toggle tree-toggle--spacer"
            aria-hidden="true"
          />
        )}
        <TaskRow
          data={data}
          task={task}
          structuralOnly={structuralIds.has(task.id)}
          active={activeTaskId === task.id}
          selectTask={selectTask}
          completeTask={completeTask}
          deleteTask={deleteTask}
          editTask={editTask}
          moveTask={moveTask}
          promoteTask={promoteTask}
          reorderTask={reorderTask}
          canReorder={canReorder}
          presentation={presentation}
          selectionMode={selectionMode}
          selected={selectedTaskIds.has(task.id)}
          toggleSelected={toggleSelected}
          forceCompletionAnimation={exitingTaskIds.has(task.id)}
          completionDisabled={exitingTaskIds.has(task.id)}
        />
      </div>
      {children.length > 0 && !isCollapsed && (
        <div className="task-children" role="group">
          {children.map((child: Task) => (
            <TaskNode
              key={child.id}
              data={data}
              visibleIds={visibleIds}
              structuralIds={structuralIds}
              task={child}
              depth={depth + 1}
              collapsed={collapsed}
              toggleCollapsed={toggleCollapsed}
              activeTaskId={activeTaskId}
              selectTask={selectTask}
              completeTask={completeTask}
              deleteTask={deleteTask}
              editTask={editTask}
              moveTask={moveTask}
              promoteTask={promoteTask}
              reorderTask={reorderTask}
              canReorder={canReorder}
              presentation={presentation}
              selectionMode={selectionMode}
              selectedTaskIds={selectedTaskIds}
              toggleSelected={toggleSelected}
              exitingTaskIds={exitingTaskIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskRow({
  data,
  task,
  active = false,
  selectTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask = () => undefined,
  reorderTask,
  canReorder = true,
  presentation = "detailed",
  selectionMode = false,
  selected = false,
  structuralOnly = false,
  toggleSelected,
  forceCompletionAnimation = false,
  completionDisabled = false,
}: Omit<TaskInteractionProps, "activeTaskId" | "selectedTaskIds"> & {
  task: Task;
  active?: boolean;
  selected?: boolean;
  structuralOnly?: boolean;
  forceCompletionAnimation?: boolean;
  completionDisabled?: boolean;
}) {
  const status = data.statuses.find(
    (candidate) => candidate.id === task.statusId,
  );
  const priority = data.priorities.find(
    (candidate) => candidate.id === task.priorityId,
  );
  const tags = task.tagIds
    .map((tagId) => data.tags.find((tag) => tag.id === tagId))
    .filter(Boolean) as AppData["tags"];
  const closed = isTaskClosed(data, task);
  const previousClosed = useRef(closed);
  const [completionAnimated, setCompletionAnimated] = useState(false);
  const progress = task.aggregate ? aggregateProgress(data, task.id) : null;
  const checklistTotal = task.checklist.length;
  const checklistChecked = task.checklist.filter((item) => item.checked).length;
  const cancelled = status?.category === "cancelled";
  const completionVisualComplete = (closed || completionAnimated || forceCompletionAnimation) && !cancelled;
  useEffect(() => {
    if (((!previousClosed.current && closed) || forceCompletionAnimation) && !cancelled) {
      setCompletionAnimated(true);
      const timeout = window.setTimeout(
        () => setCompletionAnimated(false),
        TASK_COMPLETION_ANIMATION_MS,
      );
      previousClosed.current = closed;
      return () => window.clearTimeout(timeout);
    }
    if (!closed && !forceCompletionAnimation) setCompletionAnimated(false);
    previousClosed.current = closed;
  }, [closed, cancelled, forceCompletionAnimation]);
  if (structuralOnly) {
    return <article className="task-row structural-only"><div className="task-main"><span className="task-title">{task.title}</span><div className="task-meta"><span className="badge">Context</span></div></div></article>;
  }
  const rowSelected = selected || active;
  const canToggleSelection = Boolean(toggleSelected);
  const onRowClick = () => {
    if (canToggleSelection) toggleSelected?.(task);
  };
  return (
    <article
      className={`task-row task-row--${presentation} ${task.aggregate ? "is-aggregate" : ""} ${rowSelected ? "is-selected" : ""} ${active ? "active-context" : ""} ${closed ? "is-closed" : ""}`}
      aria-selected={rowSelected}
      onFocus={() => selectTask?.(task)}
      onPointerDown={() => selectTask?.(task)}
      onClick={onRowClick}
      onDragOver={(event) => {
        if (canReorder) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!canReorder) return;
        reorderTask(event.dataTransfer.getData("text/task-id"), task.id);
      }}
    >
      <button
        type="button"
        className={`task-reorder-handle drag-handle ${canReorder ? "" : "drag-handle--inactive"}`}
        draggable={canReorder}
        aria-label="Reorder Task"
        aria-disabled={!canReorder}
        title="Reorder Task"
        onClick={(event) => event.stopPropagation()}
        onDragStart={(event) => {
          if (!canReorder) return;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/task-id", task.id);
        }}
        onKeyDown={(event) => {
          if (!canReorder) return;
          if (event.key === "ArrowUp") {
            event.preventDefault();
            reorderTask(task.id, null, -1);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            reorderTask(task.id, null, 1);
          }
        }}
      >
        <GripVertical aria-hidden="true" />
      </button>
      {task.aggregate ? (
        <Button variant="ghost" onClick={(event) => { event.stopPropagation(); completeTask(task); }}>
          {closed ? "Reopen Tree" : "Complete Tree"}
        </Button>
      ) : (
        <button
          className={`completion-button ${completionVisualComplete ? "is-completed" : ""} ${completionAnimated || forceCompletionAnimation ? "completion-button--animate" : ""}`}
          style={{ "--priority-colour": priority?.color ?? "var(--colour-border-strong)" } as CSSProperties}
          disabled={completionDisabled}
          onClick={(event) => { event.stopPropagation(); completeTask(task); }}
          aria-pressed={closed}
          aria-label={`${closed ? "Reopen" : "Complete"} ${task.title}`}
        >
          {completionVisualComplete && <Check aria-hidden="true" viewBox="0 -3 24 24" />}
        </button>
      )}
      <div className="task-main">
        <button
          type="button"
          className="task-title task-title-button"
          onClick={(event) => { event.stopPropagation(); editTask(task); }}
        >
          <span className="entity-title-text">{task.title}</span>
          <QuantifierTitleIcons data={data} selections={task.quantifierSelections} />
        </button>
        {presentation === "detailed" && !task.aggregate && task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <div className={presentation === "compact" ? "task-secondary-meta" : "task-meta"}>
          {task.aggregate ? (
            <>
              {progress && progress.total ? (
                <>
                  <span className="badge">Aggregate</span>
                  <TaskProgressMeta>{progress.percent}% closed · {progress.open} open · {progress.completed} completed · {progress.cancelled} cancelled</TaskProgressMeta>
                </>
              ) : (
                <TaskProgressMeta>No actionable Tasks</TaskProgressMeta>
              )}
            </>
          ) : (
            <>
              {presentation === "compact" && status && (
                <span
                  className="task-status-summary"
                  style={{ "--status-colour": status.color } as CSSProperties}
                >
                  Status: {status.name}
                </span>
              )}
              {task.scheduledDate && <span>Due: {task.scheduledDate}</span>}
              {task.revealDate && (
                <span>Reveal {task.revealDate}</span>
              )}
              {presentation === "detailed" && checklistTotal > 0 && (
                <span>
                  {checklistChecked} of {checklistTotal} checklist items
                </span>
              )}
            </>
          )}
          {presentation === "detailed" && closed && <span className="badge">Closed</span>}
          {presentation === "detailed" && status && (
            <span
              className={`badge ${status.category === "completed" ? "success" : status.category === "cancelled" ? "" : status.name === "Blocked" ? "danger" : ""}`}
              style={{ "--accent": status.color } as CSSProperties}
            >
              {status.name}
            </span>
          )}
          {presentation === "detailed" && !task.aggregate && priority && (
            <span
              className="priority-indicator"
              style={{ "--priority-colour": priority.color } as CSSProperties}
            >
              {priority.name}
            </span>
          )}
          <EntityContextLine items={[...entityContextsForLocation(data, task.location), ...quantifierMetadataContextsForSelections(data, task.quantifierSelections)]} />
          {presentation === "detailed" &&
            !task.aggregate &&
            tags.map((tag: AppData["tags"][number]) => (
              <span
                className="tag"
                style={{ "--tag-colour": tag.color } as CSSProperties}
                key={tag.id}
              >
                {tag.name}
              </span>
            ))}
        </div>
      </div>
      <div className="task-row-actions" onClick={(event) => event.stopPropagation()}>
        {canReorder && (
          <>
            <button type="button" className="icon-button button ghost task-action-button" aria-label="Move Task up" title="Move Task up" onClick={() => reorderTask(task.id, null, -1)}>
              <ChevronUp aria-hidden="true" />
            </button>
            <button type="button" className="icon-button button ghost task-action-button" aria-label="Move Task down" title="Move Task down" onClick={() => reorderTask(task.id, null, 1)}>
              <ChevronDown aria-hidden="true" />
            </button>
          </>
        )}
        <div className="task-row-actions__core">
          <button type="button" className="icon-button button ghost task-action-button" aria-label="Edit Task" title="Edit Task" onClick={() => editTask(task)}>
            <Pencil aria-hidden="true" />
          </button>
          <button type="button" className="icon-button button ghost task-action-button" aria-label={`Promote ${task.title} to Project`} title="Promote to Project" onClick={() => promoteTask(task)}>
            <PanelTopClose aria-hidden="true" />
          </button>
          <button type="button" className="icon-button button ghost task-action-button" aria-label="Process Task" title="Process Task" onClick={() => moveTask(task)}>
            <BriefcaseBusiness aria-hidden="true" />
          </button>
          <button type="button" className="icon-button button danger task-action-button task-delete-action" aria-label="Move Task to Trash" title="Move Task to Trash" onClick={() => deleteTask(task)}>
            <Trash2 aria-hidden="true" />
          </button>
        </div>
        <CardActionMenu
          label={`Open actions for ${task.title}`}
          actions={[
            ...(canReorder ? [
              { id: "up", label: "Move up", icon: <ChevronUp aria-hidden="true" />, onSelect: () => reorderTask(task.id, null, -1) },
              { id: "down", label: "Move down", icon: <ChevronDown aria-hidden="true" />, onSelect: () => reorderTask(task.id, null, 1) },
            ] : []),
            { id: "edit", label: "Edit", icon: <Pencil aria-hidden="true" />, onSelect: () => editTask(task) },
            { id: "promote", label: "Promote to Project", icon: <PanelTopClose aria-hidden="true" />, onSelect: () => promoteTask(task) },
            { id: "process", label: "Process", icon: <BriefcaseBusiness aria-hidden="true" />, onSelect: () => moveTask(task) },
            { id: "delete", label: "Move to Trash", icon: <Trash2 aria-hidden="true" />, onSelect: () => deleteTask(task), danger: true },
          ]}
        />
      </div>
    </article>
  );
}
