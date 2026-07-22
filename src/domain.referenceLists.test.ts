import { describe, expect, it } from "vitest";
import { AppData, ReferenceListLocation, addReferenceEntries, createMeta, createReferenceListCommand, relocateReferenceListCommand, reorderReferenceListBeforeCommand, restoreEntity, setReferenceListTagsCommand, softDeleteEntity, updateReferenceListCommand, validateReferenceListRecord } from "./domain";
import { deleteListCommand } from "./core/lifecycle/lifecycleCommands";
import { createSeedData } from "./seed";

describe("List lifecycle commands", () => {
  it("adds trimmed multiline Items in order and rejects empty or archived input", () => {
    const seed = createSeedData();
    const created = createReferenceListCommand(seed, { title: "Bulk", location: { type: "loose" }, tagIds: [] });
    const list = created.referenceLists.at(-1)!;
    const added = addReferenceEntries(created, list.id, " First \n\nSecond\n Third ");
    expect(added.referenceListEntries.filter((entry) => entry.referenceListId === list.id).map((entry) => entry.text)).toEqual(["First", "Second", "Third"]);
    expect(added.activity.at(-1)?.newValue).toMatchObject({ itemCount: 3 });
    expect(() => addReferenceEntries(created, list.id, "\n  \n")).toThrow(/at least one/i);
    const archived = { ...created, referenceLists: created.referenceLists.map((candidate) => candidate.id === list.id ? { ...candidate, archivedAt: new Date().toISOString() } : candidate) };
    expect(() => addReferenceEntries(archived, list.id, "Nope")).toThrow(/read-only/i);
  });

  it("adds linked multiline Items from name-url parentheses syntax", () => {
    const seed = createSeedData();
    const created = createReferenceListCommand(seed, { title: "Links", location: { type: "loose" }, tagIds: [] });
    const list = created.referenceLists.at(-1)!;
    const added = addReferenceEntries(created, list.id, "Thing number one(https://whatever.com)\r\nThing two(http://this.net)");
    const entries = added.referenceListEntries.filter((entry) => entry.referenceListId === list.id);

    expect(entries.map((entry) => ({ text: entry.text, link: entry.link }))).toEqual([
      { text: "Thing number one", link: "https://whatever.com" },
      { text: "Thing two", link: "http://this.net" },
    ]);
  });

  it("preserves plain multiline Items and URL-only automatic links", () => {
    const seed = createSeedData();
    const created = createReferenceListCommand(seed, { title: "Mixed", location: { type: "loose" }, tagIds: [] });
    const list = created.referenceLists.at(-1)!;
    const added = addReferenceEntries(created, list.id, "Plain thing\nhttps://example.com\nThing(example)");
    const entries = added.referenceListEntries.filter((entry) => entry.referenceListId === list.id);

    expect(entries.map((entry) => ({ text: entry.text, link: entry.link }))).toEqual([
      { text: "Plain thing", link: null },
      { text: "https://example.com", link: "https://example.com" },
      { text: "Thing(example)", link: null },
    ]);
  });

  it("edits Lists while preserving stable IDs, entries and item order", () => {
    const seed = createSeedData();
    const created = createReferenceListCommand(seed, { title: "Packing", location: { type: "loose" }, tagIds: [] });
    const list = created.referenceLists.at(-1)!;
    const withItems = addReferenceEntries(created, list.id, "one\ntwo");
    const saved = updateReferenceListCommand(withItems, list.id, { title: "Packing list", location: { type: "area", areaId: seed.areas[0].id }, tagIds: [], color: list.color, icon: list.icon });
    const updated = saved.referenceLists.find((candidate) => candidate.id === list.id)!;

    expect(updated.id).toBe(list.id);
    expect(updated.title).toBe("Packing list");
    expect(updated.location).toEqual({ type: "area", areaId: seed.areas[0].id });
    expect(saved.referenceListEntries.filter((entry) => entry.referenceListId === list.id).map((entry) => entry.text)).toEqual(["one", "two"]);
    expect(saved.activity.some((event) => event.entityId === list.id && event.type === "titleChanged")).toBe(true);
    expect(saved.activity.some((event) => event.entityId === list.id && event.type === "moved")).toBe(true);
  });

  it("clears an existing List colour when Appearance is explicitly unassigned", () => {
    const data = createSeedData();
    const list = data.referenceLists[0];
    expect(list.color).toBeTruthy();

    const saved = updateReferenceListCommand(data, list.id, {
      title: list.title,
      location: list.location,
      tagIds: list.tagIds,
      color: null,
      icon: list.icon,
    });

    expect(saved.referenceLists.find((candidate) => candidate.id === list.id)?.color).toBeNull();
    expect(saved.activity.at(-1)).toMatchObject({ entityId: list.id, type: "colorChanged", oldValue: list.color, newValue: null });
  });

  it("relocates Lists between loose, Area and Project states", () => {
    const seed = createSeedData();
    const projectB = { ...seed.projects[0], id: "project_b", title: "Other project", areaId: null };
    const areaB = { ...seed.areas[0], id: "area_b", title: "Other area" };
    let data: AppData = { ...seed, projects: [...seed.projects, projectB], areas: [...seed.areas, areaB], referenceLists: [{ ...seed.referenceLists[0], location: { type: "loose" }, areaId: null, projectId: null }] };
    const listId = data.referenceLists[0].id;
    const moves: ReferenceListLocation[] = [
      { type: "area", areaId: seed.areas[0].id },
      { type: "loose" },
      { type: "project", projectId: seed.projects[0].id },
      { type: "area", areaId: areaB.id },
      { type: "project", projectId: seed.projects[0].id },
      { type: "project", projectId: projectB.id },
      { type: "loose" },
    ];

    for (const location of moves) data = relocateReferenceListCommand(data, listId, location);

    expect(data.referenceLists[0].location).toEqual({ type: "loose" });
    expect(data.referenceLists[0].areaId).toBeNull();
    expect(data.referenceLists[0].projectId).toBeNull();
    expect(data.activity.filter((event) => event.entityId === listId && event.type === "moved")).toHaveLength(moves.length);
  });

  it("moves a List directly before the dropped-on List", () => {
    let data: AppData = { ...createSeedData(), referenceLists: [], referenceListEntries: [] };
    data = createReferenceListCommand(data, { title: "Alpha", location: { type: "loose" }, tagIds: [] });
    data = createReferenceListCommand(data, { title: "Bravo", location: { type: "loose" }, tagIds: [] });
    data = createReferenceListCommand(data, { title: "Charlie", location: { type: "loose" }, tagIds: [] });
    data = createReferenceListCommand(data, { title: "Delta", location: { type: "loose" }, tagIds: [] });
    const ordered = [...data.referenceLists].sort((a, b) => a.order - b.order);
    const moved = reorderReferenceListBeforeCommand(data, ordered[0].id, ordered[3].id, ordered.map((list) => list.id));

    expect([...moved.referenceLists].sort((a, b) => a.order - b.order).map((list) => list.title)).toEqual(["Bravo", "Charlie", "Alpha", "Delta"]);
    expect(moved.activity.at(-1)?.newValue).toEqual([ordered[1].id, ordered[2].id, ordered[0].id, ordered[3].id]);
  });

  it("rejects invalid destinations and contradictory location state", () => {
    const seed = createSeedData();
    const deletedArea = { ...seed.areas[0], id: "deleted_area", deletedAt: "2026-07-01T00:00:00.000Z" };
    const archivedProject = { ...seed.projects[0], id: "archived_project", archivedAt: "2026-07-01T00:00:00.000Z" };
    const deletedProject = { ...seed.projects[0], id: "deleted_project", deletedAt: "2026-07-01T00:00:00.000Z" };
    const data: AppData = { ...seed, areas: [...seed.areas, deletedArea], projects: [...seed.projects, archivedProject, deletedProject] };
    const listId = data.referenceLists[0].id;

    expect(() => relocateReferenceListCommand(data, listId, { type: "area", areaId: deletedArea.id })).toThrow("available Area");
    expect(() => relocateReferenceListCommand(data, listId, { type: "project", projectId: archivedProject.id })).toThrow("active Project");
    expect(() => relocateReferenceListCommand(data, listId, { type: "project", projectId: deletedProject.id })).toThrow("active Project");
    expect(() => validateReferenceListRecord(data, { ...data.referenceLists[0], location: { type: "project", projectId: seed.projects[0].id }, areaId: seed.areas[0].id })).toThrow("contradictory");
  });

  it("applies only List-scoped Tags and enforces mutual exclusion", () => {
    const seed = createSeedData();
    const group = { ...createMeta("group"), kind: "tagGroup" as const, name: "Kind", description: "", color: null, mutuallyExclusive: true, inherited: {}, order: 1 };
    const listTagA = { ...createMeta("tag"), kind: "tag" as const, name: "List A", description: "", color: "red", allowedScopes: ["referenceList" as const], tagGroupId: group.id, order: 1 };
    const listTagB = { ...createMeta("tag"), kind: "tag" as const, name: "List B", description: "", color: "blue", allowedScopes: ["referenceList" as const], tagGroupId: group.id, order: 2 };
    const taskTag = { ...createMeta("tag"), kind: "tag" as const, name: "Task only", description: "", color: "green", allowedScopes: ["task" as const], tagGroupId: null, order: 3 };
    const deletedListTag = { ...createMeta("tag"), kind: "tag" as const, name: "Deleted", description: "", color: "grey", allowedScopes: ["referenceList" as const], tagGroupId: null, deletedAt: "2026-07-01T00:00:00.000Z", order: 4 };
    const data: AppData = { ...seed, tags: [listTagA, listTagB, taskTag, deletedListTag], tagGroups: [group] };
    const listId = data.referenceLists[0].id;

    expect(() => setReferenceListTagsCommand(data, listId, [taskTag.id])).toThrow("List tags only");
    expect(() => setReferenceListTagsCommand(data, listId, [deletedListTag.id])).toThrow("List tags only");

    const tagged = setReferenceListTagsCommand(data, listId, [listTagA.id, listTagB.id]);
    expect(tagged.referenceLists[0].tagIds).toEqual([listTagB.id]);
    expect(tagged.activity.some((event) => event.entityId === listId && event.type === "tagsChanged")).toBe(true);
  });

  it("moves archived Lists to Deleted-only state and preserves item restoration state", () => {
    const seed = createSeedData();
    const withItems = addReferenceEntries(seed, seed.referenceLists[0].id, "keep\nremoved");
    const individuallyDeleted = softDeleteEntity(withItems, "referenceListEntry", withItems.referenceListEntries[1].id);
    const archived: AppData = { ...individuallyDeleted, referenceLists: individuallyDeleted.referenceLists.map((list) => ({ ...list, archivedAt: "2026-07-01T00:00:00.000Z" })) };
    const deleted = deleteListCommand(archived, archived.referenceLists[0].id);
    const restored = restoreEntity(deleted, "referenceList", archived.referenceLists[0].id);

    expect(deleted.referenceLists[0].deletedAt).toBeTruthy();
    expect(deleted.referenceLists[0].archivedAt).toBeNull();
    expect(deleted.referenceListEntries).toHaveLength(2);
    expect(restored.referenceListEntries[0].deletedAt).toBeNull();
    expect(restored.referenceListEntries[1].deletedAt).toBeTruthy();
  });
});
