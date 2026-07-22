import { AppData, createExportEnvelope } from "../../domain";
import { exportExcludesSecrets } from "../../security";
import { buildInfo } from "../build/buildInfo";
import { MutationState, SyncState, assertExportSafe } from "../../exportSafety";

export function buildSafeExport(data: AppData, sync: SyncState, mutation: MutationState) {
  const safety = assertExportSafe(data, sync, mutation);
  if (!safety.safe) return { safe: false as const, reason: safety.reason };
  const envelope = createExportEnvelope(data, { applicationVersion: buildInfo.applicationVersion, buildId: buildInfo.buildId, buildTimestamp: buildInfo.buildTimestamp, sourceCommit: buildInfo.sourceCommit, snapshotConfirmedSynchronised: true, canonicalRevision: sync.lastConfirmedRevision });
  if (!exportExcludesSecrets(envelope)) return { safe: false as const, reason: "Export was blocked because sensitive authentication material was detected." };
  return { safe: true as const, envelope };
}
