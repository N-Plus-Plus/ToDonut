import { describe, expect, it } from "vitest";
import { AppData, QUANTIFIER_IDS, createMeta, migrateAppData, updateQuantifierDefinitionCommand } from "./domain";
import { createSeedData } from "./seed";
import { parseLucideIconTokens } from "./core/icons/lucideIconTokens";
import { invalidLucideIconNames } from "./core/icons/lucideIconRegistry";

describe("quantifier dimensions", () => {
  it("prefills Energy and Context with the established options", () => {
    const data = createSeedData();
    expect(data.quantifierDefinitions.map((definition) => [definition.name, definition.options.map((option) => option.name)])).toEqual([
      ["Energy", ["Relaxed", "Low Energy", "Medium Energy", "High Energy", "It's a Whole Thing"]],
      ["Context", ["Home", "Work", "Outing", "Mental", "Digital", "Relationship"]],
    ]);
  });

  it("normalises pipe-separated Lucide tokens while preserving duplicates and order", () => {
    expect(parseLucideIconTokens("zap|zap   |    zap")).toEqual(["zap", "zap", "zap"]);
  });

  it("copies matching legacy Energy and Context tag assignments without removing tags", () => {
    const data = createSeedData();
    const energyGroup = data.tagGroups[0];
    const lowEnergy = data.tags.find((tag) => tag.name === "Low energy")!;
    const contextGroup = { ...createMeta("group"), kind: "tagGroup" as const, name: "Context", description: "", color: null, mutuallyExclusive: true, inherited: {}, order: 2 };
    const home = { ...createMeta("tag"), kind: "tag" as const, name: "Home", description: "", color: "#fff", allowedScopes: ["task" as const], tagGroupId: contextGroup.id, order: 1 };
    const legacy = {
      ...data,
      quantifierDefinitions: undefined,
      tagGroups: [energyGroup, contextGroup],
      tags: [...data.tags, home],
      tasks: data.tasks.map((task) => {
        const { quantifierSelections: _selections, ...withoutSelections } = task;
        return { ...withoutSelections, tagIds: [lowEnergy.id, home.id] };
      }),
    };

    const migrated = migrateAppData(legacy as unknown as Partial<AppData>);
    expect(migrated.tasks[0].quantifierSelections).toEqual({ [QUANTIFIER_IDS.energy]: "energy_2", [QUANTIFIER_IDS.context]: "context_1" });
    expect(migrated.tasks[0].tagIds).toEqual([lowEnergy.id, home.id]);
    expect(migrated.quantifierDefinitions.every((definition) => definition.options.every((option) => Array.isArray(option.iconNames) && option.color === null))).toBe(true);
  });

  it("renames dimensions and options, supports arbitrary option counts, and clears removed selections", () => {
    const seeded = createSeedData();
    const energy = seeded.quantifierDefinitions.find((definition) => definition.id === QUANTIFIER_IDS.energy)!;
    const assigned: AppData = {
      ...seeded,
      tasks: seeded.tasks.map((task) => ({ ...task, quantifierSelections: { [energy.id]: "energy_2" } })),
      projects: seeded.projects.map((project) => ({ ...project, quantifierSelections: { [energy.id]: "energy_2" } })),
      referenceLists: seeded.referenceLists.map((list) => ({ ...list, quantifierSelections: { [energy.id]: "energy_2" } })),
    };
    const updated = updateQuantifierDefinitionCommand(assigned, energy.id, {
      name: "Available energy",
      options: [{ id: "energy_1", name: "Restful" }, { name: "Maximum effort" }],
    });

    const definition = updated.quantifierDefinitions.find((candidate) => candidate.id === energy.id)!;
    expect(definition.name).toBe("Available energy");
    expect(definition.options.map((option) => option.name)).toEqual(["Restful", "Maximum effort"]);
    expect(definition.options[0].id).toBe("energy_1");
    expect(updated.tasks[0].quantifierSelections).toEqual({});
    expect(updated.projects[0].quantifierSelections).toEqual({});
    expect(updated.referenceLists[0].quantifierSelections).toEqual({});
  });

  it("stores option icon names and rejects unknown Lucide references", () => {
    const data = createSeedData();
    const energy = data.quantifierDefinitions.find((definition) => definition.id === QUANTIFIER_IDS.energy)!;
    const updated = updateQuantifierDefinitionCommand(data, energy.id, {
      name: energy.name,
      options: energy.options.map((option, index) => ({ id: option.id, name: option.name, iconNames: index === 0 ? ["zap", "zap", "zap"] : [] })),
    });

    expect(updated.quantifierDefinitions.find((definition) => definition.id === energy.id)!.options[0].iconNames).toEqual(["zap", "zap", "zap"]);
    expect(invalidLucideIconNames(["zap", "battery-plus", "not-a-lucide-icon"])).toEqual(["not-a-lucide-icon"]);
  });

  it("stores optional option colours while preserving an omitted existing colour", () => {
    const data = createSeedData();
    const energy = data.quantifierDefinitions.find((definition) => definition.id === QUANTIFIER_IDS.energy)!;
    const coloured = updateQuantifierDefinitionCommand(data, energy.id, {
      name: energy.name,
      options: energy.options.map((option, index) => ({ id: option.id, name: option.name, color: index === 0 ? "var(--palette-aqua-light)" : null })),
    });
    const preserved = updateQuantifierDefinitionCommand(coloured, energy.id, {
      name: energy.name,
      options: energy.options.map((option) => ({ id: option.id, name: option.name })),
    });

    expect(coloured.quantifierDefinitions.find((definition) => definition.id === energy.id)!.options[0].color).toBe("var(--palette-aqua-light)");
    expect(preserved.quantifierDefinitions.find((definition) => definition.id === energy.id)!.options[0].color).toBe("var(--palette-aqua-light)");
  });
});
