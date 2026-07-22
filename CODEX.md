# ToDonut Engineering Notes

ToDonut is a single-user task-management web app. The repository now uses Vite, React and TypeScript because the previous files were an early static scaffold rather than an established application stack.

## Mandatory Project Instructions

Before making application changes, read and follow:

- `DESIGN.md`: authoritative launch product behaviour and product requirements.
- `STYLE.md`: authoritative visual behaviour, interaction styling and UI consistency rules.
- `PATTERNS.md`: authoritative technical implementation patterns, module boundaries and shared-service rules.
- The current focused implementation prompt: authoritative for the specific task scope where it deliberately narrows or clarifies the documents above.

Do not duplicate cross-cutting technical behaviour when `PATTERNS.md` defines a shared path. Product behaviour belongs in `DESIGN.md`; visual behaviour belongs in `STYLE.md`; implementation structure belongs in `PATTERNS.md`.

## Mandatory UI Instructions

Before making any UI, CSS, layout, component, icon or visual-state change, read `STYLE.md` and treat it as the authoritative interface and visual-design reference.

- Reuse existing design tokens and component primitives before introducing new CSS.
- Avoid one-off CSS values when an existing token applies.
- Update `STYLE.md` in the same change when deliberately extending the visual system.
- Do not change established visual rules incidentally during feature work.
- Include visual consistency in completion checks.
- Test affected mobile and desktop layouts.
- Use Lucide icons rather than introducing unrelated icon families.
- Report any deliberate deviation from `STYLE.md`.

## Current Architecture

- Frontend: Vite + React + TypeScript.
- Routing: in-app view state only, so GitHub Pages project-site hosting does not require server rewrites.
- Styling: ordinary CSS with a dark-only tokenized visual system documented in `STYLE.md`. UI chrome is true monochrome; the supplied colour palette is reserved for statuses, priorities, tags and entity accents.
- Icons: Lucide React.
- Persistence: app code depends on `PersistenceProvider`.
- Technical implementation patterns: `PATTERNS.md`.
- Source boundaries: app composition in `src/app`, cross-cutting services in `src/core`, feature screens in `src/features`, provider implementations in `src/infrastructure`, reusable visual primitives in `src/shared`, and pure domain model/rules in `src/domain.ts` plus future `src/domain/` modules.
- Current adapter: `LocalDevelopmentProvider`, clearly development-only and backed by `localStorage`.
- Production adapter: Supabase browser SDK using `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY`, owner-authenticated RPCs and realtime snapshot reloads.
- Authentication: Supabase email/password through `AuthGate`; password recovery links with `type=recovery` are handled before ordinary hash routing and show a Set Password screen that calls the provider `updatePassword` path. Supabase Auth URL Configuration must allow the tested app origin, such as `http://127.0.0.1:5173/` locally and the deployed GitHub Pages URL in production.
- Backend migration: `supabase/migrations/0001_todonut_snapshot.sql`.
- Launch Task views derive from `src/viewModel.ts`, which owns inclusion, Closed visibility, Deferred placement, sorting, grouping, transient filters and stable view preferences. Do not reimplement those rules in screens.
- Bulk Task actions live in `src/features/tasks/bulkTaskCommands.ts` and return one complete next snapshot for the shared mutation coordinator.
- Stable browser routes are hash-based and GitHub Pages-compatible; `#/tasks` maps to the internal Tasks destination and detail routes restore Lists, Projects, Areas and Settings subsections. Valid List, Project and Area details show the shared top-bar Lucide ArrowLeft button before the entity name. Detail-route pushes retain the non-visible in-app access path so Back can unwind Area to Project to List and deeper navigation; direct detail loads fall back to the corresponding entity landing route. Detail components do not render duplicate local Back controls.
- Every non-home Settings subsection, including Diagnostics, shows that same shared top-bar Lucide ArrowLeft control before the Settings title and returns directly to Settings home. Settings feature components do not render their own duplicate Back controls.
- Core entity editors display read-only Activity History through `src/core/activity/ActivityHistory.tsx`. Old/New History values must render through the shared display formatter there, resolving entity IDs to display names and avoiding raw database keys in user-facing output.

Production runtime must not silently fall back to the local development adapter. If Supabase public env vars are missing in production, the app reports a configuration failure.

## Domain Boundaries

Bakery state is canonical `AppData.bakery` data (schema version 6), not a separate game store. Catalogue-data version 4 contains 18 purchased ingredients and 64 registry-driven recipes/products. Catalogue definitions live in `src/domain/bakeryCatalogue.ts`; business and information upgrades live in `src/domain/bakeryBusiness.ts`; Proofing Schedule window rules live in `src/domain/bakeryProofing.ts`; progress registries and derived intelligence live in `src/domain/bakeryProgress.ts`; pure commands live under `src/features/bakery`; and market calculations live in `src/domain/bakeryMarket.ts`. Permanent market effects are derived through `deriveEffectiveMarketModifiers`; timed Window/Bakery campaign effects are passed explicitly into pure market calculations; Product Spotlight is consumed by sale resolution in stable contract order; and Pantry ingredient purchasing uses the authoritative `ingredientPackQuote`/`purchaseIngredient` path for ordinary and bulk packs. Existing contracts remain immutable. Development simulation lives under `src/dev/`; findings are in `docs/bakery-balance-report.md`.

Core types live in `src/domain.ts`: Area, Project, Task, ReferenceList, ReferenceListEntry, Status, Priority, Tag, TagGroup, RecurrenceRule, RecurrenceGeneration, ViewPreference and ActivityEvent.

Hidden lifecycle is a product umbrella, not a single storage field. Deleted uses existing deletion metadata and Archived uses archive metadata. Launch Trash exposes Deleted Projects, Tasks and Lists plus Archived Projects and Lists. Deleted Trash rows can be restored or Purged; Purge is the only hard-delete path. Archived Trash rows can be unarchived or moved down to Deleted, which clears archive metadata so later restoration returns them as active records. List Items and lightweight configuration records may remain soft-deleted in storage but do not have ordinary Trash restoration UI.

Schedules are implemented internally with recurrence records, a private generation ledger and generated Task provenance. Generated Tasks are ordinary independent leaf Task snapshots. Processing is application-level catch-up work, committed through the shared Mutation Coordinator only when canonical state is trusted; it runs after authenticated startup/reload/focus/visibility and a shared foreground timer, not from render paths or a top-level Schedule destination. Visible product language should say `Schedule`, not `Recurrence`.

Lists are first-class reference material with flat Items plus optional colour. Legacy `ReferenceListContent` is migrated into `ReferenceListEntry` records where practical, and older list records default to no colour and a stored `list-ordered` icon identifier for compatibility only.

Related entity context uses the shared `EntityContextLine`: visible Area and Project prefixes are replaced by the established Lucide `LandPlot` and `FolderKanban` icons while accessible labels retain the entity kind, configured colour applies only to the related entity title, and multiple parents render comma-separated in Area, Project, then future-parent order. Icon-bearing entries remain in ordinary inline text flow so their title baselines match neighbouring text. Project locations derive indirect Area context for display without duplicating the stored relationship. A List's own configured colour applies to List titles in browser rows and the active heading, never to List Items.

Energy and Context are first-class generic Quantifiers, not special Tag Groups. `AppData.quantifierDefinitions` owns ordered dimensions and stable-ID options; schema 9 adds `iconNames` to each option. Tasks, Projects and Lists store one option ID per dimension in `quantifierSelections`, and Schedule templates carry the same values into generated Tasks. Defaults are Energy (`Relaxed`, `Low Energy`, `Medium Energy`, `High Energy`, `It's a Whole Thing`) and Context (`Home`, `Work`, `Outing`, `Mental`, `Digital`, `Relationship`). Settings > Quantifiers supports dimension renaming plus arbitrary option add, rename, remove and reorder. Its icon field parses pipe-separated Lucide reference names, removes whitespace, lowercases names, preserves order and duplicates, and rejects names absent from the installed Lucide registry. The installed `lucide-react` catalogue must remain reasonably aligned with the public Lucide reference; version 0.577.0 adds current names such as `battery-plus`. Schema migration copies matching legacy Energy/Context Tag Group assignments without deleting original tags and initialises missing option icon arrays empty. `QuantifierFields` keeps full option names in selectors. `QuantifierTitleIcons` renders configured option icon sequences in primary white immediately after Project, Task and List names in definition order with accessible `Dimension: Option` labels; `EntityContextLine` retains the muted dimension-icon-plus-name metadata fallback for selected options without custom icons.

List Appearance treats the blank first swatch as an explicit `null` colour that clears the stored value on Save. Domain List updates preserve the existing colour only when the draft colour is omitted (`undefined`), not when it is explicitly `null`.

Schedule Task placement mirrors the ordinary single-location model: Area is blank by default and sits left of Destination; Destination defaults to Inbox and offers active Projects; choosing either replaces the other canonical location. Priority is below the placement row. Entity choices use their configured colours, due-on-occurrence uses the custom Lucide circle toggle, and desktop Trash uses a compact four-column entity tab strip with tabs approximately half their former width.

All checkbox-driven UI uses the shared `CircleCheckbox`: Lucide `Circle` for unchecked and `CircleCheck` for checked. Checked entity options inherit their entity colour; all other checked states use mint. This applies to menu options, Task checklist editing, Schedule weekdays and occurrence settings, tag scopes, and configuration defaults. Native checkbox artwork is not used.

List creation and editing use the shared List editor in `src/app/App.tsx`, backed by pure commands in `src/domain.ts`. A List has exactly one location: loose, direct Area or direct Project. Project Lists store only the Project relationship; any Area context is indirect through the Project. Project entry uses the shared filtered text combobox; a unique exact title match resolves to and persists the same Project ID as a clicked suggestion. List relocation, title edits, manual ordering and List-level Tags are saved as logical mutations through the shared coordinator, with List-scoped Tag filtering and mutual-exclusion rules enforced by domain commands.

Projects and Areas use pure selectors and commands in `src/features/projects/projectAreaModel.ts`, with the current UI composed from `src/app/App.tsx`. Projects and Areas are separate top-level destinations without a shared tab bar. Projects own an explicit shared `statusId`; configured Status categories drive active/closed filtering, grouping, editing eligibility, recurrence destinations and lifecycle timestamps. Project create/edit places Status beside Area and defaults it through `defaultStatusId`. Project archive/delete/restore continues to use shared lifecycle commands in `src/core/lifecycle/lifecycleCommands.ts`.

Project-card, Project-detail and aggregate-Task progress summaries render through shared `TaskProgressMeta`. It leads percent/open/completed/cancelled or `No actionable Tasks` text with the established navigation `ListTodo` icon and reuses the baseline-safe inline metadata structure and secondary action-icon colour.

Project browser cards keep their action group in the same grid row as the text through tablet and wide-mobile widths. The action group stacks beneath the text only at the narrow-card breakpoint.

Project browser-card title text is primary white at medium (`500`) weight; the configured coloured Status icon remains immediately before it and configured Quantifier icons remain immediately after it.

Per-Project colour is dormant compatibility data. Preserve the `Project.color` schema, existing stored values, domain/editor forwarding, migrations, Activity History handling and the opt-in `.project-row--colour-accent` CSS hook. Project create/edit does not show a colour picker, and Project browser cards do not activate the colour accent. Editing must forward the existing value unchanged; new Projects retain the established hidden default so this presentation can be restored later.

Configuration records for Statuses, Priorities, Tags and Tag Groups are edited from Settings and saved through the same canonical mutation path. Statuses retain stable semantic categories for Completed and Cancelled and uniquely own one palette colour plus one icon from `STATUS_ICON_OPTIONS`; occupied colours/icons are removed from other Status editors. Status rows render the configured coloured icon in place of a swatch, keep the mapped state inline beside the name, and resolve drag/drop through stable source and target IDs so the dropped order is persisted exactly. Priorities are exactly five active records with stable IDs and a configurable default stored in settings. Tags support Task, Project and List scopes only; grouped Tags inherit the Tag Group colour, and Tag Group inherited rules are evaluated dynamically through shared selectors rather than copied onto Tags or entities. Stored Area/Project/List icon fields remain compatibility fields; Status icons are the deliberate visible exception and render through shared `StatusIcon`.

Task-to-Project promotion and Project-to-Task demotion are atomic replacement commands in `projectAreaModel.ts`. They validate and create the target first, move compatible Tags/Quantifiers/Area/Status and hierarchy, rewrite List/Schedule destinations where required, then remove the source record and its source Activity history in the same snapshot. Task checklists have no Project field, so promotion preserves them as readable checklist text in the Project description. UI entry points always use confirmation modals and the Lucide `PanelTopClose`/`PanelBottomClose` actions.

Settings presents Tags beneath active Tag Group headings in group order, with Loose Tags last. Tag reordering is sibling-only within the current group or the Loose section and never changes group membership.

New Tag scope defaults are Tasks and Projects, excluding Lists. Loose Settings rows show per-Tag colour markers; grouped sections show the marker on the white group heading and render member Tag names in the inherited group colour without repeated markers.

Settings Tag Group headings have local leading Lucide chevron disclosures. Tag rows keep name and scope inline with wrapping allowed, use weight 500, and do not reduce the weight-700 group heading.

Tag drag ordering uses stable Tag IDs and an explicit before/after drop placement. A drop moves the dragged Tag, not the target row, and no-op or cross-group drops do not create an order mutation.

Project deletion deliberately detaches current Task and List relationships before soft-deleting the Project. Later Trash restoration restores only the Project; immediate Undo receipts may restore the fuller prior relationship state while they remain valid.

List Items store required visible text separately from an optional `link`. Only absolute `http://` and `https://` links are considered active links. Legacy URL-only text rows are preserved as visible text and, when structurally valid, migrated into the optional link field. Bulk List Item import supports one item per line, including `Name(https://url)` syntax where the name becomes visible text and the URL becomes the item link.

Task creation and editing use the shared `features/tasks/editor` modal. The editor is title-first, stores local draft state, reveals Basics/More/Checklist through Details tabs for new Tasks and Basics/More/Checklist/History through Details tabs for existing Tasks, and submits one Create or Save mutation through the shared coordinator. Basics contains Status, Priority, Due Date and Tags; More contains Area/s, Project, Reveal On and an existing-Task `Create Schedule` action. Area always precedes Project/Destination when both are editable in one modal or screen. Project uses the shared filtered text combobox and resolves unique exact typed titles to canonical Project IDs before save; Area/s uses a compact dropdown selector rather than an always-open multi-select listbox. Empty Due Date fields prefill the current Australia/Sydney date only when first focused. Checklist content is active only for leaf Tasks; existing checklist items appear as a read-only prompt list beneath the Task title in edit mode, while the Checklist tab owns add, edit, delete and chevron reorder controls. Aggregate conversion clears the active checklist while recording prior checklist values in Activity History. Parent/child assignment and Must Do Today are disabled for the launch candidate; keep compatibility paths for existing hierarchical data unless a deliberate migration removes them.

Task date-picker overlays use fixed portal positioning, prefer below then above, and clamp top/left coordinates to the visible viewport. They reposition on resize and scrolling and constrain their own height rather than clipping beyond the screen.

Task hierarchy rendering lives in `src/features/tasks/TaskSection.tsx` as the shared recursive hierarchy over the shared Task row. Domain hierarchy behaviour remains in `src/domain.ts`: parent validation, aggregate conversion, derived aggregate progress, automatic aggregate closure, aggregate completion/reopen cascades, child reopening with ancestor reopening, validated full-subtree movement, parent clearing, sibling ordering and Task subtree soft-delete/restore. Do not add per-screen tree implementations.

Root Task rows must align with their section heading and empty/filtered states. Apply hierarchy indentation only to descendants, and keep the selected row pill absolutely positioned so it does not consume row grid width. Compact rows use one shared grid: drag handle, Priority-coloured completion ring, title/metadata and the right-aligned action group. Status, Due and Project metadata are muted text with `Status:`, `Due:` and `Project:` labels, not pills; Status includes a small status-colour marker. Edit, Process and Delete stay icon-only on one row with the same square outline geometry; Delete keeps destructive styling.

Open leaf completion rings are empty in the centre and do not render a static checkmark. Completed leaf Tasks use the shared check drawing animation. When Show Closed is off, `TaskViewPanel` may keep a short local exiting projection mounted for the CSS completion duration plus a 250ms buffer before removing the row; this must continue to call the existing completion command and must bypass delay under `prefers-reduced-motion`.

Task movement must use the shared subtree command path. Parent assignment, Parent clearing, Project/Area/Inbox/Someday movement, editor placement changes and bulk Move all need to preserve internal child relationships, reject cycles and invalid destinations, apply location inheritance across the moved subtree, update ancestor aggregate state and record Activity History through the domain command.

The launch UI uses `src/features/tasks/TaskMoveDialog.tsx` for single and bulk movement, including Parent destinations. Task ordering is drag-only through the shared Task row and sibling-order commands; dragging must never reparent a Task.

The desktop shell opens on Today and orders primary navigation as Today, Inbox, Tasks, Lists, Projects, Upcoming, Overdue, Someday, Trash and Settings. The mobile shell opens on Today and uses a two-page bottom dock: primary page Today, Inbox, Tasks, Lists and Projects; secondary page Upcoming, Overdue, Someday, Trash and Settings. Dock page changes do not change the selected destination.

Task filtering uses `src/viewModel.ts` for AND matching and hierarchy projection. The projection exposes match, structural-ancestor and visible IDs; `TaskSection` only renders that model. Detail route entity misses use the shared unavailable state and preserve the hash until the user leaves it. Recurrence templates deliberately normalise checklist content to empty and generated Tasks resolve the current first active Status at generation time.

Task view controls stay in the existing control bar. Sort and Group remain left aligned, Show Closed sits immediately before More in the right-aligned default visible controls, and the expanded More panel contains the Task Tag filter. Show Closed is represented by the EyeClosed/Eye icon toggle only; do not add a second checkbox or parallel state.

Shared editor disclosure headings use the uppercase disclosure style. Task editor History is an edit-only Details tab and mounts Activity History only when that tab is selected; input labels, modal titles, tabs and body copy are not uppercased.

Shared modals apply initial focus only once when opened. Subsequent draft-state renders must preserve the user's current focus while focus containment, Escape handling and focus restoration continue through the shared modal primitive.

Description textareas use regular body weight even when nested inside bold `.form-row` labels. A configured entity colour may colour a custom dropdown's selected text, but its Lucide disclosure chevron remains ordinary white. Project and Area editors have no internal tabs, so their fields render directly in the modal form without a decorative `Details` fieldset; genuine semantic configuration groups retain their fieldsets and legends.

Custom modal dropdowns use `core/dialogs/AnchoredOverlay`: portal outside modal overflow, anchor to the trigger, flip and clamp within the viewport, reposition on scroll/resize and close on outside pointer interaction. Area/s and shared Tag menus use this path; native selects remain browser-managed.

Desktop shell scrolling is split between the full-height sidebar and workspace. Do not restore body-level desktop scrolling that lets long workspace views displace sidebar navigation. Sidebar brand/navigation flex items remain non-shrinking, and Bakery follows Settings at the standard navigation gap rather than using bottom-pinning or flexible spacer height. Mobile remains document-scrolled.

Ultra-wide presentation uses a root CSS interface zoom of `1.3` from a `2000px` viewport width and resets naturally to `1` below that media-query threshold. The full-height shell uses the inverse height at that breakpoint so its zoomed result remains one dynamic viewport tall. This default compounds with ordinary browser zoom. Body-portalled `AnchoredOverlay` coordinates and matched widths divide by the effective CSS zoom after viewport clamping so custom dropdowns stay attached to their triggers.

Creation is driven by one shared contextual Add registry rendered by the persistent lower-right floating Add button. Project, List and Task are permanent actions in visual top-to-bottom order; contextual actions such as List Item, Status, Tag, Tag Group, Area and Schedule are appended closer to the FAB only when the active context and capability support a complete creation flow. Child Task is disabled for the launch candidate. The older top-of-screen quick-add field is intentionally removed.

## Persistence And Concurrency

Each mutable record has an ID, creation timestamp, update timestamp, version and soft-deletion timestamp.

Every loaded canonical snapshot includes a monotonically increasing `canonicalRevision`. Every mutation, including creation, submits the revision originally read plus an operation ID. The persistence provider atomically compares that expected revision with the current canonical revision, writes only on a match, increments the revision exactly once and returns the confirmed revision. A stale write raises `ConflictError` and must not overwrite newer stored data. Existing per-record versions remain useful diagnostics, but the canonical snapshot revision is the authoritative guard for the current whole-snapshot storage model.

The app-level `commit` path queues local mutations and submits them sequentially. Rapid independent actions, such as checking off two Tasks before the first save confirms, must remain optimistic locally, then rebase each queued snapshot onto the latest confirmed canonical snapshot before calling the persistence provider. Do not bypass this queue for ordinary UI mutations or reintroduce parallel provider writes from feature handlers.

Supabase production saves call `todonut_replace_snapshot`, whose authoritative named arguments are `next_snapshot`, `expected_revision`, `operation_id` and `expected_versions`. It locks the canonical snapshot row, rejects stale canonical revisions and submitted stale entity versions, treats an exact operation-ID retry idempotently, and returns `{ snapshot, canonicalRevision }`. The development provider enforces the same contract. Revision baselines are tokens, not backup snapshots; ordinary writes retain only the current canonical snapshot. This pass adds no retained recovery checkpoints or snapshot archive, so checkpoint count is `0`.

Migration `0005_fix_snapshot_operation_cleanup.sql` is the forward-only hosted fix for Supabase safe-update enforcement. It preserves the four-argument RPC contract, removes the previous table-wide `app_snapshot_operations` delete, inserts the confirmed current operation, and prunes only older operation records outside the newest 16 using an explicit `WHERE` predicate. Do not edit already-applied migrations to change this behavior.

The authenticated shell intentionally shows no healthy backend adapter badge. Backend state is surfaced through Diagnostics, loading/signed-out states, toasts and the persistent mutation recovery banner only when actionable. Healthy in-flight saves and view-preference saves should not create top-screen feedback.

## Export And Diagnostics

JSON export uses the versioned `todonut.full-fidelity` envelope and excludes authentication material. Diagnostics must be sanitised with `src/security.ts` helpers before copying.

Export is desktop-only UI. Diagnostics is no longer a top-level destination; it lives inside Settings.

Build metadata lives behind the shared build-information path in `src/core/build/buildInfo.ts`, re-exporting the Vite-backed `src/buildInfo.ts`: package version from `package.json`, schema version from `SCHEMA_VERSION`, and safe optional build id, build timestamp and source commit. Git metadata is optional.

Export is blocked until initial synchronisation has completed, a confirmed canonical revision is known, pending/retrying mutations are confirmed, failed or conflicted mutations are resolved and the current state is known canonical. A disconnected subscription alone does not block export after a coherent snapshot has loaded and there are no unresolved local mutations. Export metadata includes the confirmed canonical revision and excludes unresolved optimistic overlays, recovery patches and retry state.

Diagnostics reports application/build/schema, backend/auth/sync, current and last confirmed canonical revisions, last authoritative load time, pending/retrying/failed/conflict mutation counts, last confirmed mutation time, last failure category, canonical trust, export safety, checkpoint count, recurrence availability and configuration state using honest unavailable values such as `Not configured`, `Not available`, `Not yet synchronised`, `Not yet run` and `Development only`.

## GitHub Pages

Vite `base` is relative locally and uses `GITHUB_REPOSITORY` during GitHub Actions builds so project-site paths work. `.github/workflows/deploy-pages.yml` builds and uploads `dist`; Pages must use **GitHub Actions** as its source rather than serving the source branch directly. The production Supabase URL and browser-safe publishable key come from repository Actions variables. The app does not rely on a custom server.

## Encoding And Optional Destinations

Application source and project documentation are UTF-8 without a byte-order mark. Run `npm.cmd run check:encoding` after changing user-visible copy; the focused guard scans source and documentation for known mojibake markers and the Unicode replacement character without rejecting ordinary valid Unicode.

Bakery and Settings are optional destination-level chunks loaded with `React.lazy` from the app composition boundary. Keep startup, routing, Today, Inbox, Task creation, the navigation shell, mutation handling and canonical state ownership eager. Every optional destination uses the shared announced loading presentation and remains inside `AppErrorBoundary`, so direct hash restoration keeps the shell visible and chunk failures offer Reload recovery.

## Styling Framework Decision

ToDonut currently uses a custom tokenized CSS system and reusable React markup primitives rather than a utility or component framework. This keeps exact dimensions, radii, whitespace and dark-only monochrome behaviour under project control and avoids importing a generic third-party visual language.


# Upkeep Note

The Bakery catalogue-data version is 5: 26 purchasable ingredients and exactly 100 data-driven recipes/products. Task completion awards Sugar rather than Sprinkles; legacy current Sprinkles balances convert once to Sugar.

During any pass over this app, it is your obligation to keep README.md and CODEX.md up to date so that they are perpetually materially complete and correct. The user will not ask for this but it is a universal requirement that, to keep future passes informed and oriented in this project effectively, this is required behaviour.

# PRODUCT OWNER NOTE

Do not attempt to take screenshots unless directly asked - most times you will waste time getting a locked login screen and fail to capture what you're after anyway. We will do visual restyling later so keep the styling predictive for now, I will inform you with screenshots if things need tweaking.
