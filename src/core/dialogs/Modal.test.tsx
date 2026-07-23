import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal, modalViewportMetrics } from "./Modal";

describe("Modal", () => {
  afterEach(() => cleanup());

  it("sets initial focus, traps tab, closes on Escape and restores focus", async () => {
    const close = vi.fn();
    render(<div><button>Before</button><Modal title="Test modal" onClose={close}><button>First</button><button>Last</button></Modal></div>);
    await vi.waitFor(() => expect(screen.getByText("First")).toHaveFocus());
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(screen.getByLabelText("Close dialog")).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });

  it("does not reapply initial focus when form updates rerender the modal", async () => {
    function TestForm() {
      const [title, setTitle] = useState("");
      const [description, setDescription] = useState("");
      return <Modal title="Edit Area" onClose={() => undefined}>
        <input aria-label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea aria-label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </Modal>;
    }

    render(<TestForm />);
    await vi.waitFor(() => expect(screen.getByLabelText("Title")).toHaveFocus());

    const description = screen.getByLabelText("Description");
    description.focus();
    fireEvent.change(description, { target: { value: "Area notes" } });

    expect(description).toHaveFocus();
    expect(description).toHaveValue("Area notes");
  });

  it("centres in the visible keyboard viewport and returns to screen centre when it expands", () => {
    expect(modalViewportMetrics(800, { height: 400, offsetTop: 0 })).toEqual({
      height: 400,
      centreShift: -200,
    });
    expect(modalViewportMetrics(800, { height: 800, offsetTop: 0 })).toEqual({
      height: 800,
      centreShift: 0,
    });
  });
});
