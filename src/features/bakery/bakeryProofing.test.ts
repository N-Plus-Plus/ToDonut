import { describe, expect, it } from "vitest";
import { createSeedData } from "../../seed";
import { createInitialBakeryState, migrateAppData } from "../../domain";
import { activeProofingScheduleLevel, formatProofingTime, nextProofingBoundary, proofingDaySegments, proofingWindowAt, proofingWindowForTimestamp } from "../../domain/bakeryProofing";
import { purchaseUpgradeWithProgress } from "./bakeryBusinessDomain";
import { applyTaskCompletionRewards, reverseRewards } from "./bakeryDomain";

const atSydney = (iso: string) => new Date(iso);

describe("Bakery Proofing Schedule", () => {
  it("calculates exact Sydney wall-clock windows for all levels", () => {
    expect(proofingWindowAt("2026-07-02", 0, 1)).toMatchObject({ index: 0, startMs: 0, endMs: 86_399_999 });
    expect(proofingWindowAt("2026-07-02", 12 * 3_600_000, 2).index).toBe(1);
    expect(proofingWindowAt("2026-07-02", 8 * 3_600_000, 3).index).toBe(1);
    expect(proofingWindowAt("2026-07-02", 16 * 3_600_000, 3).index).toBe(2);
    expect(proofingWindowAt("2026-07-02", 18 * 3_600_000, 4).index).toBe(3);
    expect(formatProofingTime(proofingWindowAt("2026-07-02", 4 * 3_600_000 + 48 * 60_000, 5).startMs)).toBe("04:48");
    expect(proofingWindowAt("2026-07-02", 20 * 3_600_000, 6).index).toBe(5);
    expect(proofingWindowAt("2026-07-02", 86_399_999, 6).index).toBe(5);
  });

  it("keeps daylight-saving transition boundaries on visible wall-clock time", () => {
    const bakery = createInitialBakeryState();
    bakery.purchasedUpgrades = [{ upgradeId: "proofing-schedule", level: 6, purchasedAt: "2026-10-03T00:00:00.000Z", operationId: "p", effectiveLocalDate: "2026-10-04" }];
    expect(proofingWindowForTimestamp(bakery, atSydney("2026-10-04T05:00:00.000Z")).index).toBe(4);
    bakery.purchasedUpgrades[0].effectiveLocalDate = "2026-04-05";
    expect(proofingWindowForTimestamp(bakery, atSydney("2026-04-05T05:00:00.000Z")).index).toBe(3);
  });

  it("awards one Dough per available window and expires missed windows", () => {
    let data = createSeedData();
    data.bakery.purchasedUpgrades = [{ upgradeId: "proofing-schedule", level: 2, purchasedAt: "2026-07-01T00:00:00.000Z", operationId: "p", effectiveLocalDate: "2026-07-02" }];
    const task = data.tasks[0];
    data = applyTaskCompletionRewards(data, data, task, "first", atSydney("2026-07-02T00:30:00.000Z"));
    expect(data.bakery.balances.dough).toBe(1);
    expect(data.bakery.rewardLedger.some((entry) => entry.idempotencyKey === "daily-dough:2026-07-02:schedule-3:window-1")).toBe(true);
    data = applyTaskCompletionRewards(data, data, { ...task, id: "same-window" }, "same", atSydney("2026-07-02T01:30:00.000Z"));
    expect(data.bakery.balances.dough).toBe(1);
    data = applyTaskCompletionRewards(data, data, { ...task, id: "next-window" }, "next", atSydney("2026-07-02T06:30:00.000Z"));
    expect(data.bakery.balances.dough).toBe(2);
    expect(data.bakery.rewardLedger.every((entry) => !entry.idempotencyKey?.includes("window-0") || entry.timestamp.includes("00:30"))).toBe(true);
  });

  it("excludes aggregates, projects, cancelled tasks, retries, and duplicate rapid completions", () => {
    let data = createSeedData();
    const task = data.tasks[0];
    data = applyTaskCompletionRewards(data, data, { ...task, aggregate: true }, "agg", atSydney("2026-07-02T01:00:00.000Z"));
    expect(data.bakery.balances.dough).toBe(0);
    data = applyTaskCompletionRewards(data, data, { ...task, id: "cancelled", cancelledAt: "2026-07-02T00:00:00.000Z" }, "cancel", atSydney("2026-07-02T01:00:00.000Z"));
    expect(data.bakery.balances.dough).toBe(0);
    data = applyTaskCompletionRewards(data, data, task, "leaf", atSydney("2026-07-02T01:00:00.000Z"));
    const retry = applyTaskCompletionRewards(data, data, task, "leaf", atSydney("2026-07-02T01:00:00.000Z"));
    expect(retry.bakery.balances.dough).toBe(1);
  });

  it("purchases sequential paid levels and activates the highest same-day level next Sydney date", () => {
    let data = createSeedData();
    data.bakery.balances.coin = 20_000;
    const now = atSydney("2026-07-02T04:00:00.000Z");
    data = purchaseUpgradeWithProgress(data, "proofing-schedule", "p2", now);
    data = purchaseUpgradeWithProgress(data, "proofing-schedule", "p3", now);
    expect(data.bakery.balances.coin).toBe(19_100);
    expect(activeProofingScheduleLevel(data.bakery, now)).toBe(1);
    expect(activeProofingScheduleLevel(data.bakery, atSydney("2026-07-02T14:00:00.000Z"))).toBe(3);
    expect(data.bakery.purchasedUpgrades.filter((upgrade) => upgrade.upgradeId === "proofing-schedule").map((upgrade) => upgrade.effectiveLocalDate)).toEqual(["2026-07-03", "2026-07-03"]);
    expect(() => purchaseUpgradeWithProgress(data, "proofing-schedule", "p4", now)).not.toThrow();
  });

  it("safe Undo reverses unspent Dough, releases the window, and blocks spent resources", () => {
    let data = createSeedData();
    const task = data.tasks[0];
    const now = atSydney("2026-07-02T01:00:00.000Z");
    data = applyTaskCompletionRewards(data, data, task, "complete", now);
    let undone = reverseRewards(data, "complete", "undo", now);
    expect(undone.bakery.balances.dough).toBe(0);
    expect(proofingDaySegments(undone.bakery, now)[0].state).toBe("current-available");
    undone = applyTaskCompletionRewards(undone, undone, { ...task, id: "reclaim" }, "reclaim", now);
    expect(undone.bakery.balances.dough).toBe(1);
    data.bakery.balances.dough = 0;
    expect(() => reverseRewards(data, "complete", "undo-spent", now)).toThrow(/already been used/i);
  });

  it("preserves legacy daily keys as claimed Level 1 windows during migration", () => {
    const data = createSeedData();
    data.bakery.rewardLedger = [{ id: "old", operationId: "old", type: "productivity-reward", itemId: "dough", amount: 1, source: "task:t", timestamp: "2026-07-02T00:00:00.000Z", idempotencyKey: "daily-dough:2026-07-02" }];
    const migrated = migrateAppData(data, atSydney("2026-07-02T01:00:00.000Z"));
    expect(migrated.bakery.rewardLedger[0].idempotencyKey).toBe("daily-dough:2026-07-02");
    expect(proofingDaySegments(migrated.bakery, atSydney("2026-07-02T01:00:00.000Z"))[0].state).toBe("current-claimed");
  });

  it("derives segment states and final-window boundaries for UI", () => {
    const data = createSeedData();
    data.bakery.purchasedUpgrades = [{ upgradeId: "proofing-schedule", level: 3, purchasedAt: "2026-07-01T00:00:00.000Z", operationId: "p", effectiveLocalDate: "2026-07-02" }];
    const segments = proofingDaySegments(data.bakery, atSydney("2026-07-01T17:00:00.000Z"));
    expect(segments.map((segment) => segment.state)).toEqual(["current-available", "future", "future", "future"]);
    expect(formatProofingTime(nextProofingBoundary(data.bakery, atSydney("2026-07-01T17:00:00.000Z"))!)).toBe("06:00");
    expect(nextProofingBoundary(data.bakery, atSydney("2026-07-02T13:00:00.000Z"))).toBeNull();
  });

  it("does not let one task claim several windows or historical missed opportunities", () => {
    let data = createSeedData();
    data.bakery.purchasedUpgrades = [{ upgradeId: "proofing-schedule", level: 6, purchasedAt: "2026-07-01T00:00:00.000Z", operationId: "p", effectiveLocalDate: "2026-07-02" }];
    data = applyTaskCompletionRewards(data, data, data.tasks[0], "one", atSydney("2026-07-02T13:00:00.000Z"));
    expect(data.bakery.balances.dough).toBe(1);
    expect(data.bakery.rewardLedger.filter((entry) => entry.itemId === "dough")).toHaveLength(1);
  });
});
