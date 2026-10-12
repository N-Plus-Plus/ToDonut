# ToDonut data and persistence

## Sources and boundaries

Canonical AppData and SCHEMA_VERSION (currently 11) live in [src/domain.ts](../src/domain.ts). Bakery state schema is 6 and its catalogue schema constant is separately 6 in [bakeryCatalogue.ts](../src/domain/bakeryCatalogue.ts). Do not confuse these version namespaces or freeze historical recipe counts as current facts.

Production stores owner-scoped snapshots in Supabase; [migrations](../supabase/migrations) define the database contract. Development uses browser localStorage via LocalDevelopmentProvider, seeded only when absent and migrated on load. Tests use synthetic/disposable data. No silent production fallback, reseeding or copying live data into fixtures.

## Concurrency and retention

Each mutable record has an ID, creation timestamp, update timestamp, version and soft-deletion timestamp.

Every loaded canonical snapshot includes a monotonically increasing `canonicalRevision`. Every mutation, including creation, submits the revision originally read plus an operation ID. The persistence provider atomically compares that expected revision with the current canonical revision, writes only on a match, increments the revision exactly once and returns the confirmed revision. A stale write raises `ConflictError` and must not overwrite newer stored data. Existing per-record versions remain useful diagnostics, but the canonical snapshot revision is the authoritative guard for the current whole-snapshot storage model.

The app-level `commit` path queues local mutations and submits them sequentially. Rapid independent actions, such as checking off two Tasks before the first save confirms, must remain optimistic locally, then rebase each queued snapshot onto the latest confirmed canonical snapshot before calling the persistence provider. Do not bypass this queue for ordinary UI mutations or reintroduce parallel provider writes from feature handlers.

Supabase production saves call `todonut_replace_snapshot`, whose authoritative named arguments are `next_snapshot`, `expected_revision`, `operation_id` and `expected_versions`. It locks the canonical snapshot row, rejects stale canonical revisions and submitted stale entity versions, treats an exact operation-ID retry idempotently, and returns `{ snapshot, canonicalRevision }`. The development provider enforces the same contract. Revision baselines are tokens, not backup snapshots; ordinary writes retain only the current canonical snapshot. This pass adds no retained recovery checkpoints or snapshot archive, so checkpoint count is `0`.

Migration `0005_fix_snapshot_operation_cleanup.sql` is the forward-only hosted fix for Supabase safe-update enforcement. It preserves the four-argument RPC contract, removes the previous table-wide `app_snapshot_operations` delete, inserts the confirmed current operation, and prunes only older operation records outside the newest 16 using an explicit `WHERE` predicate. Do not edit already-applied migrations to change this behavior.

## Export and diagnostics

JSON export uses the versioned `todonut.full-fidelity` envelope and excludes authentication material. Diagnostics must be sanitised with `src/security.ts` helpers before copying.

Export is desktop-only UI. Diagnostics is no longer a top-level destination; it lives inside Settings.

Build metadata lives behind the shared build-information path in `src/core/build/buildInfo.ts`, re-exporting the Vite-backed `src/buildInfo.ts`: package version from `package.json`, schema version from `SCHEMA_VERSION`, and safe optional build id, build timestamp and source commit. Git metadata is optional.

Export is blocked until initial synchronisation has completed, a confirmed canonical revision is known, pending/retrying mutations are confirmed, failed or conflicted mutations are resolved and the current state is known canonical. A disconnected subscription alone does not block export after a coherent snapshot has loaded and there are no unresolved local mutations. Export metadata includes the confirmed canonical revision and excludes unresolved optimistic overlays, recovery patches and retry state.

Diagnostics reports application/build/schema, backend/auth/sync, current and last confirmed canonical revisions, last authoritative load time, pending/retrying/failed/conflict mutation counts, last confirmed mutation time, last failure category, canonical trust, export safety, checkpoint count, recurrence availability and configuration state using honest unavailable values such as `Not configured`, `Not available`, `Not yet synchronised`, `Not yet run` and `Development only`.

## Migration and recovery discipline

Inspect consumers, authoritative target and applied migration ledger before a schema change. Applied SQL migrations remain immutable; fix forward. The local migration directory does not prove hosted application. Ordinary code/CSS edits need no database backup.

Live schema/data changes require explicit authorisation and one appropriate verified recovery point before the risky operation. Full-fidelity export excludes auth and is not itself a proven database recovery plan; JSON import is not implemented. No established repository backup/restore command is documented. Establish a private backup and isolated restore procedure appropriate to the specific migration before execution; do not invent one or restore over newer writes. Release sequencing belongs in [Deployment](DEPLOYMENT.md).
