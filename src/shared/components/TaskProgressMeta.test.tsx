import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskProgressMeta } from "./TaskProgressMeta";

describe("TaskProgressMeta", () => {
  it("uses the established Task icon and the shared baseline-safe inline structure", () => {
    const { container } = render(<TaskProgressMeta>40% closed · 3 open</TaskProgressMeta>);

    const progress = screen.getByText("40% closed · 3 open").closest(".task-progress-meta");
    expect(progress).toHaveClass("inline-icon-text");
    expect(container.querySelector(".lucide-list-todo")).not.toBeNull();
  });
});
