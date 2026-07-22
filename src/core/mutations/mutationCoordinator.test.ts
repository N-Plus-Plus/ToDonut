import { describe, expect, it } from "vitest";
import { updateTaskRecord } from "../../domain";
import { CanonicalSnapshot, LocalDevelopmentProvider, PersistenceProvider, ProviderDiagnostics } from "../../persistence";
import { MutationCoordinator } from "./mutationCoordinator";

describe("mutation coordinator", () => {
  it("moves pending operations to confirmed diagnostics", async () => {
    const provider = new LocalDevelopmentProvider();
    localStorage.clear();
    const current = await provider.load();
    const next = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Confirmed" }, "titleChanged", "Confirmed");
    const coordinator = new MutationCoordinator();
    await coordinator.submit(provider, { name: "Save task", current: current.data, data: next, expectedRevision: current.canonicalRevision, expectedIds: [current.data.tasks[0].id], applyOptimistic: () => undefined, onConfirmed: () => undefined, onFailed: () => undefined });
    expect(coordinator.diagnostics()).toMatchObject({ pendingCount: 0, failedCount: 0, currentSummary: "None", lastConfirmedRevision: 2 });
  });

  it("preserves failed state and classifies conflicts", async () => {
    const provider = new LocalDevelopmentProvider();
    localStorage.clear();
    const current = await provider.load();
    await provider.replace({ next: updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Stored" }, "titleChanged", "Stored"), expectedRevision: current.canonicalRevision, operationId: "stored", expectedVersions: new Map([[current.data.tasks[0].id, current.data.tasks[0].version]]) });
    const stale = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Stale" }, "titleChanged", "Stale");
    const coordinator = new MutationCoordinator();
    await coordinator.submit(provider, { name: "Save stale", current: current.data, data: stale, expectedRevision: current.canonicalRevision, expectedIds: [current.data.tasks[0].id], applyOptimistic: () => undefined, onConfirmed: () => undefined, onFailed: () => undefined, retryDelayMs: 1 });
    expect(coordinator.diagnostics()).toMatchObject({ pendingCount: 0, failedCount: 1, conflictCount: 1, lastFailureCategory: "Conflict" });
  });

  it("releases recovery data after discard", async () => {
    const provider = new LocalDevelopmentProvider();
    localStorage.clear();
    const current = await provider.load();
    await provider.replace({ next: updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Stored" }, "titleChanged", "Stored"), expectedRevision: current.canonicalRevision, operationId: "stored" });
    const stale = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Stale" }, "titleChanged", "Stale");
    const coordinator = new MutationCoordinator();
    await coordinator.submit(provider, { name: "Save stale", current: current.data, data: stale, expectedRevision: current.canonicalRevision, applyOptimistic: () => undefined, onConfirmed: () => undefined, onFailed: () => undefined, retryDelayMs: 1 });
    const operation = coordinator.unresolvedOperations()[0];
    expect(coordinator.discard(operation.id)).toEqual(current.data);
    expect(coordinator.unresolvedOperations()).toHaveLength(0);
  });

  it("retries transient failures within the configured limit", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const next = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Retried" }, "titleChanged", "Retried");
    const flaky = new FlakyProvider(provider, 2);
    const coordinator = new MutationCoordinator();

    await coordinator.submit(flaky, { name: "Save flaky", current: current.data, data: next, expectedRevision: current.canonicalRevision, applyOptimistic: () => undefined, onConfirmed: () => undefined, onFailed: () => undefined, retries: 2, retryDelayMs: 1 });

    expect(flaky.calls).toBe(3);
    expect(coordinator.diagnostics()).toMatchObject({ failedCount: 0, lastConfirmedRevision: 2 });
  });

  it("keeps exhausted transient failures visible as failed", async () => {
    localStorage.clear();
    const provider = new LocalDevelopmentProvider();
    const current = await provider.load();
    const next = updateTaskRecord(current.data, current.data.tasks[0].id, { title: "Not saved" }, "titleChanged", "Not saved");
    const flaky = new FlakyProvider(provider, 4);
    const coordinator = new MutationCoordinator();

    await coordinator.submit(flaky, { name: "Save exhausted", current: current.data, data: next, expectedRevision: current.canonicalRevision, applyOptimistic: () => undefined, onConfirmed: () => undefined, onFailed: () => undefined, retries: 2, retryDelayMs: 1 });

    expect(flaky.calls).toBe(3);
    expect(coordinator.diagnostics()).toMatchObject({ failedCount: 1, conflictCount: 0, lastFailureCategory: "connection" });
    expect(coordinator.unresolvedOperations()[0].recoveryActions).toContain("retry");
  });
});

class FlakyProvider implements PersistenceProvider {
  readonly label = "Flaky test provider";
  readonly productionReady = false;
  readonly backendProvider = "local-development" as const;
  calls = 0;
  constructor(private readonly inner: LocalDevelopmentProvider, private failuresRemaining: number) {}
  diagnostics(): ProviderDiagnostics { return this.inner.diagnostics(); }
  load(): Promise<CanonicalSnapshot> { return this.inner.load(); }
  async replace(request: Parameters<PersistenceProvider["replace"]>[0]): Promise<CanonicalSnapshot> {
    this.calls += 1;
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new Error("Network timeout");
    }
    return this.inner.replace(request);
  }
}
