import { describe, expect, it } from "vitest";
import { createMeta, Project, Task, updateTaskRecord } from "../../domain";
import { PRIORITY_IDS, STATUS_IDS } from "../../seed";
import { ConflictError, LocalDevelopmentProvider } from "./persistence";

describe("canonical revision persistence contract", () => {
  it("accepts a write with the current revision and increments exactly once", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const next = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Revision confirmed" }, "titleChanged", "Revision confirmed");

    const saved = await provider.replace({ next, expectedRevision: current.canonicalRevision, operationId: "edit-1" });

    expect(saved.canonicalRevision).toBe(current.canonicalRevision + 1);
    expect((await provider.load()).canonicalRevision).toBe(saved.canonicalRevision);
  });

  it("rejects creation with a stale revision", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const task: Task = { ...createMeta("task"), kind: "task", title: "Stale create", description: "", statusId: STATUS_IDS.open, priorityId: PRIORITY_IDS.normal, scheduledDate: null, revealDate: null, location: { type: "inbox" }, parentTaskId: null, childTaskIds: [], order: 999, tagIds: [], quantifierSelections: {}, mustDoToday: false, aggregate: false, completedAt: null, cancelledAt: null, checklist: [] };
    const other: Project = { ...createMeta("project"), kind: "project", title: "Newer canonical project", description: "", color: "var(--colour-info)", icon: "folder", areaId: null, statusId: current.data.statuses[0].id, order: 999, completedAt: null, cancelledAt: null, archivedAt: null, taskPresentation: "compact", tagIds: [], quantifierSelections: {} };
    await provider.replace({ next: { ...current.data, projects: [...current.data.projects, other] }, expectedRevision: current.canonicalRevision, operationId: "other-device" });

    await expect(provider.replace({ next: { ...current.data, tasks: [...current.data.tasks, task] }, expectedRevision: current.canonicalRevision, operationId: "stale-create" })).rejects.toBeInstanceOf(ConflictError);
    const confirmed = await provider.load();
    expect(confirmed.data.tasks.some((candidate) => candidate.id === task.id)).toBe(false);
    expect(confirmed.data.projects.some((candidate) => candidate.id === other.id)).toBe(true);
  });

  it("rejects stale edits without modifying canonical data", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const stored = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Stored newer value" }, "titleChanged", "Stored newer value");
    await provider.replace({ next: stored, expectedRevision: current.canonicalRevision, operationId: "stored" });
    const stale = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Stale overwrite" }, "titleChanged", "Stale overwrite");

    await expect(provider.replace({ next: stale, expectedRevision: current.canonicalRevision, operationId: "stale-edit" })).rejects.toBeInstanceOf(ConflictError);
    const confirmed = await provider.load();
    expect(confirmed.data.tasks[0].title).toBe("Stored newer value");
    expect(confirmed.canonicalRevision).toBe(current.canonicalRevision + 1);
  });

  it("rejects a stale expected entity version without a partial write", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const task = current.data.tasks[0];
    const externallyChanged = updateTaskRecord(current.data, task.id, { title: "External entity change" }, "titleChanged", "External entity change");
    localStorage.setItem("todonut.dev.local-data", JSON.stringify(externallyChanged));
    const attempted = updateTaskRecord(current.data, task.id, { title: "Rejected entity change" }, "titleChanged", "Rejected entity change");

    await expect(provider.replace({ next: attempted, expectedRevision: current.canonicalRevision, operationId: "stale-version", expectedVersions: new Map([[task.id, task.version]]) })).rejects.toBeInstanceOf(ConflictError);

    const confirmed = await provider.load();
    expect(confirmed.data.tasks[0].title).toBe("External entity change");
    expect(confirmed.canonicalRevision).toBe(current.canonicalRevision);
  });

  it("returns the original atomic result when an operation ID is retried", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const next = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Idempotent save" }, "titleChanged", "Idempotent save");
    const request = { next, expectedRevision: current.canonicalRevision, operationId: "same-operation" };

    const first = await provider.replace(request);
    const retry = await provider.replace(request);

    expect(retry).toEqual(first);
    expect((await provider.load()).canonicalRevision).toBe(current.canonicalRevision + 1);
    expect((await provider.load()).data.tasks[0].title).toBe("Idempotent save");
  });

  it("reports zero recovery checkpoints", () => {
    const provider = new LocalDevelopmentProvider();
    expect(provider.diagnostics().details.checkpointCount).toBe(0);
  });
});
