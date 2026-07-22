import { describe, expect, it } from "vitest";
import { mondayOfWeek, nineWeekDateGrid, parseAustralianDate } from "./dateService";

describe("Australian date parsing", () => {
  it("parses accepted manual Australian date formats", () => {
    expect(parseAustralianDate("1/7/26")).toEqual({ valid: true, date: "2026-07-01" });
    expect(parseAustralianDate("01/07/2026")).toEqual({ valid: true, date: "2026-07-01" });
  });

  it("rejects impossible dates without reinterpretation", () => {
    expect(parseAustralianDate("31/2/26").valid).toBe(false);
    expect(parseAustralianDate("0/12/26").valid).toBe(false);
    expect(parseAustralianDate("1/13/26").valid).toBe(false);
  });
});

describe("nine-week date grid", () => {
  it("contains 63 days beginning Monday of the current local week", () => {
    const start = mondayOfWeek("2026-07-01");
    const grid = nineWeekDateGrid("2026-07-01", null, start);

    expect(grid).toHaveLength(63);
    expect(grid[0].date).toBe("2026-06-29");
  });

  it("identifies the middle month from the central portion", () => {
    const grid = nineWeekDateGrid("2026-07-01", "2026-07-10", "2026-06-29");

    expect(grid.find((cell) => cell.date === "2026-07-01")?.middleMonth).toBe(true);
    expect(grid.find((cell) => cell.date === "2026-06-30")?.middleMonth).toBe(false);
    expect(grid.find((cell) => cell.date === "2026-07-10")?.selected).toBe(true);
  });
});
