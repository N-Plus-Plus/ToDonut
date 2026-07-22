import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "./validators";

describe("validators", () => {
  it("accepts safe http and https URLs", () => {
    expect(safeHttpUrl("https://example.com").valid).toBe(true);
    expect(safeHttpUrl("http://example.com").valid).toBe(true);
  });

  it("rejects invalid protocols", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toMatchObject({ valid: false, code: "invalid-protocol" });
  });
});
