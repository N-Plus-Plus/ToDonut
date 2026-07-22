import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSeedData } from "../../seed";
import { QuantifierFields } from "./QuantifierFields";

describe("QuantifierFields", () => {
  it("keeps full option names in selectors when compact metadata uses custom icons", () => {
    const data = createSeedData();
    data.quantifierDefinitions[0].options[0].iconNames = ["zap"];
    const onChange = vi.fn();
    render(<QuantifierFields data={data} value={{}} onChange={onChange} />);

    expect(screen.getByRole("option", { name: "Relaxed" })).toBeInTheDocument();
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "energy_1" } });
    expect(onChange).toHaveBeenCalledWith({ quantifier_energy: "energy_1" });
  });
});
