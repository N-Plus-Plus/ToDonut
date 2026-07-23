import { beforeEach, describe, expect, it } from "vitest";
import { AppData, addReferenceEntries, aggregateCompletionImpact, aggregateProgress, applyMutuallyExclusiveTags, closeSatisfiedAggregates, completeAggregate, convertToAggregate, createExportEnvelope, createMeta, createReferenceEntry, entryPartsWithUrls, generateDueRecurrences, migrateAppData, moveTaskSubtreeCommand, reorderReferenceEntries, reorderReferenceEntry, reorderTaskSiblingCommand, reopenTaskCommand, restoreEntity, saveTaskCommand, softDeleteEntity, updateReferenceEntry, updateTaskRecord } from "./domain";
import { ConflictError, LocalDevelopmentProvider } from "./persistence";
import { PRIORITY_IDS, STATUS_IDS, createSeedData } from "./seed";
import { optimisticMutation } from "./optimistic";
import { activeTasks, filterTasks, groupTasks, sortTasks } from "./viewModel";
import { exportExcludesSecrets, redactRecoveryCodes, sanitiseDiagnostics, shouldLockOut, trustedSessionState } from "./security";
import { assertExportSafe, exportSafety } from "./exportSafety";
import { buildInfo } from "./buildInfo";
import { mobileDock } from "./app/navigation/navigationRegistry";
import packageJson from "../package.json";

const firstTask = (data: AppData) => data.tasks[0];

describe("domain foundations", () => {
  beforeEach(() => localStorage.clear());

  it("rejects stale-version updates", async () => {
    const provider = new LocalDevelopmentProvider();
    const snapshot = await provider.load();
    const data = snapshot.data;
    const task = firstTask(data);
    await provider.replace({ next: updateTaskRecord(data, task.id, { title: "First save" }, "titleChanged", "First save"), expectedRevision: snapshot.canonicalRevision, operationId: "first-save", expectedVersions: new Map([[task.id, task.version]]) });
    await expect(provider.replace({ next: updateTaskRecord(data, task.id, { title: "Stale save" }, "titleChanged", "Stale save"), expectedRevision: snapshot.canonicalRevision, operationId: "stale-save", expectedVersions: new Map([[task.id, task.version]]) })).rejects.toBeInstanceOf(ConflictError);
  });

  it("soft deletes and restores records without permanent deletion", () => {
    const data = createSeedData();
    const task = firstTask(data);
    const deleted = softDeleteEntity(data, "task", task.id);
    expect(deleted.tasks.find((item) => item.id === task.id)?.deletedAt).toBeTruthy();
    const restored = restoreEntity(deleted, "task", task.id);
    expect(restored.tasks.find((item) => item.id === task.id)?.deletedAt).toBeNull();
  });

  it("enforces mutually exclusive tag selection within a tag group", () => {
    const data = createSeedData();
    const [first, second] = data.tags;
    expect(applyMutuallyExclusiveTags(data, applyMutuallyExclusiveTags(data, [], first.id, "task"), second.id, "task")).toEqual([second.id]);
  });

  it("converts a task into an aggregate parent when it receives children", () => {
    const data = createSeedData();
    const aggregate = convertToAggregate(data, firstTask(data).id).tasks[0];
    expect(aggregate.aggregate).toBe(true);
    expect(aggregate.description).toBe("");
    expect(aggregate.scheduledDate).toBeNull();
  });

  it("automatically closes aggregate parents when all actionable descendants are closed", () => {
    const data = createSeedData();
    const parent = firstTask(data);
    const child = { ...parent, ...createMeta("task"), title: "Child", parentTaskId: parent.id, childTaskIds: [], aggregate: false, statusId: STATUS_IDS.completed };
    const withChild: AppData = { ...data, tasks: data.tasks.map((task) => task.id === parent.id ? { ...task, aggregate: true, childTaskIds: [child.id] } : task).concat(child) };
    const closed = closeSatisfiedAggregates(withChild, STATUS_IDS.completed, STATUS_IDS.cancelled);
    expect(closed.tasks.find((task) => task.id === parent.id)?.statusId).toBe(STATUS_IDS.completed);
    expect(aggregateProgress(closed, parent.id)).toMatchObject({ total: 1, completed: 1, open: 0 });
  });

  it("completes aggregate descendants in one logical operation", () => {
    const data = createSeedData();
    const parent = firstTask(data);
    const child = { ...parent, ...createMeta("task"), title: "Child", parentTaskId: parent.id, childTaskIds: [], aggregate: false };
    const withChild: AppData = { ...data, tasks: data.tasks.map((task) => task.id === parent.id ? { ...task, aggregate: true, childTaskIds: [child.id] } : task).concat(child) };
    const completed = completeAggregate(withChild, parent.id, STATUS_IDS.completed);
    expect(completed.tasks.find((task) => task.id === child.id)?.statusId).toBe(STATUS_IDS.completed);
  });

  it("records concise checklist events for one confirmed save", () => {
    const data = createSeedData();
    const task = { ...firstTask(data), checklist: [
      { id: "check_a", text: "A", checked: false, order: 1, createdAt: "2026-06-30T00:00:00.000Z", updatedAt: "2026-06-30T00:00:00.000Z" },
      { id: "check_b", text: "B", checked: false, order: 2, createdAt: "2026-06-30T00:00:00.000Z", updatedAt: "2026-06-30T00:00:00.000Z" },
    ] };
    const withChecklist = { ...data, tasks: [task] };
    const saved = saveTaskCommand(withChecklist, task.id, { title: "Renamed", description: task.description, statusId: task.statusId, priorityId: task.priorityId, scheduledDate: task.scheduledDate, revealDate: task.revealDate, location: task.location, parentTaskId: null, tagIds: task.tagIds, checklist: [
      { ...task.checklist[1], text: "Bee", checked: true, order: 1 },
      { id: "check_c", text: "C", checked: false, order: 2, createdAt: "2026-06-30T00:00:00.000Z", updatedAt: "2026-06-30T00:00:00.000Z" },
    ] });
    expect(saved.activity.map((event) => event.type)).toEqual(expect.arrayContaining(["titleChanged", "checklistItemAdded", "checklistItemDeleted", "checklistItemEdited", "checklistItemChecked", "checklistItemReordered"]));
    expect(saved.activity.find((event) => event.type === "checklistItemAdded")?.newValue).toMatchObject({ id: "check_c", text: "C" });
  });

  it("moves a subtree intact and applies destination inheritance", () => {
    const data = createSeedData();
    const parent = { ...firstTask(data), aggregate: true };
    const child = { ...parent, ...createMeta("task"), title: "Child", parentTaskId: parent.id, aggregate: false, order: 1 };
    const grandchild = { ...child, ...createMeta("task"), title: "Grandchild", parentTaskId: child.id, order: 1 };
    const areaRoot = { ...parent, ...createMeta("task"), title: "Area root", location: { type: "area" as const, areaId: data.areas[0].id }, parentTaskId: null, aggregate: true, order: 1 };
    const withTree: AppData = { ...data, tasks: [parent, child, grandchild, areaRoot] };
    const moved = moveTaskSubtreeCommand(withTree, child.id, { type: "parent", parentTaskId: areaRoot.id });
    expect(moved.tasks.find((task) => task.id === child.id)).toMatchObject({ parentTaskId: areaRoot.id, location: areaRoot.location });
    expect(moved.tasks.find((task) => task.id === grandchild.id)).toMatchObject({ parentTaskId: child.id, location: areaRoot.location });
    expect(() => moveTaskSubtreeCommand(moved, areaRoot.id, { type: "parent", parentTaskId: grandchild.id })).toThrow(/descendant/i);
  });

  it("clears parent to a valid root without splitting descendants", () => {
    const data = createSeedData();
    const parent = { ...firstTask(data), aggregate: true };
    const child = { ...parent, ...createMeta("task"), title: "Child", parentTaskId: parent.id, aggregate: true, order: 1 };
    const grandchild = { ...child, ...createMeta("task"), title: "Grandchild", parentTaskId: child.id, aggregate: false, order: 1 };
    const withTree: AppData = { ...data, tasks: [parent, child, grandchild] };
    const moved = moveTaskSubtreeCommand(withTree, child.id, { type: "root", location: parent.location });
    expect(moved.tasks.find((task) => task.id === child.id)?.parentTaskId).toBeNull();
    expect(moved.tasks.find((task) => task.id === grandchild.id)?.parentTaskId).toBe(child.id);
  });

  it("reopens one child and required ancestors while preserving closed siblings", () => {
    const data = createSeedData();
    const parent = { ...firstTask(data), aggregate: true, statusId: STATUS_IDS.completed, completedAt: "2026-06-30T00:00:00.000Z" };
    const child = { ...parent, ...createMeta("task"), title: "Child", parentTaskId: parent.id, aggregate: false, statusId: STATUS_IDS.completed, order: 1 };
    const sibling = { ...child, ...createMeta("task"), title: "Sibling", order: 2 };
    const withClosed: AppData = { ...data, tasks: [parent, child, sibling] };
    const reopened = reopenTaskCommand(withClosed, child.id, STATUS_IDS.open);
    expect(reopened.tasks.find((task) => task.id === child.id)?.statusId).toBe(STATUS_IDS.open);
    expect(reopened.tasks.find((task) => task.id === parent.id)?.statusId).toBe(STATUS_IDS.open);
    expect(reopened.tasks.find((task) => task.id === sibling.id)?.statusId).toBe(STATUS_IDS.completed);
  });

  it("blocks reopen in completed Projects and reports aggregate impact counts", () => {
    const data = createSeedData();
    const project = { ...data.projects[0], completedAt: "2026-06-30T00:00:00.000Z" };
    const parent = { ...firstTask(data), aggregate: true, statusId: STATUS_IDS.completed };
    const child = { ...parent, ...createMeta("task"), title: "Child", parentTaskId: parent.id, aggregate: false, statusId: STATUS_IDS.cancelled };
    const withClosed: AppData = { ...data, projects: [project], tasks: [parent, child] };
    expect(aggregateCompletionImpact(withClosed, parent.id)).toMatchObject({ actionableLeafCount: 1, cancelledActionableCount: 1, totalTaskCount: 2 });
    expect(() => reopenTaskCommand(withClosed, parent.id, STATUS_IDS.open)).toThrow(/Project/);
  });

  it("reorders only siblings without changing parent or location", () => {
    const data = createSeedData();
    const parent = { ...firstTask(data), aggregate: true };
    const first = { ...parent, ...createMeta("task"), title: "First", parentTaskId: parent.id, aggregate: false, order: 1 };
    const second = { ...first, ...createMeta("task"), title: "Second", order: 2 };
    const withSiblings: AppData = { ...data, tasks: [parent, first, second] };
    const reordered = reorderTaskSiblingCommand(withSiblings, second.id, -1);
    expect(reordered.tasks.find((task) => task.id === second.id)).toMatchObject({ order: 1, parentTaskId: parent.id, location: parent.location });
    expect(reordered.tasks.find((task) => task.id === first.id)).toMatchObject({ order: 2, parentTaskId: parent.id, location: parent.location });
  });

  it("active views exclude completed, cancelled, deferred, aggregate and deleted tasks", () => {
    const data = createSeedData();
    const base = firstTask(data);
    const visible = { ...base, ...createMeta("task"), priorityId: PRIORITY_IDS.normal };
    const result = activeTasks({ ...data, tasks: [{ ...base, ...createMeta("task"), statusId: STATUS_IDS.completed }, { ...base, ...createMeta("task"), statusId: STATUS_IDS.cancelled }, { ...base, ...createMeta("task"), revealDate: "2099-01-01" }, { ...base, ...createMeta("task"), aggregate: true }, { ...base, ...createMeta("task"), deletedAt: new Date().toISOString() }, visible] }, "2026-06-30");
    expect(result.map((task) => task.id)).toEqual([visible.id]);
  });

  it("keeps failed optimistic mutations visible and retries transient failures", async () => {
    const data = createSeedData();
    const next = updateTaskRecord(data, firstTask(data).id, { title: "Retry" }, "titleChanged", "Retry");
    let attempts = 0;
    const result = await optimisticMutation({ previous: data, next, apply: () => undefined, retries: 1, retryDelayMs: 1, persist: async () => { attempts += 1; if (attempts === 1) throw new Error("network timeout"); return next; } });
    expect(result.state).toBe("confirmed");
    expect(attempts).toBe(2);
  });

  it("creates ordered List items, recognises URLs and reorders items", () => {
    const seed = createSeedData();
    const data = addReferenceEntries(seed, seed.referenceLists[0].id, " first\n\nhttps://example.com/page \n third ");
    expect(data.referenceListEntries.map((entry) => entry.text)).toEqual(["first", "https://example.com/page", "third"]);
    expect(data.referenceListEntries[1].link).toBe("https://example.com/page");
    expect(entryPartsWithUrls(data.referenceListEntries[1].text)).toContainEqual({ type: "url", value: "https://example.com/page" });
    const reordered = reorderReferenceEntry(data, data.referenceListEntries[1].id, -1);
    expect(reordered.referenceListEntries.find((entry) => entry.id === data.referenceListEntries[1].id)?.orderKey).toBe(data.referenceListEntries[0].orderKey);
  });

  it("stores List item text and optional links separately", () => {
    const seed = createSeedData();
    const created = createReferenceEntry(seed, seed.referenceLists[0].id, "Docs", "https://example.com/docs");
    expect(created.referenceListEntries[0]).toMatchObject({ text: "Docs", link: "https://example.com/docs" });
    expect(() => createReferenceEntry(seed, seed.referenceLists[0].id, "Bad", "javascript:alert(1)")).toThrow("http:// or https://");
    const updated = updateReferenceEntry(created, created.referenceListEntries[0].id, "Docs updated", "");
    expect(updated.referenceListEntries[0]).toMatchObject({ text: "Docs updated", link: null });
  });

  it("migrates legacy URL-only rows and can reorder by direct order", () => {
    const base = createSeedData();
    const seed = addReferenceEntries(base, base.referenceLists[0].id, "one\ntwo\nthree");
    const migrated = migrateAppData({ ...seed, referenceListEntries: seed.referenceListEntries.map(({ link: _link, ...entry }) => entry) as never });
    expect(migrated.referenceListEntries.every((entry) => "link" in entry)).toBe(true);
    const reordered = reorderReferenceEntries(migrated, migrated.referenceLists[0].id, [migrated.referenceListEntries[2].id, migrated.referenceListEntries[0].id, migrated.referenceListEntries[1].id]);
    expect([...reordered.referenceListEntries].sort((a, b) => a.orderKey.localeCompare(b.orderKey)).map((entry) => entry.text)).toEqual(["three", "one", "two"]);
  });

  it("removes legacy List description fields during migration", () => {
    const seed = createSeedData();
    const migrated = migrateAppData({
      ...seed,
      referenceLists: seed.referenceLists.map((list) => ({
        ...list,
        description: "Legacy tagline",
        tagline: "Legacy tagline",
      })) as never,
    });

    expect("description" in migrated.referenceLists[0]).toBe(false);
    expect("tagline" in migrated.referenceLists[0]).toBe(false);
  });

  it("generates due daily recurrences idempotently with missed occurrence collapsing", () => {
    const data = createSeedData();
    const rule = { ...createMeta("recur"), kind: "recurrenceRule" as const, label: "Daily", active: true, frequency: "daily" as const, interval: 1, weekdays: [], dayOfMonth: null, firstScheduledDate: "2026-06-29", endDate: null, lastGeneratedDate: null, nextBoundaryDate: "2026-06-29", template: { title: "Daily", description: "", statusId: STATUS_IDS.open, priorityId: PRIORITY_IDS.normal, location: { type: "inbox" as const }, revealDate: null, tagIds: [], mustDoToday: false } };
    const once = generateDueRecurrences({ ...data, recurrenceRules: [rule] }, "2026-06-30");
    const twice = generateDueRecurrences(once, "2026-06-30");
    expect(once.recurrenceGenerations.length).toBe(1);
    expect(once.recurrenceGenerations[0].occurrenceDate).toBe("2026-06-30");
    expect(once.recurrenceGenerations[0].collapsedCount).toBe(2);
    expect(twice.recurrenceGenerations.length).toBe(1);
  });

  it("sorts, filters and groups tasks with AND logic", () => {
    const data = createSeedData();
    const base = firstTask(data);
    const lowToday = { ...base, ...createMeta("task"), priorityId: PRIORITY_IDS.low, mustDoToday: true, scheduledDate: null };
    const highLater = { ...base, ...createMeta("task"), priorityId: PRIORITY_IDS.high, mustDoToday: false, scheduledDate: "2026-07-01" };
    expect(sortTasks(data, [highLater, lowToday], "default")[0].id).toBe(highLater.id);
    expect(filterTasks(data, [highLater, lowToday], { priorityId: PRIORITY_IDS.high, scheduledState: "future" }, "2026-06-30")).toEqual([highLater]);
    expect(Object.keys(groupTasks(data, [highLater], "tag"))).toEqual(["No Tags"]);
  });

  it("excludes authentication secrets from exports and redacts auth helper data", () => {
    expect(exportExcludesSecrets(createExportEnvelope(createSeedData(), { applicationVersion: "test" }))).toBe(true);
    expect(redactRecoveryCodes({ recoveryCodes: ["abc"] }).recoveryCodes).toBe("[redacted]");
    expect(shouldLockOut(5)).toBe(true);
    expect(trustedSessionState(true, false).requiresAdditionalSecret).toBe(true);
  });

  it("uses package build metadata in export envelopes", () => {
    expect(buildInfo.applicationVersion).toBe(packageJson.version);
    const envelope = createExportEnvelope(createSeedData(), { applicationVersion: buildInfo.applicationVersion, buildId: "test-build", buildTimestamp: "2026-07-01T00:00:00.000Z", sourceCommit: null, snapshotConfirmedSynchronised: true });
    expect(envelope.applicationVersion).toBe(packageJson.version);
    expect(envelope.schemaVersion).toBe(buildInfo.schemaVersion);
    expect(envelope.build.buildId).toBe("test-build");
    expect(envelope.providerMetadata.snapshotConfirmedSynchronised).toBe(true);
  });

  it("blocks export during pending, failed or ambiguous mutation states", () => {
    const sync = { initialSyncComplete: true, canonicalStateKnown: true, canonicalRevision: 3, lastConfirmedRevision: 3, lastAuthoritativeSnapshotAt: "2026-07-01T00:00:00.000Z", lastSuccessfulSyncAt: "2026-07-01T00:00:00.000Z" };
    expect(exportSafety(sync, { pendingCount: 1, failedCount: 0, currentSummary: "Saving", lastFailureCategory: "None" }).safe).toBe(false);
    expect(exportSafety(sync, { pendingCount: 0, failedCount: 1, currentSummary: "Save failed", lastFailureCategory: "Conflict" }).safe).toBe(false);
    expect(exportSafety({ ...sync, canonicalStateKnown: false }, { pendingCount: 0, failedCount: 0, currentSummary: "None", lastFailureCategory: "None" }).safe).toBe(false);
    expect(assertExportSafe(createSeedData(), sync, { pendingCount: 0, failedCount: 0, currentSummary: "None", lastFailureCategory: "None" }).safe).toBe(true);
  });

  it("redacts newly introduced diagnostic fields", () => {
    const payload = sanitiseDiagnostics({ details: { accessToken: "abc", refreshToken: "def", serviceRoleKey: "ghi", password: "pw", ordinary: "safe" } });
    expect(payload.details.accessToken).toBe("[redacted]");
    expect(payload.details.refreshToken).toBe("[redacted]");
    expect(payload.details.serviceRoleKey).toBe("[redacted]");
    expect(payload.details.password).toBe("[redacted]");
    expect(payload.details.ordinary).toBe("safe");
  });

  it("keeps the mobile dock pages in launch order", () => {
    expect(mobileDock[0].map((item) => item.label)).toEqual(["Today", "Inbox", "Tasks", "Lists", "Projects", "Upcoming"]);
    expect(mobileDock[1].map((item) => item.label)).toEqual(["Areas", "Overdue", "Someday", "Trash", "Bakery", "Settings"]);
  });
});
