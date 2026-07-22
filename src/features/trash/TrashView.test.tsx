import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmationProvider } from "../../core/dialogs/confirmation";
import { AppData } from "../../domain";
import { createSeedData } from "../../seed";
import { TrashView } from "./TrashView";

describe("TrashView", () => {
  afterEach(() => cleanup());

  it("defaults to Deleted with Projects, Tasks and Lists tabs", () => {
    renderTrash(createSeedData(), vi.fn());
    expect(screen.getByRole("button", { name: "Showing Deleted items" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Projects" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tasks" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lists" })).toBeTruthy();
  });

  it("switches from Deleted Tasks to Archived while keeping one entity tab row", () => {
    renderTrash(createSeedData(), vi.fn());
    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
    fireEvent.click(screen.getByRole("button", { name: "Showing Deleted items" }));
    expect(screen.getByRole("button", { name: "Tasks" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("No archived Tasks.")).toBeTruthy();
  });

  it("sorts deleted and archived records newest first and excludes List Items and Statuses", () => {
    const data = createSeedData();
    const deletedOlder = { ...data.projects[0], id: "old_project", title: "Old deleted", deletedAt: "2026-07-01T01:00:00.000Z" };
    const deletedNewer = { ...data.projects[0], id: "new_project", title: "New deleted", deletedAt: "2026-07-01T03:00:00.000Z" };
    const archivedOlder = { ...data.referenceLists[0], id: "old_list", title: "Old archived", archivedAt: "2026-07-01T01:00:00.000Z" };
    const archivedNewer = { ...data.referenceLists[0], id: "new_list", title: "New archived", archivedAt: "2026-07-01T04:00:00.000Z" };
    const fixture = {
      ...data,
      projects: [...data.projects, deletedOlder, deletedNewer],
      referenceLists: [...data.referenceLists, archivedOlder, archivedNewer],
      referenceListEntries: [{ id: "deleted_entry", kind: "referenceListEntry" as const, text: "Deleted item", referenceListId: data.referenceLists[0].id, link: null, orderKey: "00000001", tagIds: [], createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z", version: 1, deletedAt: "2026-07-01T05:00:00.000Z" }],
      statuses: [{ ...data.statuses[0], id: "deleted_status", name: "Deleted Status", deletedAt: "2026-07-01T05:00:00.000Z" }, ...data.statuses],
    };
    renderTrash(fixture, vi.fn());
    expect(screen.getByText("New deleted").compareDocumentPosition(screen.getByText("Old deleted")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Showing Deleted items" }));
    fireEvent.click(screen.getByRole("button", { name: "Lists" }));
    expect(screen.getByText("New archived").compareDocumentPosition(screen.getByText("Old archived")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText("Deleted item")).toBeNull();
    expect(screen.queryByText("Deleted Status")).toBeNull();
  });

  it("shows Purge only for Deleted records and commits hard deletion after confirmation", () => {
    const data = createSeedData();
    const deletedProject = { ...data.projects[0], id: "deleted_project", title: "Deleted Project", deletedAt: "2026-07-01T01:00:00.000Z" };
    const fixture = { ...data, projects: [...data.projects, deletedProject] };
    const commit = vi.fn();
    renderTrash(fixture, commit);
    fireEvent.click(screen.getByRole("button", { name: "Purge" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Purge" }));
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({ projects: expect.not.arrayContaining([expect.objectContaining({ id: "deleted_project" })]) }), ["deleted_project"], "Purged");
  });

  it("shows Delete, not Purge, for Archived records and demotes them to Deleted", () => {
    const data = createSeedData();
    const archivedList = { ...data.referenceLists[0], id: "archived_list", title: "Archived List", archivedAt: "2026-07-01T01:00:00.000Z" };
    const fixture = { ...data, referenceLists: [...data.referenceLists, archivedList] };
    const commit = vi.fn();
    renderTrash(fixture, commit);
    fireEvent.click(screen.getByRole("button", { name: "Showing Deleted items" }));
    fireEvent.click(screen.getByRole("button", { name: "Lists" }));
    expect(screen.queryByRole("button", { name: "Purge" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({ referenceLists: expect.arrayContaining([expect.objectContaining({ id: "archived_list", archivedAt: null, deletedAt: expect.any(String) })]) }), ["archived_list"], "Moved to Deleted");
  });
});

function renderTrash(data: AppData, commit: ReturnType<typeof vi.fn>) {
  return render(<ConfirmationProvider><TrashView data={data} commit={commit} /></ConfirmationProvider>);
}
