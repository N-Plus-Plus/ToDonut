import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppData, QUANTIFIER_IDS, Task, createMeta, updateTaskRecord } from "../domain";
import { STATUS_IDS, createSeedData } from "../seed";
import { buildTaskView, getViewPreference } from "../viewModel";
import { DEFAULT_TAG_SCOPES, ListRow, TASK_COMPLETION_EXIT_MS, TaskViewPanel, entityDetailBackAction, entityDetailBackTarget, rebaseAppData, settingsSubsectionShowsBack, withInAppBack } from "./App";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Tag editor defaults", () => {
  it("preselects Tasks and Projects but not Lists for a new Tag", () => {
    expect(DEFAULT_TAG_SCOPES).toEqual(["task", "project"]);
  });
});

describe("entity detail back navigation", () => {
  it("maps List, Project and Area details to their landing destinations", () => {
    expect(entityDetailBackTarget("list_1", null, null)).toEqual({ view: "lists", label: "Lists" });
    expect(entityDetailBackTarget(null, "project_1", null)).toEqual({ view: "projects", label: "Projects" });
    expect(entityDetailBackTarget(null, null, "area_1")).toEqual({ view: "areas", label: "Areas" });
    expect(entityDetailBackTarget(null, null, null)).toBeNull();
    expect(entityDetailBackAction(true, "lists")).toBe("history");
    expect(entityDetailBackAction(false, "projects")).toBe("projects");
    expect(withInAppBack({ view: "projects", projectId: "project_1" })).toEqual({ view: "projects", projectId: "project_1", todonutInAppBack: true });
  });
});

describe("Settings back navigation", () => {
  it("shows the shared back control on every subsection", () => {
    expect(settingsSubsectionShowsBack("home")).toBe(false);
    expect(["statuses", "priorities", "tags", "tagGroups", "quantifiers", "recurrence", "diagnostics"].every((section) => settingsSubsectionShowsBack(section as Parameters<typeof settingsSubsectionShowsBack>[0]))).toBe(true);
  });
});

describe("dormant Project colour presentation", () => {
  it("preserves Project colour data paths without exposing the editor or browser accent", () => {
    const appSource = readFileSync(resolve(root, "src/app/App.tsx"), "utf8");
    const styles = readFileSync(resolve(root, "src/styles.css"), "utf8");

    expect(appSource).not.toContain('label="Project colour"');
    expect(appSource).not.toContain('style={{ "--project-colour": project.color }');
    expect(appSource).toContain("color: projectColor");
    expect(styles).toContain(".project-row--colour-accent");
    expect(appSource).toContain('project-row project-row--colour-accent project-row--reorderable');
  });
});

function openTaskData(): { data: AppData; task: Task } {
  const seed = createSeedData();
  const task = {
    ...seed.tasks[0],
    statusId: STATUS_IDS.open,
    location: { type: "inbox" } as const,
    scheduledDate: null,
    revealDate: null,
    deletedAt: null,
  };
  return { data: { ...seed, tasks: [task] }, task };
}

function completedData(data: AppData, task: Task): AppData {
  return updateTaskRecord(
    data,
    task.id,
    { statusId: STATUS_IDS.completed, completedAt: "2026-07-16T00:00:00.000Z" },
    "completed",
    "Task completed",
  );
}

function taskTitleOrder(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".task-title")).map((node) => node.textContent ?? "");
}

function renderTaskPanel({
  data,
  showClosed = false,
  viewId = "inbox",
  completeTask = vi.fn(),
}: {
  data: AppData;
  showClosed?: boolean;
  viewId?: "today" | "inbox" | "upcoming";
  completeTask?: (task: Task) => void;
}) {
  const preference = { ...getViewPreference(data, viewId), showClosed, presentation: "compact" as const };
  const props = {
    data,
    viewId,
    result: buildTaskView(data, viewId, preference, "2026-07-16"),
    preference,
    filters: {},
    setFilters: vi.fn(),
    updatePreference: vi.fn(),
    activeTaskId: null,
    selectTask: vi.fn(),
    completeTask,
    deleteTask: vi.fn(),
    editTask: vi.fn(),
    moveTask: vi.fn(),
    reorderTask: vi.fn(),
    selectionMode: false,
    setSelectionMode: vi.fn(),
    selectedTaskIds: new Set<string>(),
    toggleSelected: vi.fn(),
    clearSelection: vi.fn(),
    runBulk: vi.fn(),
    openBulkMove: vi.fn(),
    selectedTasks: [],
  };
  return render(<TaskViewPanel {...props} />);
}

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("queued app mutation rebasing", () => {
  afterEach(() => cleanup());

  it("preserves two task updates calculated from the same base snapshot", () => {
    const seed = createSeedData();
    const taskA = { ...seed.tasks[0], id: "task_a", title: "First", statusId: STATUS_IDS.open };
    const taskB = { ...seed.tasks[0], id: "task_b", title: "Second", statusId: STATUS_IDS.open };
    const base = { ...seed, tasks: [taskA, taskB], activity: [] };
    const firstNext = updateTaskRecord(base, taskA.id, { statusId: STATUS_IDS.completed }, "completed", "First completed");
    const secondNext = updateTaskRecord(base, taskB.id, { statusId: STATUS_IDS.completed }, "completed", "Second completed");

    const rebased = rebaseAppData(base, secondNext, firstNext);

    expect(rebased.tasks.find((task) => task.id === taskA.id)?.statusId).toBe(STATUS_IDS.completed);
    expect(rebased.tasks.find((task) => task.id === taskB.id)?.statusId).toBe(STATUS_IDS.completed);
    expect(rebased.activity.map((event) => event.summary)).toEqual(["First completed", "Second completed"]);
  });
});

describe("Task completion exit animation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps a hidden completed task mounted for the completion animation duration", async () => {
    const { data, task } = openTaskData();
    const completeTask = vi.fn();
    const { rerender } = renderTaskPanel({ data, completeTask });

    fireEvent.click(screen.getByRole("button", { name: `Complete ${task.title}` }));
    expect(completeTask).toHaveBeenCalledWith(task);
    expect(screen.getByRole("button", { name: `Reopen ${task.title}` })).toHaveClass("completion-button--animate");

    const nextData = completedData(data, task);
    const preference = { ...getViewPreference(nextData, "inbox"), showClosed: false, presentation: "compact" as const };
    rerender(
      <TaskViewPanel
        data={nextData}
        viewId="inbox"
        result={buildTaskView(nextData, "inbox", preference, "2026-07-16")}
        preference={preference}
        filters={{}}
        setFilters={vi.fn()}
        updatePreference={vi.fn()}
        activeTaskId={null}
        selectTask={vi.fn()}
        completeTask={completeTask}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
        selectionMode={false}
        setSelectionMode={vi.fn()}
        selectedTaskIds={new Set<string>()}
        toggleSelected={vi.fn()}
        clearSelection={vi.fn()}
        runBulk={vi.fn()}
        openBulkMove={vi.fn()}
        selectedTasks={[]}
      />,
    );
    expect(screen.getByText(task.title)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TASK_COMPLETION_EXIT_MS - 1);
    });
    expect(screen.getByText(task.title)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  });

  it("does not delay removal for reduced motion users", () => {
    setReducedMotion(true);
    const { data, task } = openTaskData();
    const completeTask = vi.fn();
    renderTaskPanel({ data, completeTask });

    fireEvent.click(screen.getByRole("button", { name: `Complete ${task.title}` }));

    expect(completeTask).toHaveBeenCalledWith(task);
    expect(screen.getByRole("button", { name: `Complete ${task.title}` })).not.toHaveClass("completion-button--animate");
  });

  it("keeps the task visible as closed when Show Closed is on", () => {
    const { data, task } = openTaskData();
    const nextData = completedData(data, task);
    renderTaskPanel({ data: nextData, showClosed: true });

    expect(screen.getByText(task.title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Reopen ${task.title}` })).toBeInTheDocument();
  });

  it("keeps a completed Inbox task in its original sequence during the delay", () => {
    const { data, task } = openTaskData();
    const second = { ...task, ...createMeta("task"), title: "Second task", order: task.order + 1 };
    const source = { ...data, tasks: [task, second] };
    const completeTask = vi.fn();
    const { container, rerender } = renderTaskPanel({ data: source, completeTask });

    expect(taskTitleOrder(container)).toEqual([task.title, second.title]);
    fireEvent.click(screen.getByRole("button", { name: `Complete ${task.title}` }));
    const nextData = completedData(source, task);
    const preference = { ...getViewPreference(nextData, "inbox"), showClosed: false, presentation: "compact" as const };
    rerender(
      <TaskViewPanel
        data={nextData}
        viewId="inbox"
        result={buildTaskView(nextData, "inbox", preference, "2026-07-16")}
        preference={preference}
        filters={{}}
        setFilters={vi.fn()}
        updatePreference={vi.fn()}
        activeTaskId={null}
        selectTask={vi.fn()}
        completeTask={completeTask}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
        selectionMode={false}
        setSelectionMode={vi.fn()}
        selectedTaskIds={new Set<string>()}
        toggleSelected={vi.fn()}
        clearSelection={vi.fn()}
        runBulk={vi.fn()}
        openBulkMove={vi.fn()}
        selectedTasks={[]}
      />,
    );

    expect(taskTitleOrder(container)).toEqual([task.title, second.title]);
  });

  it("does not move a checked task to the Closed section until the delay has ended", () => {
    const { data, task } = openTaskData();
    const second = { ...task, ...createMeta("task"), title: "Second task", order: task.order + 1 };
    const source = { ...data, tasks: [task, second] };
    const completeTask = vi.fn();
    const { container, rerender } = renderTaskPanel({ data: source, showClosed: true, completeTask });

    fireEvent.click(screen.getByRole("button", { name: `Complete ${task.title}` }));
    const nextData = completedData(source, task);
    const preference = { ...getViewPreference(nextData, "inbox"), showClosed: true, presentation: "compact" as const };
    rerender(
      <TaskViewPanel
        data={nextData}
        viewId="inbox"
        result={buildTaskView(nextData, "inbox", preference, "2026-07-16")}
        preference={preference}
        filters={{}}
        setFilters={vi.fn()}
        updatePreference={vi.fn()}
        activeTaskId={null}
        selectTask={vi.fn()}
        completeTask={completeTask}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
        selectionMode={false}
        setSelectionMode={vi.fn()}
        selectedTaskIds={new Set<string>()}
        toggleSelected={vi.fn()}
        clearSelection={vi.fn()}
        runBulk={vi.fn()}
        openBulkMove={vi.fn()}
        selectedTasks={[]}
      />,
    );

    expect(taskTitleOrder(container)).toEqual([task.title, second.title]);
    expect(container.querySelector(".task-section--closed")).toBeNull();
  });

  it("clears temporary exit state when the mutation is discarded or fails back to open", async () => {
    const { data, task } = openTaskData();
    const completeTask = vi.fn();
    const { rerender } = renderTaskPanel({ data, completeTask });

    fireEvent.click(screen.getByRole("button", { name: `Complete ${task.title}` }));
    const restored = {
      ...data,
      tasks: [{ ...task, version: task.version + 1 }],
    };
    const preference = { ...getViewPreference(restored, "inbox"), showClosed: false, presentation: "compact" as const };
    rerender(
      <TaskViewPanel
        data={restored}
        viewId="inbox"
        result={buildTaskView(restored, "inbox", preference, "2026-07-16")}
        preference={preference}
        filters={{}}
        setFilters={vi.fn()}
        updatePreference={vi.fn()}
        activeTaskId={null}
        selectTask={vi.fn()}
        completeTask={completeTask}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
        selectionMode={false}
        setSelectionMode={vi.fn()}
        selectedTaskIds={new Set<string>()}
        toggleSelected={vi.fn()}
        clearSelection={vi.fn()}
        runBulk={vi.fn()}
        openBulkMove={vi.fn()}
        selectedTasks={[]}
      />,
    );

    await act(async () => {});
    expect(screen.getByRole("button", { name: `Complete ${task.title}` })).not.toHaveClass("completion-button--animate");
  });

  it("clears temporary exit state on route change", async () => {
    const { data, task } = openTaskData();
    const completeTask = vi.fn();
    const { rerender } = renderTaskPanel({ data, completeTask, viewId: "inbox" });

    fireEvent.click(screen.getByRole("button", { name: `Complete ${task.title}` }));
    const preference = { ...getViewPreference(data, "upcoming"), showClosed: false, presentation: "compact" as const };
    rerender(
      <TaskViewPanel
        data={data}
        viewId="upcoming"
        result={buildTaskView(data, "upcoming", preference, "2026-07-16")}
        preference={preference}
        filters={{}}
        setFilters={vi.fn()}
        updatePreference={vi.fn()}
        activeTaskId={null}
        selectTask={vi.fn()}
        completeTask={completeTask}
        deleteTask={vi.fn()}
        editTask={vi.fn()}
        moveTask={vi.fn()}
        reorderTask={vi.fn()}
        selectionMode={false}
        setSelectionMode={vi.fn()}
        selectedTaskIds={new Set<string>()}
        toggleSelected={vi.fn()}
        clearSelection={vi.fn()}
        runBulk={vi.fn()}
        openBulkMove={vi.fn()}
        selectedTasks={[]}
      />,
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  });
});

describe("Reference List row layout", () => {
  afterEach(() => cleanup());

  it("renders handle, text block and one right-aligned action group in order", () => {
    const data = createSeedData();
    const list = { ...data.referenceLists[0], quantifierSelections: { [QUANTIFIER_IDS.energy]: "energy_1", [QUANTIFIER_IDS.context]: "context_6" } };
    const { container } = render(
      <ListRow
        data={data}
        list={list}
        visibleIds={[list.id]}
        onClick={vi.fn()}
        reorderList={vi.fn()}
        editList={vi.fn()}
        archiveList={vi.fn()}
        deleteList={vi.fn()}
      />,
    );

    const row = container.querySelector(".reference-list-row")!;
    expect(row.children[0]).toHaveAttribute("aria-label", `Reorder ${list.title}`);
    expect(row.children[1]).toHaveClass("list-row-action__main");
    expect(row.children[1].querySelector(".reference-list-row__title")).toHaveTextContent(list.title);
    expect(row.children[1].querySelector(".reference-list-row__title")).toHaveStyle({ color: list.color! });
    expect(row.children[1].querySelector(".reference-list-row__location")).toHaveTextContent(`${data.areas[0].title}, ${data.projects[0].title}, Relaxed, Relationship`);
    expect(row.children[1].querySelector(".lucide-land-plot")).not.toBeNull();
    expect(row.children[1].querySelector(".lucide-folder-kanban")).not.toBeNull();
    expect(row.children[1].querySelector(".lucide-zap")).not.toBeNull();
    expect(row.children[1].querySelector(".lucide-component")).not.toBeNull();
    expect(row.children[2]).toHaveClass("reference-list-row__actions");
    expect(row.children[2].querySelectorAll(".icon-button")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: `Move ${list.title} up` })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Move ${list.title} down` })).not.toBeInTheDocument();
  });

  it("keeps actions accessible, destructive delete styled, and action clicks out of row open", () => {
    const data = createSeedData();
    const list = data.referenceLists[0];
    const open = vi.fn();
    const edit = vi.fn();
    const archive = vi.fn();
    const remove = vi.fn();
    render(
      <ListRow
        data={data}
        list={list}
        visibleIds={[list.id]}
        onClick={open}
        reorderList={vi.fn()}
        editList={edit}
        archiveList={archive}
        deleteList={remove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: `Edit ${list.title}` }));
    fireEvent.click(screen.getByRole("button", { name: `Archive ${list.title}` }));
    fireEvent.click(screen.getByRole("button", { name: `Move ${list.title} to Trash` }));

    expect(edit).toHaveBeenCalledOnce();
    expect(archive).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: `Move ${list.title} to Trash` })).toHaveClass("danger");
    expect(screen.getByRole("button", { name: `Edit ${list.title}` })).toHaveAttribute("title", "Edit");
    expect(screen.getByRole("button", { name: `Archive ${list.title}` })).toHaveAttribute("title", "Archive");
    expect(screen.getByRole("button", { name: `Move ${list.title} to Trash` })).toHaveAttribute("title", "Move to Trash");

    fireEvent.click(screen.getByRole("button", { name: `Open ${list.title}` }));
    expect(open).toHaveBeenCalledOnce();
  });

  it("uses the shared ListRow in the browser and Project/Area detail list sections", () => {
    const appSource = readFileSync(resolve(root, "src/app/App.tsx"), "utf8");
    expect(appSource.match(/<ListRow/g)).toHaveLength(3);
    expect(appSource).toContain("function ListBrowser");
    expect(appSource).toContain("function ProjectDetail");
    expect(appSource).toContain("function AreaDetail");
  });
});
