<!-- Document ceiling: 135 lines; 9,000 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Implemented contracts

> Repository instruction precedence: [AGENTS.md](../AGENTS.md) governs this document.

Tasks, Projects, Areas, Lists, Schedules and Bakery use the shared canonical mutation path. [Tasks and configuration](TASKS_AND_CONFIGURATION.md), [task hierarchy](TASK_HIERARCHY.md), [data](DATA.md) and [Bakery](BAKERY.md) own their detailed contracts.

Production access is owner-authenticated and enforced by Supabase RLS and RPCs, not hidden controls. Public sign-up is not an application feature. Trusted-device approval, TOTP and lockout delivery are not established as implemented. The snapshot RPC uses next_snapshot, expected_revision, operation_id and expected_versions, returns snapshot and canonicalRevision, rejects stale revisions/versions and handles exact retries idempotently.

Use shared commands, validation, mutation coordination, lifecycle, history and Undo. Preserve explicit conflict recovery, never silently overwrite newer data, and add focused coverage when changing a meaningful contract.
