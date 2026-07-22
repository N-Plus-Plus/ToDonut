import { describe, expect, it } from "vitest";
import { AppData, RecurrenceRuleInput, createMeta, createRecurrenceRuleCommand, defaultPriorityId, generateDueRecurrences, pauseRecurrenceRuleCommand, processDueRecurrenceSchedules, recurrenceOccurrenceKey, resumeRecurrenceRuleCommand, softDeleteRecurrenceRuleCommand, updateRecurrenceRuleCommand } from "./domain";
import { STATUS_IDS, createSeedData } from "./seed";

function dailyInput(data: AppData, patch: Partial<RecurrenceRuleInput> = {}): RecurrenceRuleInput {
  return {
    label: "Daily Schedule",
    frequency: "daily",
    interval: 1,
    weekdays: [],
    dayOfMonth: null,
    firstScheduledDate: "2026-06-29",
    endDate: null,
    template: { title: "Generated", description: "Template", statusId: STATUS_IDS.completed, priorityId: defaultPriorityId(data), location: { type: "inbox" }, revealDate: null, tagIds: [], mustDoToday: false, dueOnOccurrence: true, checklist: [{ id: "check_template", text: "Check", checked: true, order: 1, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }] },
    ...patch,
  };
}

describe("recurrence launch behaviour", () => {
  it("creates, edits, pauses, resumes and soft deletes schedules", () => {
    const seed = createSeedData();
    const created = createRecurrenceRuleCommand(seed, dailyInput(seed), "2026-06-29");
    const rule = created.recurrenceRules[0];
    expect(rule.active).toBe(true);
    expect(rule.nextBoundaryDate).toBe("2026-06-29");
    const edited = updateRecurrenceRuleCommand(created, rule.id, dailyInput(created, { interval: 2, template: { ...rule.template, title: "Future title" } }), "2026-06-30");
    expect(edited.recurrenceRules[0].interval).toBe(2);
    expect(edited.recurrenceRules[0].nextBoundaryDate).toBe("2026-07-01");
    const paused = pauseRecurrenceRuleCommand(edited, rule.id);
    expect(paused.recurrenceRules[0].active).toBe(false);
    expect(generateDueRecurrences(paused, "2026-07-10").tasks).toHaveLength(seed.tasks.length);
    const resumed = resumeRecurrenceRuleCommand(paused, rule.id, "2026-07-10");
    expect(resumed.recurrenceRules[0].nextBoundaryDate).toBe("2026-07-11");
    const deleted = softDeleteRecurrenceRuleCommand(resumed, rule.id);
    expect(deleted.recurrenceRules[0].deletedAt).toBeTruthy();
  });

  it("collapses several missed slots into one latest generated Task with provenance", () => {
    const seed = createSeedData();
    const created = createRecurrenceRuleCommand(seed, dailyInput(seed), "2026-06-29");
    const result = processDueRecurrenceSchedules(created, "2026-07-02");
    expect(result.generatedCount).toBe(1);
    expect(result.collapsedCount).toBe(3);
    expect(result.data.tasks).toHaveLength(seed.tasks.length + 1);
    const task = result.data.tasks.at(-1)!;
    const rule = created.recurrenceRules[0];
    expect(task.statusId).not.toBe(STATUS_IDS.completed);
    expect(task.scheduledDate).toBe("2026-07-02");
    expect(task.parentTaskId).toBeNull();
    expect(task.aggregate).toBe(false);
    expect(task.checklist).toEqual([]);
    expect(result.data.recurrenceRules[0].template.checklist).toEqual([]);
    expect(task.recurrence).toMatchObject({ ruleId: rule.id, occurrenceKey: recurrenceOccurrenceKey(rule.id, "2026-07-02"), occurrenceDate: "2026-07-02", collapsedCount: 4, firstMissedDate: "2026-06-29", lastMissedDate: "2026-07-02" });
    expect(result.data.recurrenceRules[0].nextBoundaryDate).toBe("2026-07-03");
    expect(processDueRecurrenceSchedules(result.data, "2026-07-02").generatedCount).toBe(0);
  });

  it("keeps deleted and closed generated Tasks consumed", () => {
    const seed = createSeedData();
    const created = createRecurrenceRuleCommand(seed, dailyInput(seed), "2026-06-29");
    const generated = processDueRecurrenceSchedules(created, "2026-06-29").data;
    const task = generated.tasks.at(-1)!;
    const deletedTaskData = { ...generated, tasks: generated.tasks.map((candidate) => candidate.id === task.id ? { ...candidate, deletedAt: "2026-06-29T00:00:00.000Z" } : candidate), recurrenceRules: generated.recurrenceRules.map((rule) => ({ ...rule, nextBoundaryDate: "2026-06-29" })) };
    expect(processDueRecurrenceSchedules(deletedTaskData, "2026-06-29").generatedCount).toBe(0);
  });

  it("marks invalid destinations as Needs Attention without fallback generation", () => {
    const seed = createSeedData();
    const project = seed.projects[0];
    const created = createRecurrenceRuleCommand(seed, dailyInput(seed, { template: { ...dailyInput(seed).template, location: { type: "project", projectId: project.id } } }), "2026-06-29");
    const archived = { ...created, projects: created.projects.map((candidate) => candidate.id === project.id ? { ...candidate, archivedAt: "2026-06-30T00:00:00.000Z" } : candidate) };
    const result = processDueRecurrenceSchedules(archived, "2026-06-30");
    expect(result.generatedCount).toBe(0);
    expect(result.data.recurrenceRules[0].attention?.reason).toBe("archivedProject");
  });

  it("validates launch rule fields", () => {
    const seed = createSeedData();
    expect(() => createRecurrenceRuleCommand(seed, dailyInput(seed, { interval: 0 }))).toThrow(/Interval/);
    expect(() => createRecurrenceRuleCommand(seed, dailyInput(seed, { frequency: "weekly", weekdays: [] }))).toThrow(/weekday/);
    expect(() => createRecurrenceRuleCommand(seed, dailyInput(seed, { endDate: "2026-01-01" }))).toThrow(/End date/);
    expect(() => createRecurrenceRuleCommand(seed, dailyInput(seed, { frequency: "monthly", dayOfMonth: 32 }))).toThrow(/monthly day/);
  });

  it("uses local date keys stably across Sydney DST boundary dates", () => {
    const seed = createSeedData();
    const weekly = createRecurrenceRuleCommand(seed, dailyInput(seed, { frequency: "weekly", weekdays: [0], firstScheduledDate: "2026-04-05" }), "2026-04-05");
    const processed = processDueRecurrenceSchedules(weekly, "2026-04-05").data;
    expect(processed.tasks.at(-1)?.recurrence?.occurrenceKey).toBe(recurrenceOccurrenceKey(weekly.recurrenceRules[0].id, "2026-04-05"));
    const monthly = createRecurrenceRuleCommand(seed, dailyInput(seed, { frequency: "monthly", dayOfMonth: 4, firstScheduledDate: "2026-10-04" }), "2026-10-04");
    expect(processDueRecurrenceSchedules(monthly, "2026-10-04").data.tasks.at(-1)?.scheduledDate).toBe("2026-10-04");
  });
});
