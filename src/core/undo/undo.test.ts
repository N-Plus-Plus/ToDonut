import { describe, expect, it, vi } from "vitest";
import { UndoService } from "./undoService";

describe("undo service", () => {
  it("expires safely and prevents duplicate reversal", async () => {
    const run = vi.fn();
    const service = new UndoService();
    service.register({ id: "one", label: "Undo", expiresAt: 100, run });
    expect(service.active(50)?.id).toBe("one");
    expect(service.active(150)).toBeNull();
    service.register({ id: "two", label: "Undo", expiresAt: 200, run });
    expect(await service.execute("two", 150)).toBe(true);
    expect(await service.execute("two", 150)).toBe(false);
    expect(run).toHaveBeenCalledOnce();
  });
});
