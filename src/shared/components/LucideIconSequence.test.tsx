import "@testing-library/jest-dom/vitest";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LucideIconSequence } from "./LucideIconSequence";

describe("LucideIconSequence", () => {
  it("loads installed Lucide icons outside the eager fallback pair", async () => {
    const { container } = render(<LucideIconSequence iconNames={["battery-plus"]} label="Capacity context" />);

    await waitFor(() => expect(container.querySelector(".lucide-battery-plus")).not.toBeNull());
    expect(container.querySelector(".lucide-icon-sequence")).toHaveAttribute("aria-label", "Capacity context");
  });
});
