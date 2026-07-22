import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppData } from "../../../domain";
import { QUANTIFIER_IDS } from "../../../domain";
import { createSeedData } from "../../../seed";
import { TaskEditor, datePickerOverlayPosition } from "./TaskEditor";

function renderEditor(data: AppData = createSeedData()) {
  const commit = vi.fn(async () => undefined);
  render(<TaskEditor data={data} mode={{ type: "create", defaults: { location: { type: "inbox" }, scheduledDate: null } }} onClose={vi.fn()} commit={commit} />);
  return { commit };
}

function renderEditEditor(data: AppData = createSeedData()) {
  const commit = vi.fn(async () => undefined);
  const task = data.tasks.find((candidate) => !candidate.deletedAt)!;
  render(<TaskEditor data={data} mode={{ type: "edit", taskId: task.id }} onClose={vi.fn()} commit={commit} />);
  return { commit, task };
}

describe("TaskEditor", () => {
  afterEach(() => cleanup());

  it("opens minimal-first with Details collapsed and creates a title-only Task", async () => {
    const { commit } = renderEditor();

    expect(screen.getByLabelText(/Task title/i)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Task title/i), { target: { value: "Only a title" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));

    await waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
    const calls = commit.mock.calls as unknown as Array<[AppData, string[] | undefined, string | undefined]>;
    const next = calls[0][0];
    const created = next.tasks.at(-1)!;
    expect(created.title).toBe("Only a title");
    expect(created.location).toEqual({ type: "inbox" });
    expect(created.scheduledDate).toBeNull();
    expect(created.revealDate).toBeNull();
    expect(created.tagIds).toEqual([]);
    expect(created.checklist).toEqual([]);
  });

  it("ignores supplied parent defaults while parent-child launch UI is disabled", async () => {
    const data = createSeedData();
    const parent = data.tasks[0];
    const commit = vi.fn(async () => undefined);
    render(<TaskEditor data={data} mode={{ type: "create", defaults: { location: parent.location, parentTaskId: parent.id, scheduledDate: null } }} onClose={vi.fn()} commit={commit} />);
    fireEvent.change(screen.getByLabelText(/Task title/i), { target: { value: "Child capture" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));
    await waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
    const calls = commit.mock.calls as unknown as Array<[AppData, string[] | undefined, string | undefined]>;
    const created = calls[0][0].tasks.at(-1)!;
    expect(created.parentTaskId).toBeNull();
    expect(created.location).toEqual(parent.location);
  });

  it("shows exact tabs on expansion and presents only the selected tab", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    const tablist = screen.getByRole("tablist", { name: /Task details/i });
    expect(within(tablist).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Basics", "More", "Checklist"]);
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Due Date/i)).toBeInTheDocument();
    expect(screen.queryByText(/Reveal On/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "More" }));
    expect(screen.getByText("Reveal On")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Must Do Today/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Parent")).not.toBeInTheDocument();
    const areaField = screen.getByText("Area/s").closest(".form-row")!;
    const projectField = screen.getByText("Project").closest(".form-row")!;
    expect(areaField.compareDocumentPosition(projectField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: /Inbox/i })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText(/Status/i)).not.toBeInTheDocument();
  });

  it("portals the Area dropdown outside the modal overflow boundary", () => {
    const data = createSeedData();
    const area = data.areas.find((candidate) => candidate.title === "Personal Systems")!;
    renderEditor(data);
    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    fireEvent.click(screen.getByRole("tab", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Inbox" }));

    const areaCheckbox = screen.getByRole("checkbox", { name: "Personal Systems" });
    const menu = areaCheckbox.closest(".area-dropdown__menu");
    expect(menu).not.toBeNull();
    expect(menu?.parentElement).toBe(document.body);
    expect(menu).toHaveClass("anchored-dropdown");
    expect(areaCheckbox.querySelector(".lucide-circle")).not.toBeNull();
    fireEvent.click(areaCheckbox);
    expect(areaCheckbox.querySelector(".lucide-circle-check")).not.toBeNull();
    expect(areaCheckbox.querySelector(".circle-checkbox__icon")).toHaveStyle({ color: area.color });
  });

  it("renders shared disclosure headings uppercase without uppercasing ordinary labels", () => {
    renderEditor();

    const details = screen.getByRole("button", { name: "DETAILS" });
    expect(details).toHaveClass("disclosure-heading");
    fireEvent.click(details);

    expect(screen.getByLabelText("Task title")).toBeInTheDocument();
    expect(screen.getByText("Due Date")).toBeInTheDocument();
  });

  it("shows History as an edit-only Details tab and mounts history only when selected", () => {
    renderEditEditor();

    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    const tablist = screen.getByRole("tablist", { name: /Task details/i });
    expect(within(tablist).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Basics", "More", "Checklist", "History"]);
    expect(screen.queryByText("No recorded changes.")).not.toBeInTheDocument();
    expect(screen.queryByText("Seed task created")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText("Seed task created")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Basics" }));
    expect(screen.queryByText("Seed task created")).not.toBeInTheDocument();
  });

  it("prefills an empty Due Date with the Sydney local date only on focus", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    const dueDate = screen.getAllByLabelText(/Due Date/i).find((element) => element.tagName === "INPUT")!;
    expect(dueDate).toHaveValue("");

    fireEvent.focus(dueDate);
    expect(dueDate).not.toHaveValue("");
  });

  it("does not expose Must Do Today and saves the disabled property as false", async () => {
    const { commit } = renderEditor();
    fireEvent.change(screen.getByLabelText(/Task title/i), { target: { value: "Flagged" } });
    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    fireEvent.click(screen.getByRole("tab", { name: "More" }));
    expect(screen.queryByRole("checkbox", { name: /Must Do Today/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));
    await waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
    const calls = commit.mock.calls as unknown as Array<[AppData]>;
    expect(calls[0][0].tasks.at(-1)?.mustDoToday).toBe(false);
  });

  it("resolves an exact typed Project title without requiring a suggestion click", async () => {
    const data = createSeedData();
    const project = data.projects.find((candidate) => !candidate.deletedAt && !candidate.archivedAt && !candidate.completedAt)!;
    const { commit } = renderEditor(data);

    fireEvent.change(screen.getByLabelText(/Task title/i), { target: { value: "Typed placement" } });
    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    fireEvent.click(screen.getByRole("tab", { name: "More" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Project" }), { target: { value: `  ${project.title.toUpperCase()}  ` } });
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));

    await waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
    const calls = commit.mock.calls as unknown as Array<[AppData]>;
    expect(calls[0][0].tasks.at(-1)?.location).toEqual({ type: "project", projectId: project.id });
  });

  it("saves Energy and Context as first-class Task quantifiers", async () => {
    const { commit } = renderEditor();
    fireEvent.change(screen.getByLabelText(/Task title/i), { target: { value: "Quantified task" } });
    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    fireEvent.change(screen.getByLabelText("Energy"), { target: { value: "energy_5" } });
    fireEvent.change(screen.getByLabelText("Context"), { target: { value: "context_2" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Task/i }));
    await waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
    const calls = commit.mock.calls as unknown as Array<[AppData]>;
    expect(calls[0][0].tasks.at(-1)?.quantifierSelections).toEqual({ [QUANTIFIER_IDS.energy]: "energy_5", [QUANTIFIER_IDS.context]: "context_2" });
  });

  it("preserves draft values across tab switches and Details collapse", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Saved in draft" } });
    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    expect(screen.queryByLabelText(/Description/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Details/i }));

    expect(screen.getByLabelText(/Description/i)).toHaveValue("Saved in draft");
  });

  it("supports checklist add, check and reorder draft interactions", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Details/i }));
    fireEvent.click(screen.getByRole("tab", { name: "Checklist" }));
    const input = screen.getByLabelText("Checklist item text");
    fireEvent.change(input, { target: { value: "First item" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));
    fireEvent.change(input, { target: { value: "Second item" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

    fireEvent.click(screen.getByRole("checkbox", { name: /Check First item/i }));
    expect(screen.getByText("First item")).toHaveClass("checked");
    expect(screen.queryByRole("button", { name: /^Move Down$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Move Up$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move First item down" }));
    expect(screen.getAllByText(/item$/).map((node) => node.textContent)).toEqual(["Second item", "First item"]);
  });

  it("shows existing checklist items below the title in edit mode without edit controls", () => {
    const data = createSeedData();
    const task = data.tasks.find((candidate) => !candidate.deletedAt)!;
    const fixture: AppData = {
      ...data,
      tasks: data.tasks.map((candidate) => candidate.id === task.id ? {
        ...candidate,
        checklist: [
          { id: "check_1", text: "Unchecked item", checked: false, order: 1, createdAt: candidate.createdAt, updatedAt: candidate.updatedAt },
          { id: "check_2", text: "Checked item", checked: true, order: 2, createdAt: candidate.createdAt, updatedAt: candidate.updatedAt },
        ],
      } : candidate),
    };
    renderEditEditor(fixture);

    const preview = screen.getByRole("list", { name: "Checklist items" });
    expect(within(preview).getByText("Unchecked item")).not.toHaveClass("checked");
    expect(within(preview).getByText("Checked item").closest("li")).toHaveClass("checked");
    expect(preview.compareDocumentPosition(screen.getByRole("button", { name: "DETAILS" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Delete Checked item/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Move Checked item down/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "DETAILS" }));
    fireEvent.click(screen.getByRole("tab", { name: "Checklist" }));
    expect(screen.getByRole("button", { name: /Delete Checked item/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Move Unchecked item down/i })).toBeInTheDocument();
  });
});

describe("date picker overlay positioning", () => {
  it("clamps a picker above the trigger to the visible top edge", () => {
    expect(datePickerOverlayPosition(
      { top: 470, right: 1320, bottom: 510 },
      { width: 352, height: 520 },
      { width: 1750, height: 982 },
    )).toEqual({ top: 6, left: 968 });
  });

  it("clamps horizontal placement and keeps a fitting picker below its trigger", () => {
    expect(datePickerOverlayPosition(
      { top: 40, right: 80, bottom: 80 },
      { width: 352, height: 300 },
      { width: 390, height: 700 },
    )).toEqual({ top: 86, left: 6 });
  });
});
