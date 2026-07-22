import { describe, expect, it } from "vitest";
import { moveId, moveIdBefore, nextIntegerOrder } from "./ordering";

describe("ordering", () => {
  it("moves ids up and down stably", () => {
    expect(moveId(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
  });

  it("moves ids before a target and inserts after current max order", () => {
    expect(moveIdBefore(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
    expect(nextIntegerOrder([{ order: 2 }, { order: 7 }])).toBe(8);
  });
});
