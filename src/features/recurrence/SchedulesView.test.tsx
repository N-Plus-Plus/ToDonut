import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppData } from "../../domain";
import { createSeedData } from "../../seed";
import { ScheduleEditor } from "./SchedulesView";

describe("ScheduleEditor Task placement", () => {
  afterEach(cleanup);

  it("offers blank Area before Inbox-default Destination, with Priority below, and preserves an Area location when editing", async () => {
    const data = createSeedData();
    const area = data.areas[0];
    const commit = vi.fn(async () => undefined);
    render(<ScheduleEditor data={data} mode={{ type: "create" }} onClose={vi.fn()} commit={commit} />);

    fireEvent.click(screen.getByRole("button", { name: "Task" }));
    const areaField = screen.getByLabelText("Area");
    const destinationField = screen.getByLabelText("Destination");
    const priorityField = screen.getByLabelText("Priority");
    expect(areaField).toHaveValue("");
    expect(destinationField).toHaveValue("");
    expect(areaField.compareDocumentPosition(destinationField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(destinationField.compareDocumentPosition(priorityField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Area schedule task" } });
    fireEvent.change(areaField, { target: { value: area.id } });
    fireEvent.change(screen.getByLabelText("Energy"), { target: { value: "energy_2" } });
    expect(areaField).toHaveStyle({ color: area.color });
    fireEvent.click(screen.getByRole("button", { name: "Create Schedule" }));

    await waitFor(() => expect(commit).toHaveBeenCalledOnce());
    const calls = commit.mock.calls as unknown as Array<[AppData]>;
    const saved = calls[0][0];
    const rule = saved.recurrenceRules.at(-1)!;
    expect(rule.template.location).toEqual({ type: "area", areaId: area.id });
    expect(rule.template.quantifierSelections).toEqual({ quantifier_energy: "energy_2" });

    cleanup();
    render(<ScheduleEditor data={saved} mode={{ type: "edit", ruleId: rule.id }} onClose={vi.fn()} commit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Task" }));
    expect(screen.getByLabelText("Area")).toHaveValue(area.id);
    expect(screen.getByLabelText("Destination")).toHaveValue("");
  });

  it("uses a circular Lucide toggle for occurrence-date due dates", () => {
    render(<ScheduleEditor data={createSeedData()} mode={{ type: "create" }} onClose={vi.fn()} commit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Task" }));
    const toggle = screen.getByRole("checkbox", { name: "Due Date equals occurrence date" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle.querySelector(".lucide-circle-check")).not.toBeNull();
    expect(toggle.querySelector(".circle-checkbox__icon")).toHaveStyle({ color: "var(--palette-mint-light)" });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle.querySelector(".lucide-circle")).not.toBeNull();
  });
});
