import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircleCheckbox } from "./CircleCheckbox";

describe("CircleCheckbox", () => {
  afterEach(cleanup);

  it("uses Circle when unchecked and CircleCheck with mint when checked", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CircleCheckbox checked={false} onChange={onChange}>Option</CircleCheckbox>);
    const checkbox = screen.getByRole("checkbox", { name: "Option" });
    expect(checkbox.querySelector(".lucide-circle")).not.toBeNull();
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<CircleCheckbox checked onChange={onChange}>Option</CircleCheckbox>);
    const icon = checkbox.querySelector(".circle-checkbox__icon");
    expect(icon?.querySelector(".lucide-circle-check")).not.toBeNull();
    expect(icon).toHaveStyle({ color: "var(--palette-mint-light)" });
  });

  it("uses an associated entity colour for the checked icon", () => {
    render(<CircleCheckbox checked checkedColor="var(--palette-grapefruit-light)" onChange={vi.fn()}>Coloured Area</CircleCheckbox>);
    expect(screen.getByRole("checkbox", { name: "Coloured Area" }).querySelector(".circle-checkbox__icon")).toHaveStyle({ color: "var(--palette-grapefruit-light)" });
  });
});
