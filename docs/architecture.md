# ToDonut Architecture

## Interface System

ToDonut uses a custom tokenized CSS system documented in `STYLE.md`. A utility or component framework was considered for consistency, but not adopted because the current Vite/React app can enforce the required exact dimensions, radii, whitespace, monochrome foundation and restrained semantic colour use with local CSS custom properties and reusable React primitives. Avoid adding a styling framework unless it solves a concrete consistency problem, works with Vite and GitHub Pages, can be styled precisely to `STYLE.md`, and does not impose a recognizable third-party visual language.

## Source Module Boundaries

`PATTERNS.md` is the authoritative technical pattern guide. The current implementation uses these boundaries:

- `src/app/`: root application composition, provider wiring, shell state, navigation cleanup and app-level orchestration.
- `src/app/navigation/`: single navigation registry used to derive desktop navigation and both mobile dock pages.
- `src/core/`: shared technical services for feedback, dialogs, mutation coordination, lifecycle commands, Undo, Activity Event helpers, validation, ordering, build data, diagnostics, dates and export building.
- `src/features/`: feature screens and feature-specific UI. Current extracted modules include auth, tasks, settings/diagnostics, trash and recurrence, while list/project internals remain partially in app composition until the next feature-focused split.
- `src/infrastructure/`: provider adapters and browser/provider-specific implementation. Supabase SDK imports belong here.
- `src/shared/`: reusable visual primitives such as buttons and empty states.
- `src/domain.ts`: current pure domain model and rules. Future domain expansion should move pure entity rules into `src/domain/` without depending on React, Supabase or browser APIs.

Dependency direction is App -> Features -> Core/Shared/Domain -> Infrastructure ports/adapters. Feature screens must not import the Supabase SDK directly.

## Shared Technical Services

## Bakery vertical slice

Bakery is stored inside the canonical application snapshot under `bakery` and therefore uses the existing provider, canonical revision guard, Mutation Coordinator, retry/conflict recovery, feedback, confirmation, Export and Diagnostics paths. `migrateAppData` normalises missing Bakery state without examining historical activity, so rewards start prospectively.

The pure Bakery domain package owns the initial resource, recipe, product and shop registries; immutable reward/resource/sale ledgers; atomic purchase/craft/list/remove commands; and deterministic sale resolution. `src/domain/bakeryMarket.ts` owns the versioned product market registry and clock-explicit exponential market calculations without React or provider dependencies. A locked contract stores its market price, hidden demand audit value when available, asking price, duration and completion timestamp. The application owns one bounded scheduled check, cleans it up on state change/unmount, and submits due completion through the Mutation Coordinator. Reloads and reconnect snapshots are normalised, and due contracts resolve chronologically by completion timestamp then contract ID using persisted completion idempotency keys.

Bakery schema 6 persists one hidden market state per unlocked recipe plus business progression, campaigns, Spotlights, observations, statistics and milestones. Read-only views derive current demand and rounded price without writes; listing, unlocking, due-sale resolution and confirmed business purchases persist market advancement inside the related canonical mutation. Locked contracts retain asking price, market price at listing, duration, completion timestamp, reward and slot assignment.

Dynamic demand uses 24-hour recovery and 96-hour unmet-demand half-lives before modifiers. `deriveEffectiveMarketModifiers` converts purchased upgrades into recovery-speed, unmet-ceiling, completed-sale-impact, product-value and advertising-cost modifiers. Wider Audience multiplies recovery, Customer Loyalty raises future unmet-demand ceilings up to 100, Brand Resilience reduces future completed-sale pressure, Premium Packaging multiplies future visible product prices, and Advertising Efficiency discounts campaign quotes. Timed Window Promotion multiplies unmet-demand target growth only for its exact active interval; Bakery Promotion multiplies actual recovery only for its exact active interval. The pure market resolver splits elapsed time at campaign starts and expiries and never applies an active campaign to time before its start.

Product Spotlight is one pending effect per product. The next eligible completed sale consumes it once and applies zero demand loss; simultaneous same-product sales use completion timestamp then stable contract ID order, so later same-time sales receive normal Brand Resilience-adjusted pressure. Pantry ingredient quotes are authoritative: ordinary packs use `round(base pack price * (1 - category discount))`, bulk packs require Bulk Supplier Account and use `round(discounted unrounded ordinary price * 2 * 0.90)`. Purchase commands update actual paid Coin spending statistics, ledgers, recipe discovery and milestones atomically through the shared mutation path.

Feedback uses `src/core/feedback`. Features call `useFeedback()` for success, information, warning, error, route-scoped, global and persistent feedback. One `FeedbackHost` is rendered near the app root and owns automatic dismissal, route cleanup, deduplication, explicit dismissal and action buttons such as Undo.

Dialogs use `src/core/dialogs`. Feature modals compose the shared `Modal` primitive, which owns focus containment, initial focus, focus restoration, Escape, backdrop close, body scroll lock, responsive sizing and accessible labelling. `ConfirmationProvider` is the foundation for future confirmations.

Canonical mutations use `src/core/mutations/MutationCoordinator`. Features submit mutation requests with optimistic data, the canonical revision originally read, expected IDs where useful for diagnostics, affected operation summary and confirmation/failure callbacks. The coordinator owns pending, retrying, confirmed, failed, conflicted and discarded operation state, applies a small bounded retry policy only for transient failures, exposes Retry/Discard/Reload recovery actions and normalises provider errors before presentation.

Lifecycle operations use `src/core/lifecycle`. Soft deletion and restoration are routed through shared commands, which currently wrap the existing pure domain helpers and preserve Activity Event creation.

Undo uses `src/core/undo`. Current List Item delete Undo registers an operation receipt, exposes the action through shared feedback and executes restoration through the mutation path. Undo is treated as a new operation, not an erasure of the original history.

Validation uses `src/core/validation`; List Item links use the shared safe HTTP/HTTPS URL validator. Ordering uses `src/core/ordering`; List Item drag reordering now uses shared ID movement primitives before persisting through the existing domain reorder helper.

Build and diagnostics data use `src/core/build` and `src/core/diagnostics`; feature UI triggers those services instead of assembling metadata ad hoc. Export uses `src/core/export/buildSafeExport`, which applies the shared export guard and versioned envelope builder.

## Production Backend Selection

ToDonut selects Supabase for the first production backend.

Providers considered:

- Supabase: static-site friendly browser SDK, hosted Postgres, Row Level Security, realtime channels, Edge Functions, Auth with TOTP MFA and recovery support patterns, SQL migrations, and a free tier suitable for one low-volume owner.
- Firebase: strong static hosting compatibility and generous Spark tier, but first-save-wins relational-style version checks, TOTP owner-only flow and portable SQL-like migrations require more custom composition.
- Appwrite Cloud: suitable database/auth/functions model, but the free tier and browser data-access shape make direct GitHub Pages deployment less straightforward than Supabase for Postgres-backed version checks.
- Convex: excellent realtime data model, but TOTP/recovery-code owner authentication and database portability are less direct for this single-user static deployment requirement.

Supabase free-tier constraints to watch: project inactivity/pausing policies, database size, monthly bandwidth, Edge Function invocation limits and email delivery limits. Keep ToDonut single-user and low volume.

## Authentication

Production authentication is owner-only. Use Supabase Auth with email/password for initial and new-device authentication, and enable TOTP MFA in Supabase Auth for authenticator-app codes. The ordinary trusted-device session is the Supabase persisted secure browser session. A new untrusted device requires the password or recovery secret plus TOTP.

Recovery codes must use the provider's MFA recovery flow or a Supabase Edge Function that stores only hashes. Recovery code values and hashes are excluded from JSON exports.

Temporary lockout and notification email should be implemented in a Supabase Edge Function before exposing production enrolment publicly. The frontend includes only policy display, diagnostics redaction and safe failure handling; lockout authority must remain server-side.

Trusted-device approval from an already trusted device is not implemented in this free-tier architecture. It remains a roadmap item because a client-only approval mechanism would not be secure.

## Persistence And Sync

The production adapter uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Privileged keys must never be shipped to the browser.

The migration creates `public.app_snapshots` and RPCs:

- `todonut_get_snapshot`
- `todonut_replace_snapshot`
- `todonut_process_due_recurrences`

`todonut_replace_snapshot` has one authoritative named-argument contract: `next_snapshot`, `expected_revision`, `operation_id` and `expected_versions`. It locks the canonical row, compares the expected revision with the current `app_snapshots.version`, checks every submitted entity version against the current snapshot, writes only when all checks pass, increments the revision exactly once and returns `{ snapshot, canonicalRevision }`. Exact operation-ID retries return the prior result without a second write. A stale write raises a conflict and cannot partially overwrite the newer canonical record. The canonical revision remains the authoritative whole-snapshot guard, with submitted per-record versions providing the required entity-level conflict check.

Snapshot revision baselines are tokens, not retained backups. Ordinary writes retain one current canonical snapshot and its current revision. This implementation does not create a snapshot-history table, backup row per mutation or daily/hourly archive, and it retains no recovery checkpoints by default. The checkpoint maximum is therefore `0`; Diagnostics reports this bounded count.

Realtime updates are reconciled by canonical revision. Duplicate or older revisions are ignored, newer authoritative snapshots are applied when no unresolved local operation exists, and potentially conflicting local optimistic operations remain visible for explicit user recovery. Reconnect recovery reloads the authoritative snapshot, updates the local canonical revision and clears operations only when the user chooses Reload.

Realtime subscription watches the snapshot table and reloads the authoritative snapshot after remote changes. Transient save failures retry; exhausted failures remain visible and recoverable in the UI.

## Recurrence

Recurrence Schedules are separate domain records managed from Settings. Generated Tasks are ordinary independent leaf Tasks with immutable provenance. The private generation ledger and Task provenance map deterministic occurrence keys to generated Task IDs for deduplication, including Closed and soft-deleted generated Tasks.

Generation uses Australia/Sydney calendar dates. Free-tier Supabase scheduled functions are not required for launch. The app performs idempotent catch-up after authenticated canonical startup, full reload, focus, visibility restoration and a shared foreground timer while open. If no browser is open at midnight, generation occurs at the next authenticated application session. Several missed due slots collapse into one latest-slot catch-up Task.

## Export

Build metadata is centralised behind `src/core/build/buildInfo.ts`, backed by `src/buildInfo.ts` and Vite definitions. The application version comes from `package.json`; the schema version comes from `SCHEMA_VERSION`; build id, build timestamp and source commit come from GitHub Actions or local Git metadata when available. Builds still succeed without Git metadata, and no local paths or secrets are exposed.

JSON export uses a versioned `todonut.full-fidelity` envelope. The domain portion is provider-neutral and includes soft-deleted records, archived records, activity, recurrence data, reference entries, settings and view preferences. Secrets, tokens, passwords, TOTP material and recovery-code material are excluded.

Export is allowed only after initial synchronisation has completed, a confirmed canonical revision is known, no mutations are pending, retrying, failed or conflicted, and the current client state is known to be canonical. A disconnected realtime subscription does not by itself block export when a coherent snapshot has already loaded and no local mutation is unresolved. Pending mutations temporarily block export until confirmation; failed, conflicted or ambiguous optimistic state blocks export until the user reloads or otherwise resolves synchronisation. The export envelope includes the confirmed canonical revision as non-secret provider metadata and excludes unresolved optimistic overlays, failed local mutation payloads, retry state and recovery patches.

Future destructive migrations must require a pre-migration export. Browser-run migrations should trigger a download and acknowledgement. Backend migrations must provide a documented export command and refuse destructive changes unless the backup precondition is explicit.

## Diagnostics

Diagnostics lives inside Settings. The visible screen and copied payload include application version, build id, build timestamp when available, schema version, timezone, backend provider/configuration/auth state, redacted user identifier, connection state, initial synchronisation state, current canonical revision, last confirmed revision, last authoritative load time, last sync time, pending/retrying/failed/conflict mutation counts, current mutation summary, last confirmed mutation time, last failure category, whether canonical state is trusted, export safety state, bounded checkpoint count, recurrence configuration/last-run/processor availability, Supabase public configuration state, production-provider state, development-adapter warning, missing public variables and GitHub Pages base-path information.

Unavailable information is reported explicitly as `Not configured`, `Not available`, `Not yet synchronised`, `Not yet run`, `Unknown` or `Development only`. Copy Diagnostics passes through the shared redaction layer and must not contain tokens, passwords, TOTP material, recovery material, service-role keys or private record payloads.
# Bakery catalogue architecture

Bakery catalogue schema version 4 is normalized inside canonical `AppData.bakery`. `src/domain/bakeryCatalogue.ts` is the authoritative executable registry for the 18 purchased ingredients, five supplier tiers, 64 recipes/products, discovery prerequisites, resolved crafting formulas, lineage metadata and art keys. Supplier, ingredient, recipe and craft commands produce one candidate canonical snapshot and are committed through the existing Mutation Coordinator.

Recipe discovery is a pure registry evaluation over durable ingredient purchase history, available suppliers and recipe ownership. Reveal state is monotonic. Product market state is created only when a recipe is purchased, at the confirmed operation timestamp; migration preserves existing states and contracts and creates no retroactive demand history. Market configuration is generated by tier from the product registry. Configuration validation covers weak-market profitability and direct-upgrade value in addition to registry references.
## Bakery business state

Bakery schema version 6 retains the schema-4 business state and adds bounded prospective rounded-price observations, materialised sales and business statistics, immutable milestone completions, derived Reputation, Proofing Schedule Dough-window progression and a balance-data version. `src/domain/bakeryProofing.ts` owns Sydney wall-clock conversion, active schedule lookup, window identity, segment state, next-boundary calculation, safe claim application and safe claim reversal without React or provider dependencies. Proofing Schedule purchase records are ordinary permanent Business upgrades with purchase timestamps and next-local-date activation metadata, so current-day windows are never repartitioned and historical reward keys can be evaluated against the schedule active for that local date. `src/domain/bakeryProgress.ts` owns definitions and pure derived calculations. The deterministic development harness under `src/dev/` imports production registries and formulas and never enters canonical state or the production UI bundle.
