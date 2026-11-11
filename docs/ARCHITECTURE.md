<!-- Document ceiling: 140 lines; 9,000 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Architecture

> Repository instruction precedence: [AGENTS.md](../AGENTS.md) governs this document.

The browser runs the Vite/React/TypeScript application. Development uses localStorage when Supabase is not configured; production uses GitHub Pages and the browser Supabase adapter with owner-authorised snapshot RPCs and realtime reloads. There is no application server or Cloudflare Worker.

Source ownership: src/app composes providers, shell and navigation; src/core owns shared mutation, feedback, dialogs, lifecycle, Undo, validation, time, history, diagnostics and export; src/features owns feature UI and commands; src/shared owns reusable components; src/infrastructure owns provider adapters; src/domain.ts and src/domain contain pure domain rules. Feature screens must not call the Supabase SDK directly.

The mutation coordinator serialises optimistic writes and rebases onto confirmed snapshots; canonical revision and per-record checks reject stale writes. Realtime events reload authoritative data without overwriting unresolved work. Bakery is included in the same snapshot and uses the same queue and conflict recovery. Schedules perform trusted foreground catch-up, not a required server cron. See [data](DATA.md), [integrations](INTEGRATIONS.md) and [Bakery](BAKERY.md).

Use shared modal, anchored overlay, feedback and lifecycle services. Derive filtered task projections and hierarchy once in shared selectors; preserve local form drafts until explicit commit and avoid unnecessary remounts. Source inspection does not establish a deployed or accepted version.
