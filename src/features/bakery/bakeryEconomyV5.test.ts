import { describe, expect, it } from "vitest";
import { createInitialBakeryState, migrateAppData } from "../../domain";
import { createSeedData } from "../../seed";
import { INGREDIENTS, PRODUCTS, RECIPES, RECIPE_BY_ID } from "../../domain/bakeryCatalogue";
import { applyTaskCompletionRewards, ingredientPackQuote } from "./bakeryDomain";

describe("Bakery catalogue-data version 5", () => {
  it("registers the exact core totals and opening progression", () => {
    expect(INGREDIENTS).toHaveLength(26);
    expect(RECIPES).toHaveLength(100);
    expect(PRODUCTS).toHaveLength(100);
    const bakery = createInitialBakeryState(new Date("2026-07-03T00:00:00Z"));
    expect(bakery.unlockedRecipeIds).toEqual(["sugar-donut"]);
    expect(bakery.revealedRecipeIds).toContain("glazed-donut");
    expect(RECIPE_BY_ID["sugar-donut"].ingredients).toEqual({ dough: 1, sugar: 2 });
  });

  it("converts legacy current Sprinkles once and records both sides", () => {
    const raw = createSeedData();
    raw.bakery.balanceDataVersion = 1;
    raw.bakery.balances.sprinkles = 7;
    const migrated = migrateAppData(raw, new Date("2026-07-03T00:00:00Z"));
    expect(migrated.bakery.balances).toMatchObject({ sprinkles: 0, sugar: 7 });
    expect(migrated.bakery.resourceTransactions.filter((entry) => entry.type === "legacy-resource-converted")).toHaveLength(2);
    expect(migrateAppData(migrated, new Date("2026-07-03T00:00:00Z")).bakery.balances.sugar).toBe(7);
  });

  it("awards Sugar while respecting legacy first-completion evidence", () => {
    const before = createSeedData();
    const task = before.tasks.find((candidate) => !candidate.aggregate && !candidate.deletedAt && !candidate.cancelledAt)!;
    task.scheduledDate = null;
    task.statusId = before.statuses.find((status) => status.category === "active")!.id;
    const rewarded = applyTaskCompletionRewards(before, before, task, "reward", new Date("2026-07-03T00:00:00Z"));
    expect(rewarded.bakery.balances.sugar).toBe(2);
    expect(rewarded.bakery.balances.sprinkles).toBe(0);
    const legacy = { ...before, bakery: { ...before.bakery, rewardLedger: [{ id: "legacy", operationId: "old", type: "productivity-reward", itemId: "sprinkles", amount: 2, source: `task:${task.id}`, timestamp: "2026-07-02T00:00:00Z", idempotencyKey: `task:${task.id}:first-completion-sprinkles` }] } };
    expect(applyTaskCompletionRewards(legacy, legacy, task, "retry", new Date("2026-07-03T00:00:00Z")).bakery.balances.sugar).toBe(0);
  });

  it("quotes all core packs through the authoritative path", () => {
    const bakery = createInitialBakeryState();
    expect(["dough", "sugar", "icing", "sprinkles"].map((id) => ingredientPackQuote(bakery, id))).toEqual([
      expect.objectContaining({ quantity: 10, price: 40 }),
      expect.objectContaining({ quantity: 10, price: 10 }),
      expect.objectContaining({ quantity: 10, price: 30 }),
      expect.objectContaining({ quantity: 10, price: 20 }),
    ]);
  });
});
