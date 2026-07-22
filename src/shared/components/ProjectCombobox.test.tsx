import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSeedData } from "../../seed";
import { ProjectCombobox, projectIdForExactTitle } from "./ProjectCombobox";

describe("ProjectCombobox", () => {
  afterEach(cleanup);

  it("resolves a unique exact title after trimming and without case sensitivity", () => {
    const projects = createSeedData().projects;
    expect(projectIdForExactTitle(projects, `  ${projects[0].title.toUpperCase()} `)).toBe(projects[0].id);
    expect(projectIdForExactTitle([...projects, { ...projects[0], id: "duplicate" }], projects[0].title)).toBeNull();
  });

  it("filters suggestions and returns the selected Project ID", () => {
    const projects = createSeedData().projects;
    const onTextChange = vi.fn();
    const onProjectChange = vi.fn();
    render(<ProjectCombobox projects={projects} text="Shape" selectedProjectId={null} onTextChange={onTextChange} onProjectChange={onProjectChange} />);

    fireEvent.focus(screen.getByRole("combobox", { name: "Project" }));
    fireEvent.click(screen.getByRole("option", { name: projects[0].title }));

    expect(onTextChange).toHaveBeenCalledWith(projects[0].title);
    expect(onProjectChange).toHaveBeenCalledWith(projects[0].id);
  });
});
