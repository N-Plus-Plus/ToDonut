import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ReferenceListLocation } from "../domain";
import { createSeedData } from "../seed";
import { ListLocationSelector } from "./App";

describe("ListLocationSelector", () => {
  afterEach(cleanup);

  it("resolves an exact typed Project title without requiring a suggestion click", () => {
    const data = createSeedData();
    const project = data.projects.find((candidate) => !candidate.deletedAt && !candidate.archivedAt && !candidate.completedAt)!;

    function Harness() {
      const [value, setValue] = useState<ReferenceListLocation>({ type: "loose" });
      return <><ListLocationSelector data={data} value={value} setValue={setValue} currentList={null} /><output aria-label="location">{JSON.stringify(value)}</output></>;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Project" }), { target: { value: project.title } });

    expect(screen.getByLabelText("location")).toHaveTextContent(JSON.stringify({ type: "project", projectId: project.id }));
  });
});
