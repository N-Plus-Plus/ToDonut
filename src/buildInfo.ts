import { SCHEMA_VERSION } from "./domain";

export interface BuildInfo {
  applicationVersion: string;
  schemaVersion: number;
  buildId: string;
  buildTimestamp: string | null;
  sourceCommit: string | null;
}

export const buildInfo: BuildInfo = {
  applicationVersion: __APP_VERSION__,
  schemaVersion: SCHEMA_VERSION,
  buildId: __BUILD_ID__,
  buildTimestamp: __BUILD_TIMESTAMP__ || null,
  sourceCommit: __SOURCE_COMMIT__ || null,
};
