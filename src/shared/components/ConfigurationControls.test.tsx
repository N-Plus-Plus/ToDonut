import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSeedData } from "../../seed";
import { SharedTagPicker } from "./ConfigurationControls";

describe("SharedTagPicker", () => {
  afterEach(() => cleanup());

  it("portals its menu outside a modal overflow boundary", () => {
    render(
      <div className="modal">
        <SharedTagPicker
          data={createSeedData()}
          scope="task"
          selectedIds={[]}
          setSelectedIds={vi.fn()}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));

    const menu = document.querySelector(".tag-menu");
    expect(menu).not.toBeNull();
    expect(menu?.parentElement).toBe(document.body);
    expect(menu).toHaveClass("anchored-dropdown");
  });
});
