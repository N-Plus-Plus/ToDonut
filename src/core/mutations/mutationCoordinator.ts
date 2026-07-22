import { AppData } from "../../domain";
import { ConflictError, PersistenceProvider, findMutableRecord } from "../../persistence";
import { retryOperation } from "../../optimistic";
import { ApplicationError, normaliseApplicationError } from "../errors/applicationErrors";

export type MutationOperationState = "pending" | "retrying" | "confirmed" | "failed" | "conflicted" | "discarded";
export type MutationRecoveryAction = "retry" | "discard" | "reload";

export interface MutationDiagnostics {
  pendingCount: number;
  retryingCount: number;
  failedCount: number;
  conflictCount: number;
  currentSummary: string;
  lastFailureCategory: string;
  lastSuccessfulMutationAt: string | null;
  lastConfirmedRevision: number | null;
  lastFailedOperationId: string | null;
  trusted: boolean;
}

export interface MutationRequest {
  name: string;
  data: AppData;
  current: AppData;
  expectedRevision: number;
  expectedIds?: string[];
  applyOptimistic: (next: AppData) => void;
  onConfirmed: (saved: AppData, confirmedAt: string, confirmedRevision: number) => void;
  onFailed: (error: ApplicationError, operation: MutationOperation) => void;
  retries?: number;
  retryDelayMs?: number;
}

export interface MutationOperation {
  id: string;
  name: string;
  expectedRevision: number;
  previous: AppData;
  next: AppData;
  affectedEntities: string[];
  attemptCount: number;
  state: MutationOperationState;
  error: ApplicationError | null;
  recoveryActions: MutationRecoveryAction[];
  confirmedRevision: number | null;
}

export class MutationCoordinator {
  private operations = new Map<string, MutationOperation>();
  private diagnosticsState: MutationDiagnostics = {
    pendingCount: 0,
    retryingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    currentSummary: "None",
    lastFailureCategory: "None",
    lastSuccessfulMutationAt: null,
    lastConfirmedRevision: null,
    lastFailedOperationId: null,
    trusted: true,
  };

  diagnostics(): MutationDiagnostics {
    return this.diagnosticsState;
  }

  unresolvedOperations(): MutationOperation[] {
    return [...this.operations.values()].filter((operation) => operation.state === "failed" || operation.state === "conflicted" || operation.state === "pending" || operation.state === "retrying");
  }

  operation(id: string): MutationOperation | undefined {
    return this.operations.get(id);
  }

  discard(operationId: string): AppData | null {
    const operation = this.operations.get(operationId);
    if (!operation) return null;
    operation.state = "discarded";
    this.operations.delete(operationId);
    this.refreshDiagnostics();
    return operation.previous;
  }

  clearResolved(operationId?: string) {
    if (operationId) this.operations.delete(operationId);
    for (const [id, operation] of this.operations) {
      if (operation.state === "confirmed" || operation.state === "discarded") this.operations.delete(id);
    }
    this.refreshDiagnostics();
  }

  clearUnresolvedAfterReload() {
    this.operations.clear();
    this.refreshDiagnostics();
  }

  async submit(provider: PersistenceProvider, request: MutationRequest): Promise<void> {
    const operationId = `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    const expectedVersions = new Map((request.expectedIds ?? []).map((id) => {
      const record = findMutableRecord(request.current, id);
      return record ? ([id, record.version] as const) : null;
    }).filter(Boolean) as Array<readonly [string, number]>);
    const operation: MutationOperation = { id: operationId, name: request.name, expectedRevision: request.expectedRevision, previous: request.current, next: request.data, affectedEntities: request.expectedIds ?? [], attemptCount: 0, state: "pending", error: null, recoveryActions: [], confirmedRevision: null };
    this.operations.set(operationId, operation);
    this.refreshDiagnostics(request.name);
    request.applyOptimistic(request.data);
    try {
      const saved = await retryOperation(async () => {
        operation.attemptCount += 1;
        operation.state = operation.attemptCount > 1 ? "retrying" : "pending";
        this.refreshDiagnostics(request.name);
        return provider.replace({ next: request.data, expectedRevision: request.expectedRevision, operationId, expectedVersions });
      }, request.retries ?? 2, request.retryDelayMs ?? 250);
      const at = new Date().toISOString();
      operation.state = "confirmed";
      operation.confirmedRevision = saved.canonicalRevision;
      this.operations.delete(operationId);
      this.diagnosticsState = { ...this.diagnosticsState, pendingCount: 0, retryingCount: 0, failedCount: 0, conflictCount: 0, currentSummary: "None", lastFailureCategory: "None", lastSuccessfulMutationAt: at, lastConfirmedRevision: saved.canonicalRevision, lastFailedOperationId: null, trusted: true };
      request.onConfirmed(saved.data, at, saved.canonicalRevision);
    } catch (error) {
      const normalised = normaliseApplicationError(error);
      const conflict = error instanceof ConflictError || normalised.category === "conflict";
      operation.state = conflict ? "conflicted" : "failed";
      operation.error = normalised;
      operation.recoveryActions = conflict ? ["discard", "reload"] : ["retry", "discard", "reload"];
      this.refreshDiagnostics(request.name);
      request.onFailed(normalised, operation);
    }
  }

  private refreshDiagnostics(summary = "None") {
    const operations = [...this.operations.values()];
    const pendingCount = operations.filter((operation) => operation.state === "pending").length;
    const retryingCount = operations.filter((operation) => operation.state === "retrying").length;
    const failed = operations.filter((operation) => operation.state === "failed" || operation.state === "conflicted");
    const conflicted = operations.filter((operation) => operation.state === "conflicted");
    const lastFailed = failed.at(-1);
    this.diagnosticsState = {
      ...this.diagnosticsState,
      pendingCount,
      retryingCount,
      failedCount: failed.length,
      conflictCount: conflicted.length,
      currentSummary: pendingCount || retryingCount || failed.length ? summary : "None",
      lastFailureCategory: lastFailed?.state === "conflicted" ? "Conflict" : lastFailed?.error?.category ?? "None",
      lastFailedOperationId: lastFailed?.id ?? null,
      trusted: failed.length === 0 && conflicted.length === 0,
    };
  }
}
