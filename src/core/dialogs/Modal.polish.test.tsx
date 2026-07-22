import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Modal } from "./Modal";

describe("Modal close control", () => {
  it("uses an accessible icon button", () => {
    render(<Modal title="Example" onClose={() => undefined}><p>Content</p></Modal>);
    const close = screen.getByRole("button", { name: "Close dialog" });
    expect(close.querySelector("svg")).not.toBeNull();
    expect(close.textContent).toBe("");
  });
});
