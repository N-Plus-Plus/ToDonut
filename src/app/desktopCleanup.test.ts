import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const styles = readFileSync(resolve(root, "src/styles.css"), "utf8").replace(/\r\n/g, "\n");
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

  it("keeps mobile filters collapsed behind the top-bar Filter disclosure", () => {
    expect(appSource).toContain("mobileFiltersOpen");
    expect(appSource).toContain('aria-label={mobileFiltersOpen ? "Hide filters" : "Show filters"}');
    expect(appSource).toContain("<Filter aria-hidden=\"true\" />");
    expect(styles).toContain(".workspace:not(.mobile-filters-open) .view-controls { display: none; }");
    expect(styles).toContain("justify-content: space-between;");
  });

  it("vertically centres narrow top-bar controls with the page title", () => {
    expect(styles).toContain(".topbar { position: relative; display: block; min-height: var(--size-control-prominent); margin-bottom: var(--space-5); }");
    expect(styles).toContain(".topbar-actions { position: absolute; inset-block-start: 50%; inset-inline-end: 0; display: flex; justify-content: flex-end; transform: translateY(-50%); }");
    expect(styles).toContain(".application-menu__panel");
    expect(styles).toContain("right: 0;");
    expect(styles).toContain("margin-inline-start: 0.75rem; margin-inline-end: 0.5rem;");
  });

  it("uses left-opening action menus for mobile Task and List cards", () => {
    expect(appSource).toContain('Open actions for ${list.title}');
    expect(styles).toContain(".task-row-actions > .card-action-menu--mobile { display: block; }");
    expect(styles).toContain(".reference-list-row > .card-action-menu--mobile { display: block; }");
  });

  it("keeps fixed mobile overlays out of document flow and reserves dock clearance once", () => {
    expect(styles).toContain(".fab-wrap { position: fixed;");
    expect(styles).toContain(".app-shell { grid-template-columns: 1fr; height: auto; min-height: 100vh; overflow: visible; }");
    expect(styles).toContain(".workspace { height: auto; overflow: visible; padding:");
  });

  it("uses the shared mobile card action pattern and four-column Trash tabs", () => {
    expect(appSource).toContain('CardActionMenu, CardActionMenuItem } from "../shared/components/CardActionMenu"');
    expect(appSource).toContain("area-card-row");
    expect(styles).toContain(".project-card-row > .card-action-menu--mobile");
    expect(styles).toContain(".reference-list-row__actions { display: none; }");
    expect(styles).toContain(".hidden-tabs { width: 100%; grid-template-columns: repeat(4, minmax(0, 1fr));");
  });

  it("keeps the first mobile List, Project and Area card at the shared title-to-content spacing", () => {
    expect(appSource).toContain('className="task-section list-browser-view"');
    expect(appSource).toContain('className="task-section project-area-browser"');
    expect(appSource).toContain('className="task-section project-area-browser__content"');
    expect(styles).toContain(".list-browser-view,\n  .project-area-browser,\n  .project-area-browser__content { margin-top: 0; }");
  });

  it("uses compact configuration menus, reduced leading inset and centred visual-viewport modals", () => {
    expect(styles).toContain(".status-row--priority-action-grid .status-row__actions,");
    expect(styles).toContain(".status-row--priority-action-grid > .card-action-menu--mobile,");
    expect(styles).toContain(".list-browser__row { padding-inline-start: var(--space-2); }");
    expect(styles).toContain("transform: translateY(var(--modal-centre-shift, 0));");
    expect(styles).not.toContain(".modal-backdrop { align-items: end;");
  });
});
