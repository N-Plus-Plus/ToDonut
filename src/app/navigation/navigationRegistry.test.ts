import { describe, expect, it, vi } from "vitest";
import { desktopNav, mobileDock, runRouteCleanup } from "./navigationRegistry";

describe("navigation registry", () => {
  it("derives desktop and exact mobile dock order from one registry", () => {
    expect(desktopNav.map((item) => item.label)).toEqual(["Today", "Inbox", "Tasks", "Lists", "Projects", "Areas", "Bakery", "Upcoming", "Overdue", "Someday", "Trash", "Settings"]);
    expect(mobileDock[0].map((item) => item.label)).toEqual(["Today", "Inbox", "Tasks", "Lists", "Projects", "Upcoming"]);
    expect(mobileDock[1].map((item) => item.label)).toEqual(["Areas", "Overdue", "Someday", "Trash", "Bakery", "Settings"]);
  });

  it("runs route cleanup callbacks", () => {
    const first = vi.fn();
    const second = vi.fn();
    runRouteCleanup([first, second]);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});
