import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const styles = readFileSync(resolve(root, "src/styles.css"), "utf8");
const appSource = readFileSync(resolve(root, "src/app/App.tsx"), "utf8");

describe("desktop cleanup contracts", () => {
  it("keeps the desktop sidebar at the documented compact width", () => {
    expect(styles).toContain("--size-sidebar: 10.5rem;");
    expect(styles).toContain("grid-template-columns: var(--size-sidebar) minmax(0, 1fr)");
  });

  it("uses the larger top-aligned application hamburger without changing row actions", () => {
    expect(styles).toContain(".application-menu > .icon-button");
    expect(styles).toContain("min-height: 46px;");
    expect(styles).toContain("width: 29px;");
    expect(styles).toContain(".topbar {\n  display: flex;\n  align-items: flex-start;");
    expect(styles).toContain(".task-row-actions .task-action-button");
  });

  it("keeps Show Closed visible immediately before the right-aligned More control", () => {
    const actionGroupStart = appSource.indexOf('<div className="view-controls__actions">');
    const showClosedStart = appSource.indexOf("<ShowClosedIconToggle", actionGroupStart);
    const moreStart = appSource.indexOf('className="button ghost view-more-toggle"', actionGroupStart);

    expect(styles).toContain(".view-controls__actions");
    expect(styles).toContain(".view-controls__actions .show-closed-toggle");
    expect(appSource).toContain("EyeClosed");
    expect(showClosedStart).toBeGreaterThan(actionGroupStart);
    expect(moreStart).toBeGreaterThan(showClosedStart);
    expect(appSource).not.toContain("Tags (all selected)");
    expect(appSource).not.toContain('type="checkbox"\n              role="switch"');
  });

  it("uses the completion animation window and reduced-motion bypass for hidden closed rows", () => {
    expect(appSource).toContain("export const TASK_COMPLETION_EXIT_BUFFER_MS = 250;");
    expect(appSource).toContain("export const TASK_COMPLETION_EXIT_MS = TASK_COMPLETION_ANIMATION_MS + TASK_COMPLETION_EXIT_BUFFER_MS;");
    expect(appSource).toContain("prefers-reduced-motion: reduce");
    expect(appSource).toContain("exitingCompletedTasks");
  });

  it("documents the shared Tags row add action without the old tag wording", () => {
    expect(appSource).toContain('addLabel="+ Add"');
    expect(appSource).toContain('addAriaLabel="Add Tag filter"');
    expect(styles).toContain(".view-controls__filter-row");
  });
});
