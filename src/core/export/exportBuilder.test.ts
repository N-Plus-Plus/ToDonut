import { describe, expect, it } from "vitest";
import { createSeedData } from "../../seed";
import { buildInfo } from "../build/buildInfo";
import { buildSafeExport } from "./exportBuilder";

describe("export builder", () => {
  const sync = { initialSyncComplete: true, canonicalStateKnown: true, canonicalRevision: 7, lastConfirmedRevision: 7, lastAuthoritativeSnapshotAt: "2026-07-01T00:00:00.000Z", lastSuccessfulSyncAt: "2026-07-01T00:00:00.000Z" };

  it("uses the central version source", () => {
    const result = buildSafeExport(createSeedData(), sync, { pendingCount: 0, failedCount: 0, currentSummary: "None", lastFailureCategory: "None" });
    expect(result.safe && result.envelope.applicationVersion).toBe(buildInfo.applicationVersion);
  });

  it("includes the confirmed canonical revision", () => {
    const result = buildSafeExport(createSeedData(), sync, { pendingCount: 0, failedCount: 0, currentSummary: "None", lastFailureCategory: "None" });
    expect(result.safe && result.envelope.providerMetadata.canonicalRevision).toBe(7);
  });

  it("blocks export when mutation state is unsafe", () => {
    const result = buildSafeExport(createSeedData(), sync, { pendingCount: 1, failedCount: 0, currentSummary: "Saving", lastFailureCategory: "None" });
    expect(result).toMatchObject({ safe: false });
  });

  it("includes full-fidelity hidden market state and locked terms without UI previews", () => {
    const data = createSeedData();
    data.bakery.activeContracts = [{ id: "sale", productId: "sprinkle-donut", askingPrice: 3, marketPrice: 3, demandAtListing: 50, listedAt: "2026-07-01T00:00:00.000Z", durationMs: 28_800_000, completesAt: "2026-07-01T08:00:00.000Z", completionIdempotencyKey: "sale:complete", state: "active" }];
    const result = buildSafeExport(data, sync, { pendingCount: 0, failedCount: 0, currentSummary: "None", lastFailureCategory: "None" });
    expect(result.safe && result.envelope.domain.bakery.productMarkets[0]).toMatchObject({ productId: "sprinkle-donut", demand: 50 });
    expect(result.safe && result.envelope.domain.bakery.activeContracts[0]).toMatchObject({ marketPrice: 3, demandAtListing: 50, completesAt: "2026-07-01T08:00:00.000Z" });
    expect(JSON.stringify(result)).not.toContain("askingPricePreview");
  });
});
