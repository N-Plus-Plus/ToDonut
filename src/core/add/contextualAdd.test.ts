import { describe, expect, it } from "vitest";
import { AddContext, defaultAddCapabilities, resolveAddActions } from "./contextualAdd";

function context(overrides: Partial<AddContext> = {}): AddContext {
  return {
    destination: "today",
    capabilities: defaultAddCapabilities,
    ...overrides,
  };
}

describe("contextual Add resolver", () => {
  it("returns permanent actions in visual top-to-bottom order", () => {
    expect(resolveAddActions(context()).map((action) => action.id)).toEqual(["project", "list", "task"]);
  });

  it("appends open List Item after permanent actions", () => {
    expect(resolveAddActions(context({ destination: "lists", openListId: "ref_1" })).map((action) => action.id)).toEqual(["project", "list", "task", "listItem"]);
  });

  it("does not expose Child Task while parent-child launch UI is disabled", () => {
    expect(resolveAddActions(context({ destination: "projects", openProjectId: "project_1" })).map((action) => action.id)).toEqual(["project", "list", "task"]);
    expect(resolveAddActions(context({ activeParentTaskId: "task_1" })).map((action) => action.id)).toEqual(["project", "list", "task"]);
  });

  it("does not expose Section or unavailable future actions", () => {
    const ids = resolveAddActions(context({ destination: "projects" })).map((action) => action.id);
    expect(ids).not.toContain("section");
    expect(ids).not.toContain("area");
    expect(ids).not.toContain("schedule");
  });

  it("appends Area only on the Areas destination", () => {
    expect(resolveAddActions(context({ destination: "projects" })).map((action) => action.id)).toEqual(["project", "list", "task"]);
    expect(resolveAddActions(context({ destination: "areas" })).map((action) => action.id)).toEqual(["project", "list", "task", "area"]);
    expect(resolveAddActions(context({ destination: "areas", openAreaId: "area_1" })).map((action) => action.id)).toEqual(["project", "list", "task"]);
  });

  it("appends Status in Status settings", () => {
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "statuses" })).map((action) => action.id)).toEqual(["project", "list", "task", "status"]);
  });

  it("does not append a Priority creation action", () => {
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "priorities" })).map((action) => action.id)).toEqual(["project", "list", "task"]);
  });

  it("appends only the active Tag settings action", () => {
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "tags" })).map((action) => action.id)).toEqual(["project", "list", "task", "tag"]);
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "tagGroups" })).map((action) => action.id)).toEqual(["project", "list", "task", "tagGroup"]);
  });

  it("appends Schedule in Schedule settings closest to the FAB", () => {
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "recurrence" })).map((action) => action.id)).toEqual(["project", "list", "task", "schedule"]);
  });

  it("uses contextual order for multiple contextual actions", () => {
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "statuses", openListId: "ref_1" })).map((action) => action.id)).toEqual(["project", "list", "task", "listItem", "status"]);
  });

  it("hides dead actions when capability is unavailable", () => {
    expect(resolveAddActions(context({ destination: "settings", settingsSubsection: "statuses", capabilities: { ...defaultAddCapabilities, status: false } })).map((action) => action.id)).toEqual(["project", "list", "task"]);
  });

  it("hides the FAB while blocking overlays are active", () => {
    expect(resolveAddActions(context({ blockingOverlayOpen: true }))).toEqual([]);
  });

  it("changing context removes stale contextual actions for desktop and mobile hosts", () => {
    const listContext = context({ destination: "lists", openListId: "ref_1" });
    const todayContext = context({ destination: "today", openListId: null });
    expect(resolveAddActions(listContext).map((action) => action.id)).toContain("listItem");
    expect(resolveAddActions(todayContext).map((action) => action.id)).toEqual(["project", "list", "task"]);
    expect(resolveAddActions(todayContext)).toEqual(resolveAddActions(todayContext));
  });
});
