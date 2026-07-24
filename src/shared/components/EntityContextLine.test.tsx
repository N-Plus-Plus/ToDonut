import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createSeedData } from "../../seed";
import { EntityContextLine, QuantifierTitleIcons, entityContextsForLocation, quantifierContextsForSelections, quantifierMetadataContextsForSelections } from "./EntityContextLine";
import { QUANTIFIER_IDS } from "../../domain";

describe("EntityContextLine", () => {
  afterEach(cleanup);

  it("orders Area before Project, uses their established icons and colours titles independently", () => {
    const data = createSeedData();
    const project = data.projects[0];
    const area = data.areas[0];
    const items = entityContextsForLocation(data, { type: "project", projectId: project.id });
    const { container } = render(<EntityContextLine items={[...items].reverse()} />);

    expect(container.textContent).toBe(`${area.title}, ${project.title}`);
    expect(container.querySelector(".lucide-land-plot")).not.toBeNull();
    expect(container.querySelector(".lucide-folder-kanban")).not.toBeNull();
    expect(screen.getByLabelText(`Area: ${area.title}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Project: ${project.title}`)).toBeInTheDocument();
    expect(screen.getByText(area.title)).toHaveStyle({ color: area.color });
    expect(screen.getByText(project.title)).toHaveStyle({ color: project.color });
  });

  it("places Zap Energy and Component Context after Area and Project", () => {
    const data = createSeedData();
    data.quantifierDefinitions[0].options[2].color = "var(--palette-aqua-light)";
    const project = data.projects[0];
    const { container } = render(<EntityContextLine items={[
      ...entityContextsForLocation(data, { type: "project", projectId: project.id }),
      ...quantifierContextsForSelections(data, { [QUANTIFIER_IDS.energy]: "energy_3", [QUANTIFIER_IDS.context]: "context_5" }),
    ]} />);
    expect(container.textContent).toBe(`${data.areas[0].title}, ${project.title}, Medium Energy, Digital`);
    expect(container.querySelector(".lucide-zap")).not.toBeNull();
    expect(container.querySelector(".lucide-component")).not.toBeNull();
    expect(container.querySelectorAll(".inline-icon-text")).toHaveLength(4);
    expect(container.querySelector(".entity-context-line__item--quantifier")).toHaveStyle({ color: "var(--palette-aqua-light)" });
  });

  it("summarises a configured option as its ordered icon sequence while retaining its accessible full name", () => {
    const data = createSeedData();
    data.quantifierDefinitions[0].options[0].iconNames = ["zap", "zap", "zap"];
    const { container } = render(<EntityContextLine items={quantifierContextsForSelections(data, { [QUANTIFIER_IDS.energy]: "energy_1" })} />);

    expect(container.querySelectorAll(".lucide-icon-sequence .lucide-zap")).toHaveLength(3);
    expect(container).not.toHaveTextContent("Relaxed");
    expect(screen.getByLabelText("Energy: Relaxed")).toBeInTheDocument();
  });

  it("separates configured title icons from metadata fallbacks in definition order", async () => {
    const data = createSeedData();
    data.quantifierDefinitions[0].options[0].iconNames = ["battery-plus"];
    const selections = { [QUANTIFIER_IDS.energy]: "energy_1", [QUANTIFIER_IDS.context]: "context_6" };
    const { container } = render(<>
      <strong><span>Entity</span><QuantifierTitleIcons data={data} selections={selections} /></strong>
      <EntityContextLine items={quantifierMetadataContextsForSelections(data, selections)} />
    </>);

    expect(screen.getByLabelText("Energy: Relaxed").closest("strong")).not.toBeNull();
    await waitFor(() => expect(container.querySelector("strong .lucide-battery-plus")).not.toBeNull());
    expect(container.querySelector(".entity-context-line")).toHaveTextContent("Relationship");
    expect(container.querySelector(".entity-context-line .lucide-component")).not.toBeNull();
    expect(container.querySelector(".entity-context-line .lucide-battery-plus")).toBeNull();
  });
});
