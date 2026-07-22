import { describe, expect, it } from "vitest";
import { createSeedData, STATUS_IDS } from "./seed";
import { AppData, createStatusCommand, defaultStatusId, deleteStatusCommand, migrateAppData, restoreStatusCommand, updateStatusCommand, reorderStatusCommand, reorderStatusRelativeCommand } from "./domain";

describe("Status commands", () => {
  it("validates required name and creates through the shared command", () => {
    const data = createSeedData();
    expect(() => createStatusCommand(data, { name: " ", color: "var(--colour-info)", icon: "circle-plus", category: "active" })).toThrow(/required/);
    const next = createStatusCommand(data, { name: "Next", color: "var(--colour-info)", icon: "circle-plus", category: "active" });
    expect(next.statuses.some((status) => status.name === "Next" && !status.deletedAt)).toBe(true);
    expect(next.activity.at(-1)?.summary).toMatch(/Status created/);
  });

  it("edits while preserving the stable Status ID and default validity", () => {
    const data = createSeedData();
    const next = updateStatusCommand(data, STATUS_IDS.open, { name: "Ready", color: "var(--palette-aqua-dark)", icon: "circle-minus", category: "active", makeDefault: true });
    const edited = next.statuses.find((status) => status.id === STATUS_IDS.open)!;
    expect(edited.name).toBe("Ready");
    expect(edited.id).toBe(STATUS_IDS.open);
    expect(defaultStatusId(next)).toBe(STATUS_IDS.open);
  });

  it("prevents deleting the final non-deleted Status", () => {
    const data = createSeedData();
    const only = { ...data, statuses: data.statuses.map((status) => status.id === STATUS_IDS.open ? status : { ...status, deletedAt: "2026-07-01T00:00:00.000Z" }) };
    expect(() => deleteStatusCommand(only, STATUS_IDS.open)).toThrow(/final remaining/);
  });

  it("deletes unused Statuses without requiring Task migration", () => {
    const data = createStatusCommand(createSeedData(), { name: "Unused", color: "var(--colour-info)", icon: "circle-plus", category: "active" });
    const unused = data.statuses.find((status) => status.name === "Unused")!;
    const next = deleteStatusCommand(data, unused.id);
    expect(next.statuses.find((status) => status.id === unused.id)?.deletedAt).toBeTruthy();
    expect(next.tasks.some((task) => task.statusId === unused.id)).toBe(false);
  });

  it("requires a replacement for used Statuses and migrates all matching Tasks including deleted Tasks", () => {
    const data = createSeedData();
    const deletedTask = { ...data.tasks[0], id: "task_deleted", deletedAt: "2026-07-01T00:00:00.000Z" };
    const withDeleted = { ...data, tasks: [...data.tasks, deletedTask] };
    expect(() => deleteStatusCommand(withDeleted, STATUS_IDS.open)).toThrow(/replacement/);
    const next = deleteStatusCommand(withDeleted, STATUS_IDS.open, STATUS_IDS.inProgress);
    expect(next.tasks.filter((task) => [data.tasks[0].id, deletedTask.id].includes(task.id)).every((task) => task.statusId === STATUS_IDS.inProgress)).toBe(true);
    expect(next.activity.some((event) => event.type === "statusMigration" && event.entityId === STATUS_IDS.open)).toBe(true);
    expect(data.tasks.every((task) => task.statusId === STATUS_IDS.open)).toBe(true);
  });

  it("reassigns default Status on default deletion", () => {
    const data = createSeedData();
    const next = deleteStatusCommand(data, STATUS_IDS.open, STATUS_IDS.inProgress);
    expect(defaultStatusId(next)).toBe(STATUS_IDS.inProgress);
  });

  it("enforces required semantic Status categories", () => {
    const data = createSeedData();
    expect(() => deleteStatusCommand(data, STATUS_IDS.completed)).toThrow(/Completed Status/);
    const cancelled = data.statuses.find((status) => status.id === STATUS_IDS.cancelled)!;
    expect(() => updateStatusCommand(data, STATUS_IDS.cancelled, { name: "Dropped", color: cancelled.color, icon: cancelled.icon, category: "active" })).toThrow(/Cancelled Status/);
  });

  it("reorders and restores Statuses with history", () => {
    const data = createSeedData();
    const reordered = reorderStatusCommand(data, STATUS_IDS.inProgress, -1);
    expect(reordered.statuses.find((status) => status.id === STATUS_IDS.inProgress)?.order).toBe(1);
    const deleted = deleteStatusCommand(reordered, STATUS_IDS.waiting);
    const restored = restoreStatusCommand(deleted, STATUS_IDS.waiting);
    expect(restored.statuses.find((status) => status.id === STATUS_IDS.waiting)?.deletedAt).toBeNull();
    expect(restored.activity.at(-1)?.type).toBe("restored");
  });

  it("moves a dragged Status to the requested target position", () => {
    const data = createSeedData();
    const moved = reorderStatusRelativeCommand(data, STATUS_IDS.cancelled, STATUS_IDS.inProgress, "before");
    expect(moved.statuses.filter((status) => !status.deletedAt).sort((a, b) => a.order - b.order).map((status) => status.id)).toEqual([
      STATUS_IDS.open,
      STATUS_IDS.cancelled,
      STATUS_IDS.inProgress,
      STATUS_IDS.waiting,
      STATUS_IDS.blocked,
      STATUS_IDS.completed,
    ]);
    expect(moved.activity.at(-1)?.type).toBe("orderChanged");
  });

  it("rejects restoring a deleted duplicate Status safely", () => {
    const data = createStatusCommand(createSeedData(), { name: "Duplicate", color: "var(--colour-info)", icon: "circle-plus", category: "active" });
    const duplicate = data.statuses.find((status) => status.name === "Duplicate")!;
    const deleted = deleteStatusCommand(data, duplicate.id);
    const conflicting = updateStatusCommand(deleted, STATUS_IDS.waiting, { name: "Duplicate", color: "var(--colour-info)", icon: "circle-plus", category: "active" });
    expect(() => restoreStatusCommand(conflicting, duplicate.id)).toThrow(/already uses/);
  });

  it("requires unique colours and icons and migrates Projects with a deleted Status", () => {
    const data = createSeedData();
    const open = data.statuses.find((status) => status.id === STATUS_IDS.open)!;
    expect(() => createStatusCommand(data, { name: "Duplicate colour", color: open.color, icon: "circle-plus", category: "active" })).toThrow(/colour is already in use/);
    expect(() => createStatusCommand(data, { name: "Duplicate icon", color: "var(--colour-info)", icon: open.icon, category: "active" })).toThrow(/icon is already in use/);

    const migrated = deleteStatusCommand(data, STATUS_IDS.open, STATUS_IDS.inProgress);
    expect(migrated.projects[0].statusId).toBe(STATUS_IDS.inProgress);
    expect(migrated.projects[0].completedAt).toBeNull();
  });

  it("maps legacy Project lifecycle timestamps to shared Status IDs", () => {
    const data = createSeedData();
    const legacyProject = { ...data.projects[0], statusId: undefined, completedAt: "2026-07-01T00:00:00.000Z" };
    const migrated = migrateAppData({ ...data, projects: [legacyProject] } as unknown as Partial<AppData>);
    expect(migrated.statuses.find((status) => status.id === migrated.projects[0].statusId)?.category).toBe("completed");
  });
});
