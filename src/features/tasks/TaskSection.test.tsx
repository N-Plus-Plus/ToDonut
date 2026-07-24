import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppData, QUANTIFIER_IDS, Task } from "../../domain";
import { createSeedData } from "../../seed";
import { TaskHierarchy, TaskRow, TaskSection } from "./TaskSection";

function renderRow(data: AppData, task: Task, overrides: Partial<Parameters<typeof TaskRow>[0]> = {}) {
  const props = {
    data,
    task,
    completeTask: vi.fn(),
    deleteTask: vi.fn(),
    editTask: vi.fn(),
    moveTask: vi.fn(),
    reorderTask: vi.fn(),
    presentation: "compact" as const,
    toggleSelected: vi.fn(),
    ...overrides,
  };
  const view = render(<TaskRow {...props} />);
  return { ...props, ...view };
}

describe("TaskRow", () => {
  afterEach(() => cleanup());

  it("keeps compact rows focused and renders status, due date and project as muted metadata", () => {
    const data = createSeedData();
    const project = data.projects.find((candidate) => !candidate.deletedAt)!;
    const task = {
      ...data.tasks[0],
      description: "Verbose description",
      scheduledDate: "2026-07-02",
      location: { type: "project", projectId: project.id } as const,
      tagIds: [data.tags.find((tag) => tag.allowedScopes.includes("task"))?.id ?? ""].filter(Boolean),
      quantifierSelections: { [QUANTIFIER_IDS.energy]: "energy_3", [QUANTIFIER_IDS.context]: "context_5" },
    };

    const { container } = renderRow(data, task);

    expect(screen.queryByText("Verbose description")).not.toBeInTheDocument();
    const status = data.statuses.find((candidate) => candidate.id === task.statusId)!;
    expect(screen.queryByText(data.priorities.find((priority) => priority.id === task.priorityId)?.name ?? "")).not.toBeInTheDocument();
    expect(screen.getByText(`Status: ${status.name}`).closest(".task-secondary-meta")).not.toBeNull();
    expect(screen.getByText(`Status: ${status.name}`)).toHaveClass("task-status-summary");
    expect(screen.getByText("Due: 2026-07-02").closest(".task-secondary-meta")).not.toBeNull();
    const contextLine = container.querySelector(".entity-context-line")!;
    expect(contextLine).toHaveTextContent(`${data.areas[0].title}, ${project.title}, Medium Energy, Digital`);
    expect(contextLine.querySelector(".lucide-land-plot")).not.toBeNull();
    expect(contextLine.querySelector(".lucide-folder-kanban")).not.toBeNull();
    expect(contextLine.querySelector(".lucide-zap")).not.toBeNull();
    expect(contextLine.querySelector(".lucide-component")).not.toBeNull();
    expect(screen.getByText(data.areas[0].title)).toHaveStyle({ color: data.areas[0].color });
    expect(screen.getByText(project.title)).toHaveStyle({ color: project.color });
    expect(screen.queryByText("Active parent")).not.toBeInTheDocument();
  });

  it("places configured Quantifier icons after the Task name and leaves fallback Quantifiers in metadata", async () => {
    const data = createSeedData();
    data.quantifierDefinitions[0].options[2].iconNames = ["battery-plus"];
    const task = {
      ...data.tasks[0],
      quantifierSelections: { [QUANTIFIER_IDS.energy]: "energy_3", [QUANTIFIER_IDS.context]: "context_5" },
    };

    const { container } = renderRow(data, task);

    const title = screen.getByLabelText("Energy: Medium Energy").closest(".task-title")!;
    await waitFor(() => expect(title.querySelector(".lucide-battery-plus")).not.toBeNull());
    expect(screen.getByLabelText("Energy: Medium Energy").closest(".task-title")).toBe(title);
    expect(container.querySelector(".task-secondary-meta .lucide-battery-plus")).toBeNull();
    expect(container.querySelector(".task-secondary-meta .lucide-component")).not.toBeNull();
    expect(container.querySelector(".task-secondary-meta")).toHaveTextContent("Digital");
  });

  it("uses icon actions and keeps interactive clicks out of row selection", () => {
    const data = createSeedData();
    const task = data.tasks[0];
    const { editTask, moveTask, deleteTask, toggleSelected } = renderRow(data, task, { canReorder: false });

    fireEvent.click(screen.getByRole("article"));
    expect(toggleSelected).toHaveBeenCalledWith(task);

    fireEvent.click(screen.getByRole("button", { name: "Edit Task" }));
    fireEvent.click(screen.getByRole("button", { name: "Process Task" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Task to Trash" }));

    expect(editTask).toHaveBeenCalledWith(task);
    expect(moveTask).toHaveBeenCalledWith(task);
    expect(deleteTask).toHaveBeenCalledWith(task);
    expect(toggleSelected).toHaveBeenCalledTimes(1);

    const actions = screen.getByRole("button", { name: "Edit Task" }).closest(".task-row-actions")!;
    expect(actions).toHaveClass("task-row-actions");
    expect(actions.querySelectorAll(".task-action-button")).toHaveLength(4);
    expect(screen.getByRole("button", { name: `Promote ${task.title} to Project` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move Task up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move Task down" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Task to Trash" })).toHaveClass("task-delete-action");
  });

  it("renders explicit task move controls only when manual reordering is enabled", () => {
    const data = createSeedData();
    const task = data.tasks[0];
    const { rerender, completeTask, deleteTask, editTask, moveTask, reorderTask, toggleSelected } = renderRow(data, task, { canReorder: true });

    expect(screen.getByRole("button", { name: "Move Task up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Task down" })).toBeInTheDocument();

    rerender(<TaskRow data={data} task={task} completeTask={completeTask} deleteTask={deleteTask} editTask={editTask} moveTask={moveTask} reorderTask={reorderTask} presentation="compact" toggleSelected={toggleSelected} canReorder={false} />);

    expect(screen.queryByRole("button", { name: "Move Task up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move Task down" })).not.toBeInTheDocument();
  });

  it("applies the completion animation only when an open task becomes completed", () => {
    const data = createSeedData();
    const task = data.tasks[0];
    const completedStatus = data.statuses.find((status) => status.category === "completed")!;
    const { rerender, container, completeTask, deleteTask, editTask, moveTask, reorderTask, toggleSelected } = renderRow(data, task);

    expect(container.querySelector(".completion-button")).not.toHaveClass("completion-button--animate");
    expect(container.querySelector(".completion-button svg")).toBeNull();
    rerender(<TaskRow data={data} task={{ ...task, statusId: completedStatus.id }} completeTask={completeTask} deleteTask={deleteTask} editTask={editTask} moveTask={moveTask} reorderTask={reorderTask} presentation="compact" toggleSelected={toggleSelected} />);

    expect(container.querySelector(".completion-button")).toHaveClass("completion-button--animate");
    expect(container.querySelector(".completion-button svg")).not.toBeNull();
  });

  it("marks aggregate progress with the established Task icon", () => {
    const data = createSeedData();
    const task = { ...data.tasks[0], aggregate: true, childTaskIds: [] };
    const { container } = renderRow({ ...data, tasks: [task] }, task);

    expect(screen.getByText("No actionable Tasks")).toBeInTheDocument();
    expect(container.querySelector(".task-progress-meta .lucide-list-todo")).not.toBeNull();
  });

  it("keeps root tasks unindented while child tasks retain hierarchy depth", () => {
    const data = createSeedData();
    const parent = { ...data.tasks[0], parentTaskId: null };
    const child = { ...parent, id: `${parent.id}-child`, title: "Nested child", parentTaskId: parent.id, order: parent.order + 1 };
    const viewData = { ...data, tasks: [parent, child] };

    const { container } = render(
      <TaskHierarchy
        data={viewData}
        tasks={[parent]}
        completeTask={vi.fn()}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
        presentation="compact"
      />,
    );

    const root = container.querySelector('.task-node[aria-level="1"]') as HTMLElement;
    const nested = container.querySelector('.task-node[aria-level="2"]') as HTMLElement;
    expect(root).toHaveClass("task-node--root");
    expect(root.style.getPropertyValue("--tree-depth")).toBe("0");
    expect(nested.style.getPropertyValue("--tree-depth")).toBe("1");
  });

  it("keeps deferred Tasks collapsed behind a full-width disclosure", () => {
    const data = createSeedData();
    const task = { ...data.tasks[0], revealDate: "2099-01-01" };
    const { container } = render(
      <TaskSection
        title="Deferred"
        tone="deferred"
        data={{ ...data, tasks: [task] }}
        tasks={[task]}
        completeTask={vi.fn()}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
      />,
    );

    const disclosure = screen.getByRole("button", { name: "Deferred" });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(disclosure.querySelector(".lucide-chevron-down")).not.toBeNull();
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();

    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(task.title)).toBeInTheDocument();
    expect(container.querySelector(".task-row")).not.toHaveClass("is-deferred");
  });
});
