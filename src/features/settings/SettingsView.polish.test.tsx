import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppData, createTagCommand, createTagGroupCommand } from "../../domain";
import { createSeedData } from "../../seed";
import { ConfigRow, QuantifierEditor, TagGroupHeading, buildTagSettingsGroups } from "./SettingsView";
import { StatusIcon } from "../../shared/components/StatusIcon";

afterEach(cleanup);

describe("configuration reorder handle", () => {
  it("renders an accessible Lucide handle without a textual handle", () => {
    const move = vi.fn();
    const { container } = render(<ConfigRow name="Waiting" color="#fff" metadata={[]} index={1} count={3} move={move} edit={() => undefined} />);
    const handle = screen.getByRole("button", { name: "Reorder Waiting" });
    expect(handle.querySelector("svg")).not.toBeNull();
    expect(container.textContent).not.toContain("::");
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(move).toHaveBeenCalledWith(-1);
  });

  it("does not render a handle when reordering is unavailable", () => {
    render(<ConfigRow name="Fixed" color="#fff" metadata={[]} index={0} count={1} edit={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Reorder Fixed" })).toBeNull();
  });

  it("shows a configured status icon marker and keeps mapped state inline", () => {
    const { container } = render(<ConfigRow name="Waiting" color="gold" marker={<StatusIcon icon="circle-pause" color="gold" />} metadata={["Open"]} inlineMetadata index={0} count={1} edit={() => undefined} />);
    expect(container.querySelector(".status-icon-marker svg")).not.toBeNull();
    expect(container.querySelector(".status-swatch")).toBeNull();
    expect(container.querySelector(".status-row__main--inline")?.textContent).toBe("WaitingOpen");
  });

  it("moves the dragged record before the highlighted target row", () => {
    const moveRelative = vi.fn();
    const values = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "none",
      setData: (type: string, value: string) => values.set(type, value),
      getData: (type: string) => values.get(type) ?? "",
    };
    render(<>
      <ConfigRow name="First" color="#fff" metadata={[]} index={0} count={2} move={() => undefined} moveRelative={moveRelative} reorderId="first" reorderScope="group" edit={() => undefined} />
      <ConfigRow name="Second" color="#fff" metadata={[]} index={1} count={2} move={() => undefined} moveRelative={moveRelative} reorderId="second" reorderScope="group" edit={() => undefined} />
    </>);
    const target = screen.getByRole("button", { name: "Edit First" }).closest(".status-row") as HTMLDivElement;
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 100, height: 100, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({}) });

    fireEvent.dragStart(screen.getByRole("button", { name: "Reorder Second" }), { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer, clientY: 25 });
    expect(target.classList.contains("drop-before")).toBe(true);
    fireEvent.drop(target, { dataTransfer, clientY: 25 });

    expect(moveRelative).toHaveBeenCalledWith("second", "first", "before");
  });
});

describe("Quantifier settings", () => {
  it("renames a dimension and its options and adds further options", async () => {
    const data = createSeedData();
    const definition = data.quantifierDefinitions[0];
    const commit = vi.fn(async () => true);
    render(<QuantifierEditor data={data} definition={definition} commit={commit} />);

    fireEvent.change(screen.getByLabelText("Energy dimension name"), { target: { value: "Capacity" } });
    fireEvent.change(screen.getByLabelText("Energy option 1"), { target: { value: "Restful" } });
    fireEvent.change(screen.getByLabelText("Energy option 1 icons"), { target: { value: "zap| zap |zap   " } });
    fireEvent.click(screen.getByRole("button", { name: "Add Option" }));
    fireEvent.change(screen.getByLabelText("Energy option 6"), { target: { value: "Maximum" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Capacity" }));

    expect(commit).toHaveBeenCalledOnce();
    const calls = commit.mock.calls as unknown as Array<[AppData]>;
    const next = calls[0][0];
    const saved = next.quantifierDefinitions.find((candidate) => candidate.id === definition.id)!;
    expect(saved.name).toBe("Capacity");
    expect(saved.options.map((option) => option.name)).toEqual(["Restful", "Low Energy", "Medium Energy", "High Energy", "It's a Whole Thing", "Maximum"]);
    expect(saved.options[0].iconNames).toEqual(["zap", "zap", "zap"]);
    expect(saved.options.at(-1)?.iconNames).toEqual([]);
  });

  it("shows an inline error and does not commit unknown Lucide option icons", async () => {
    const data = createSeedData();
    const definition = data.quantifierDefinitions[0];
    const commit = vi.fn(async () => true);
    render(<QuantifierEditor data={data} definition={definition} commit={commit} />);

    fireEvent.change(screen.getByLabelText("Energy option 1 icons"), { target: { value: "not-real" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Energy" }));

    expect(await screen.findByText("Unknown Lucide icon: not-real.")).toBeInTheDocument();
    expect(commit).not.toHaveBeenCalled();
  });

  it("accepts battery-plus from the installed Lucide catalogue", () => {
    const data = createSeedData();
    const definition = data.quantifierDefinitions[0];
    const commit = vi.fn(async () => true);
    render(<QuantifierEditor data={data} definition={definition} commit={commit} />);

    fireEvent.change(screen.getByLabelText("Energy option 1 icons"), { target: { value: "battery-plus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Energy" }));

    expect(commit).toHaveBeenCalledOnce();
    const calls = commit.mock.calls as unknown as Array<[AppData]>;
    expect(calls[0][0].quantifierDefinitions[0].options[0].iconNames).toEqual(["battery-plus"]);
  });
});

describe("Tag settings grouping", () => {
  it("orders active Tag Groups first and Loose Tags last", () => {
    let data = createSeedData();
    data = createTagGroupCommand(data, { name: "Context", description: "", mutuallyExclusive: false });
    const context = data.tagGroups.find((group) => group.name === "Context")!;
    data = createTagCommand(data, { name: "Office", description: "", color: "red", allowedScopes: ["task"], tagGroupId: context.id });
    data = createTagCommand(data, { name: "Loose note", description: "", color: "blue", allowedScopes: ["task"], tagGroupId: null });

    const groups = buildTagSettingsGroups(data);

    expect(groups.map((group) => group.name)).toEqual(["Energy", "Context", "Loose"]);
    expect(groups.at(-1)?.tags.map((tag) => tag.name)).toEqual(["Loose note"]);
    expect(groups[0].color).toBe(data.tagGroups[0].color);
  });

  it("shows grouped Tag colour on the name without rendering an individual swatch", () => {
    const { container } = render(<ConfigRow name="Focused" color="red" nameColor="blue" showColor={false} inlineMetadata metadata={["Tasks, Projects"]} index={0} count={1} edit={() => undefined} />);
    expect(container.querySelector(".status-swatch")).toBeNull();
    expect(container.querySelector("strong")?.style.color).toBe("blue");
    expect(container.querySelector(".status-row__main--inline")?.textContent).toBe("FocusedTasks, Projects");
  });

  it("renders an accessible up/down disclosure before the group colour", () => {
    const toggle = vi.fn();
    const { container, rerender } = render(<TagGroupHeading id="energy" contentId="energy-tags" name="Energy" color="red" expanded toggle={toggle} />);
    const expanded = screen.getByRole("button", { name: "Collapse Energy" });
    expect(expanded.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(".tag-settings-group__heading")?.firstElementChild).toBe(expanded);
    fireEvent.click(expanded);
    expect(toggle).toHaveBeenCalledOnce();
    rerender(<TagGroupHeading id="energy" contentId="energy-tags" name="Energy" color="red" expanded={false} toggle={toggle} />);
    expect(screen.getByRole("button", { name: "Expand Energy" }).getAttribute("aria-expanded")).toBe("false");
  });
});
