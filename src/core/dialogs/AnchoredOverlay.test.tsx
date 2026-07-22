import { describe, expect, it } from "vitest";
import { anchoredOverlayPosition } from "./AnchoredOverlay";

describe("anchored overlay positioning", () => {
  it("flips above and clamps to the viewport", () => {
    expect(anchoredOverlayPosition(
      { top: 500, bottom: 540, left: 350, right: 600 },
      { width: 300, height: 520 },
      { width: 640, height: 600 },
      "start",
    )).toEqual({ top: 6, left: 334 });
  });

  it("supports end alignment without overflowing either horizontal edge", () => {
    expect(anchoredOverlayPosition(
      { top: 40, bottom: 80, left: 8, right: 48 },
      { width: 300, height: 200 },
      { width: 320, height: 600 },
      "end",
    )).toEqual({ top: 86, left: 6 });
  });
});
