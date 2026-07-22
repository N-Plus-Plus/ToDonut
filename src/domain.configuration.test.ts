import { describe, expect, it } from "vitest";
import { AppData, createTagCommand, createTagGroupCommand, defaultPriorityId, deleteTagCommand, deleteTagGroupCommand, reorderPriorityCommand, reorderTagCommand, reorderTagRelativeCommand, updatePriorityCommand, updateTagCommand, updateTagGroupCommand } from "./domain";
import { PRIORITY_IDS, createSeedData } from "./seed";

describe("configuration commands", () => {
  it("keeps exactly five Priorities, preserves IDs, changes default and reorders rank without rewriting Tasks", () => {
    const data = createSeedData();
    const taskBefore = data.tasks[0];
    const renamed = updatePriorityCommand(data, PRIORITY_IDS.high, { name: "Now", color: "var(--palette-grapefruit-dark)", icon: "flag", makeDefault: true });
    expect(renamed.priorities).toHaveLength(5);
    expect(renamed.priorities.find((priority) => priority.id === PRIORITY_IDS.high)?.name).toBe("Now");
    expect(defaultPriorityId(renamed)).toBe(PRIORITY_IDS.high);
    expect(renamed.tasks[0]).toEqual(taskBefore);

    const reordered = reorderPriorityCommand(renamed, PRIORITY_IDS.high, -1);
    expect(reordered.priorities.find((priority) => priority.id === PRIORITY_IDS.high)?.rank).toBe(3);
    expect(reordered.tasks[0]).toEqual(taskBefore);
  });

  it("validates Tags, filters scopes and detaches assignments when a scope is removed", () => {
    const data = createSeedData();
    expect(() => createTagCommand(data, { name: " ", description: "", color: "var(--palette-aqua-light)", allowedScopes: ["task"], tagGroupId: null })).toThrow(/required/);
    expect(() => createTagCommand(data, { name: "Only", description: "", color: "var(--palette-aqua-light)", allowedScopes: [], tagGroupId: null })).toThrow(/scope/);

    const created = createTagCommand(data, { name: "Cross", description: "Reusable", color: "var(--palette-aqua-light)", allowedScopes: ["task", "project", "referenceList"], tagGroupId: null });
    const tag = created.tags.find((candidate) => candidate.name === "Cross")!;
    const assigned: AppData = { ...created, tasks: created.tasks.map((task, index) => index === 0 ? { ...task, tagIds: [tag.id] } : task), projects: created.projects.map((project) => ({ ...project, tagIds: [tag.id] })), referenceLists: created.referenceLists.map((list) => ({ ...list, tagIds: [tag.id] })) };
    const scoped = updateTagCommand(assigned, tag.id, { name: "Cross", description: "", color: tag.color, allowedScopes: ["task"], tagGroupId: null });
    expect(scoped.tasks[0].tagIds).toEqual([tag.id]);
    expect(scoped.projects[0].tagIds).toEqual([]);
    expect(scoped.referenceLists[0].tagIds).toEqual([]);
    expect(scoped.activity.some((event) => event.type === "scopeChanged")).toBe(true);
  });

  it("soft deletes Tags and removes all entity assignments atomically", () => {
    const data = createSeedData();
    const tag = data.tags[0];
    const assigned: AppData = { ...data, tasks: data.tasks.map((task) => ({ ...task, tagIds: [tag.id] })), projects: data.projects.map((project) => ({ ...project, tagIds: [tag.id] })), referenceLists: data.referenceLists.map((list) => ({ ...list, tagIds: [tag.id] })) };
    const deleted = deleteTagCommand(assigned, tag.id);
    expect(deleted.tags.find((candidate) => candidate.id === tag.id)?.deletedAt).toBeTruthy();
    expect(deleted.tasks.every((task) => !task.tagIds.includes(tag.id))).toBe(true);
    expect(deleted.projects.every((project) => !project.tagIds.includes(tag.id))).toBe(true);
    expect(deleted.referenceLists.every((list) => !list.tagIds.includes(tag.id))).toBe(true);
  });

  it("reorders Tags only among siblings in the same Tag Group", () => {
    let data = createSeedData();
    const groupMembers = data.tags.filter((tag) => tag.tagGroupId === data.tagGroups[0].id).sort((a, b) => a.order - b.order);
    data = createTagCommand(data, { name: "Loose", description: "", color: "red", allowedScopes: ["task"], tagGroupId: null });
    const loose = data.tags.find((tag) => tag.name === "Loose")!;

    expect(reorderTagCommand(data, groupMembers[1].id, 1)).toBe(data);
    const reordered = reorderTagCommand(data, groupMembers[0].id, 1);
    const reorderedMembers = reordered.tags.filter((tag) => tag.tagGroupId === data.tagGroups[0].id).sort((a, b) => a.order - b.order);

    expect(reorderedMembers.map((tag) => tag.id)).toEqual([groupMembers[1].id, groupMembers[0].id]);
    expect(reordered.tags.find((tag) => tag.id === loose.id)?.order).toBe(loose.order);
  });

  it("places the dragged Tag relative to the drop target and persists a changed sibling order", () => {
    const data = createSeedData();
    const members = data.tags.filter((tag) => tag.tagGroupId === data.tagGroups[0].id).sort((a, b) => a.order - b.order);

    const reordered = reorderTagRelativeCommand(data, members[0].id, members[1].id, "after");
    const reorderedMembers = reordered.tags.filter((tag) => tag.tagGroupId === data.tagGroups[0].id).sort((a, b) => a.order - b.order);

    expect(reordered).not.toBe(data);
    expect(reorderedMembers.map((tag) => tag.id)).toEqual([members[1].id, members[0].id]);
    expect(reordered.activity.at(-1)?.type).toBe("orderChanged");
  });

  it("repairs mutual-exclusion conflicts by Tag order when exclusivity is enabled", () => {
    let data = createSeedData();
    data = createTagGroupCommand(data, { name: "Mode", description: "", mutuallyExclusive: false });
    const group = data.tagGroups.find((candidate) => candidate.name === "Mode")!;
    data = createTagCommand(data, { name: "A", description: "", color: "red", allowedScopes: ["task"], tagGroupId: group.id });
    data = createTagCommand(data, { name: "B", description: "", color: "blue", allowedScopes: ["task"], tagGroupId: group.id });
    const [a, b] = data.tags.filter((tag) => tag.tagGroupId === group.id).sort((x, y) => x.order - y.order);
    const conflicted: AppData = { ...data, tasks: data.tasks.map((task, index) => index === 0 ? { ...task, tagIds: [b.id, a.id] } : task) };
    const repaired = updateTagGroupCommand(conflicted, group.id, { name: group.name, description: "", mutuallyExclusive: true, inherited: group.inherited });
    expect(repaired.tasks[0].tagIds).toEqual([a.id]);
    expect(repaired.activity.some((event) => event.type === "conflictRepaired")).toBe(true);
  });

  it("deleting a Tag Group ungroups member Tags and preserves entity assignments", () => {
    const data = createSeedData();
    const group = data.tagGroups[0];
    const member = data.tags.find((tag) => tag.tagGroupId === group.id)!;
    const assigned: AppData = { ...data, tasks: data.tasks.map((task) => ({ ...task, tagIds: [member.id] })) };
    const deleted = deleteTagGroupCommand(assigned, group.id);
    expect(deleted.tagGroups.find((candidate) => candidate.id === group.id)?.deletedAt).toBeTruthy();
    expect(deleted.tags.find((tag) => tag.id === member.id)?.tagGroupId).toBeNull();
    expect(deleted.tasks[0].tagIds).toEqual([member.id]);
  });
});
