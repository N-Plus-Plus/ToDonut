import { AppData } from "./domain";

export interface SyncState {
  initialSyncComplete: boolean;
  canonicalStateKnown: boolean;
  canonicalRevision: number | null;
  lastConfirmedRevision: number | null;
  lastAuthoritativeSnapshotAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

export interface MutationState {
  pendingCount: number;
  retryingCount?: number;
  failedCount: number;
  conflictCount?: number;
  currentSummary: string;
  lastFailureCategory: string;
  lastSuccessfulMutationAt?: string | null;
  lastConfirmedRevision?: number | null;
  lastFailedOperationId?: string | null;
  trusted?: boolean;
}

export interface ExportSafety {
  safe: boolean;
  reason: string;
}

export function exportSafety(sync: SyncState, mutation: MutationState): ExportSafety {
  if (!sync.initialSyncComplete) return { safe: false, reason: "Export is available after initial synchronisation completes." };
  if (sync.canonicalRevision === null || sync.lastConfirmedRevision === null) return { safe: false, reason: "Export requires a known confirmed canonical revision." };
  if (mutation.pendingCount > 0) return { safe: false, reason: "Synchronisation is still in progress. Export will be available after the pending change is confirmed." };
  if ((mutation.retryingCount ?? 0) > 0) return { safe: false, reason: "A save is retrying. Export will be available after it is confirmed or resolved." };
  if (mutation.failedCount > 0) return { safe: false, reason: "Unsynchronised changes must be resolved before a trustworthy export can be created." };
  if ((mutation.conflictCount ?? 0) > 0) return { safe: false, reason: "A synchronisation conflict must be resolved before exporting." };
  if (mutation.trusted === false) return { safe: false, reason: "The current state includes unresolved local changes and cannot be exported as canonical data." };
  if (!sync.canonicalStateKnown) return { safe: false, reason: "The current application state is ambiguous. Reload or resolve synchronisation before exporting." };
  return { safe: true, reason: "Export will use the last coherent synchronised snapshot." };
}

export function assertExportSafe(data: AppData, sync: SyncState, mutation: MutationState): ExportSafety {
  const safety = exportSafety(sync, mutation);
  if (!safety.safe) return safety;
  const serialized = JSON.stringify(data).toLowerCase();
  if (["password", "totp", "recoverycode", "recovery_code", "access_token", "refresh_token", "service_role", "private_api_key"].some((token) => serialized.includes(token))) {
    return { safe: false, reason: "Export was blocked because sensitive authentication material was detected." };
  }
  return safety;
}
