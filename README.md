# ToDonut

ToDonut is a dark-only, single-user task-management web app foundation built with Vite, React and TypeScript.

After reading this file, read CODEX.md next.

## Project Documentation

- [CODEX.md](CODEX.md): engineering notes and mandatory instructions for future Codex work.
- [PATTERNS.md](PATTERNS.md): authoritative technical implementation patterns and module boundaries.
- [STYLE.md](STYLE.md): authoritative visual-system and UI consistency guide.
- [ROADMAP.md](ROADMAP.md): product roadmap and deferred work.
- [DESIGN.md](DESIGN.md): authoritative launch product behaviour.
- [docs/architecture.md](docs/architecture.md): backend, persistence, auth, recurrence and export architecture.

## Local Setup

Install the lockfile dependencies before starting the app, and rerun the install after pulling dependency changes:

```powershell
npm.cmd install
npm.cmd run dev
```

The Quantifier icon catalogue requires the locked `lucide-react` 0.577.x release; an older local `node_modules` can incorrectly reject current names such as `battery-plus`.

## Implemented Foundation

- Bakery catalogue-data version 5 contains 26 purchasable ingredients and exactly 100 data-driven recipes/products. Productivity earns Dough, Sugar and Icing; Sprinkles are purchased.

- Bakery Stock combines a three-column held-ingredient grid filtered to available suppliers, with zero quantities visually subdued until hovered or focused, hover/focus/tap source tooltips, and tabbed Starting, Common, Filling, Artisan and Premium shops. Ingredient lists use one supplier-progression purchase order, including partial recipe inputs. Each shop ends with a purchasable Basic Pack that adds five of every ingredient it sells for 90% of the equivalent individual quantity cost, rounded up. Shop tabs are double-height, icon-led when their optional PNG is present, and use their grade name only as the fallback. All six Bakery top tabs use supplied 150%-scale inline navigation PNGs in 140%-height tab surfaces; mobile displays three tabs per touch-scrollable viewport. Mobile shop rows keep the ingredient icon, quantity, name and right-aligned buy action on one line. Coin values use one PNG-plus-number treatment, with an enlarged live balance persistent immediately left of the application menu and aligned to the hamburger icon. Page-title icons render across desktop and mobile; the desktop Bakery icon is deliberately 50% larger. Optional shop-tab art files are `src/assets/bakery/shops/starting.png`, `common.png`, `filling.png`, `artisan.png` and `premium.png`; optional Basic Pack art files are `src/assets/bakery/packs/basic.png`, `common.png`, `filling.png`, `artisan.png` and `premium.png`.

- Kitchen uses compact ordered Recipes and Products sections. Recipe names share their line with the market Coin value, or a white Lock when unowned; recipes support one-unit immediate baking, two-row ingredient equations with Stock-equivalent source tooltips and availability art states, and Buy Recipe actions. Held Products use a three-column name-tooltip grid.

- Bakery Pass 3-12 foundation plus catalogue-data version 4: 18 purchased ingredients and 64 registry-driven recipes/products, schema-v6 data-driven upgrades, stable Display slots and queues, deterministic pricing and advertising, connected permanent market upgrades, timed Window/Bakery promotions, Product Spotlight consumption, authoritative discounted ordinary/bulk Pantry pack quotes, Proofing Schedule Dough windows with next-Sydney-day activation, prospective bounded market history, market intelligence, corrected Coin spending statistics, derived Reputation, idempotent milestones and a development-only balance harness.

- Mobile-first app shell with Today as the landing page, a two-page bottom dock, first-class Lists, Settings and desktop navigation ordered for Today-first capture and review. Ultra-wide viewports of at least `2000px` start at a layout-aware `1.3` interface scale, return to ordinary scale below that boundary and continue to respect user browser zoom.
- List, Project and Area details include a shared top-bar Back icon that unwinds the actual in-app route path, with safe landing-page fallback for direct links.
- Shared contextual Add registry with permanent Project, List and Task actions plus runtime contextual actions such as List Item, Status, Tag, Tag Group, Area and Schedule. Child Task creation is disabled for the launch candidate pending a higher-standard parent/child reimplementation.
- Areas, Projects, Tasks and Lists with first-class Items.
- Shared colour-aware parent context lines show Area before Project with comma-separated titles led by the established LandPlot and FolderKanban icons; configured List colours apply to List titles without cascading to List Items.
- List Appearance supports explicit colour removal through its blank first swatch.
- Schedule create/edit supports blank Area plus Inbox-default Project Destination placement, coloured entity choices and a custom circular due-on-occurrence toggle; desktop Trash keeps all four compact entity tabs in one row.
- Checkbox-driven controls consistently use Lucide Circle off and CircleCheck on; checked entity options use their entity colour and all other checked states use mint.
- First-class configurable Quantifiers provide Energy and Context dimensions across Tasks, Projects, Lists and Schedule templates. Settings can rename either dimension and add, rename, remove or reorder any number of options; each option may store an ordered, duplicate-preserving pipe-separated sequence of icon names from the installed Lucide catalogue. The catalogue is kept aligned with current Lucide references, including `battery-plus`. Full option names remain in selectors; configured icon sequences appear beside Project, Task and List names in definition order with accessible full names, while unconfigured options retain the dimension-icon-plus-name metadata fallback. Existing matching Tag Group assignments migrate non-destructively.
- Separate Projects and Areas destinations with Project and Area create/edit/reorder/detail workflows, completed Project visibility, responsive Project cards that keep actions beside text whenever space permits, baseline-aligned ListTodo Project/aggregate progress metadata, Project completion cascade, Area soft deletion and in-place deleted Area restoration.
- Shared Task create/edit editor with title-only creation, progressive Details tabs, Area/s before Project wherever both placement controls coexist, Project placement through a filtered text combobox with exact-title relationship resolution, Area/s placement through a compact dropdown selector, viewport-clamped Due Date and Reveal On calendar overlays, Schedule creation from existing Tasks and embedded checklists. List creation uses the same Project combobox contract. Edit mode shows existing checklist items as a read-only prompt list beneath the title while the Checklist tab owns add, edit, delete and chevron reorder controls. Parent/child placement and Must Do Today are disabled for the launch candidate.
- Global configurable Statuses now drive both Tasks and Projects. Status configuration includes a unique palette colour and one unique Lucide circle icon; Settings rows show that coloured icon with the mapped state inline beside the name, drag-and-drop persists the exact requested order, Project cards show the icon before the title, and Status grouping uses the configured flow rather than inferred open/closed buckets.
- Per-Project colour is temporarily dormant: existing schema values and command support are preserved, while Project create/edit omits the colour picker and Project browser rows omit the colour accent for a neutral presentation.
- Task cards can promote to Projects with `PanelTopClose`, while Project rows/details can demote to Tasks with `PanelBottomClose`. Both use confirmation and atomic replacement commands that preserve compatible Area, Status, Tags, Quantifiers, hierarchy and dependent destinations before purging the source record.
- Tags and non-nested Tag Groups, including mutually exclusive group selection.
- Launch-ready configuration for exactly five Priorities plus Tags and Tag Groups: collapsible grouped Settings presentation with inline scope metadata, inherited group-colour headings and Loose Tags last, sibling-only Tag ordering, Tasks-and-Projects scope defaults, shared palette controls, scoped Tag pickers for Tasks, Projects and Lists, dynamic inherited Tag Group rules, mutual-exclusion repair, soft deletion and safe diagnostics counts.
- Subtasks with aggregate parent conversion, shared recursive hierarchy presentation, descendant progress, automatic aggregate closure and subtree Trash restoration.
- Completed hierarchy workflows: checklist save-level history/Undo shape, aggregate Complete Tree and Reopen Tree cascades, child reopening with ancestor reopening, one shared full-subtree Move workflow across Parents, Projects, Areas, Inbox and Someday, Parent clearing to valid roots, and drag-only sibling ordering.
- Hidden lifecycle handling through Trash: Deleted Projects, Tasks and Lists can be restored or purged as the app's only hard-delete path; Archived Projects and Lists can be unarchived or moved down to Deleted; List Items and lightweight configuration records do not have ordinary Trash restoration UI.
- Task activity history for significant changes.
- Provider-neutral persistence interface with mandatory canonical snapshot revision checks for every mutation, including creation.
- Development-only local persistence adapter that enforces the same revision contract as production.
- Supabase production adapter contract with RLS/RPC migration, atomic canonical revision replacement, realtime reload hook and no production localStorage fallback.
- Shared mutation coordinator with pending, retrying, confirmed, failed, conflicted and discarded operation states, bounded transient retries, recovery actions and provider-error normalisation.
- Shared feedback host for transient, route-scoped, persistent and action-bearing messages.
- Shared modal primitive and confirmation foundation for one-time initial focus, stable keyboard navigation, Escape, backdrop, focus restoration and scroll-lock behaviour, plus portal-based viewport-safe custom dropdowns that can escape modal overflow. Description fields use regular-weight text, coloured dropdown values retain a white chevron, and non-tabbed Project/Area editors present fields directly without a redundant Details container.
- List browser/detail screens with stable hash detail routes, shared create/edit List editor, loose/Area/Project relocation, List-level Tags, optional list colour appearance, single Item entry from the FAB, multiple Item entry from the contextual application menu, optional validated `http://`/`https://` links for single Items, bulk linked Item import with `Name(https://url)` lines, drag and button reordering, item edit/delete Undo, List archive, List soft delete and restoration, with archived Lists presented read-only.
- Schedules in Settings with create/edit/pause/resume/soft-delete management, deterministic occurrence keys, catch-up processing after authenticated canonical startup/focus/visibility, foreground timer checks, missed-occurrence collapsing and generated Task provenance.
- Per-view preference records, AND filter/sort/grouping helpers, desktop-only full-fidelity JSON export with build metadata, confirmed canonical revision metadata and synchronisation safety checks, and sanitised Diagnostics inside Settings.
- Shared launch Task view selectors and controls for Today, Inbox, Tasks, Upcoming, Overdue, Someday, Project detail and Area detail, including Show Closed, Deferred sections where intentional, compact/detailed rows, sort, grouping, transient filters and bulk Task selection/actions.
- Task view controls now include grouped Task-scoped Tag filters with AND semantics, removable active-filter chips, and structural-ancestor-preserving filtered hierarchy results.
- The authenticated shell uses a compact application menu for Export and Sign out; Bakery stays in desktop navigation and appears in the mobile menu because it is not part of the mobile dock. The visible tagline is `Productivity with sprinkles`, and healthy backend adapter text is not shown in the ordinary header.
- Task views default to Compact rows when no stored preference exists. Compact rows use the shared row grid: drag handle, empty Priority-coloured open completion ring, title, colon-labelled muted Status/Due/Project metadata and one right-aligned icon-only Edit, Process and Trash action row with matching outlines. Root Tasks align with section headings; only descendants receive hierarchy indentation.
- Completing an open leaf Task plays the completion-ring animation and then waits a short buffer before a hidden Closed row leaves the view. Reduced-motion users receive the completed state without an artificial removal delay.
- The More view control stays right-aligned; Show Closed uses the existing per-view preference through an EyeClosed/Eye two-state icon toggle and sits immediately before More on the default visible Task control bar. Expanded Tags use a Tags icon and `+ Add`.
- Toasts auto-dismiss after 2.5 seconds, pause while hovered/focused or during text selection, and the FAB menu stacks above toast cards. Healthy save progress and view-preference saves do not use top-screen feedback; unresolved failed mutations remain represented by the persistent recovery banner.
- Missing or deleted List, Project and Area detail links show explicit unavailable states; Area detail omits unsupported Project ordering.
- Schedule templates use the current ordered default open Status and intentionally exclude editable checklist templates.
- Hash-based GitHub Pages-compatible route restoration for launch destinations plus List, Project, Area and Settings detail routes.
- Every non-home Settings route uses the shared application-top-bar ArrowLeft control to return directly to Settings home, including Diagnostics and configuration subsections.
- Read-only Activity History inside Task, Project, Area and List editors. Task editor History appears as an edit-only Details tab, and shared disclosure headings render uppercase.
- The desktop sidebar width is exactly `10.5rem`; the tagline wraps beneath the ToDonut title. The application hamburger is top-aligned with the page title and uses a larger menu icon.
- The desktop sidebar fills the viewport and scrolls independently from the main workspace, so long pages do not move its navigation. Bakery follows Settings at the normal option gap, and reduced-height windows preserve the complete brand block before navigation begins. Mobile retains normal document scrolling.
- Mobile navigation uses two six-item dock pages: Today, Inbox, Tasks, Lists, Projects and Upcoming; then Areas, Overdue, Someday, Trash, Bakery and Settings. Task filters start collapsed behind the title-row Filter icon.
- Mobile cards reserve dock/FAB clearance once. Tasks use a two-by-two action grid, Lists place Edit above Archive/Delete, and Projects/Areas use left-opening card action menus. Reorder handles use reduced leading inset and stay vertically centred.
- Mobile Priority actions place Edit above Up/Down; Status actions place Up/Edit above Down/Delete. Dialogs track the visual viewport, centring within the keyboard-visible region and returning to screen centre when the keyboard closes.
- GitHub Pages-compatible Vite build.

## Intentionally Deferred

Seasonal recipes, random events or externally generated surges, customer orders/simulation, server scheduling, cooking timers, spoilage, failures and final art replacement remain intentionally deferred.

Bakery still deliberately excludes Project-completion Icing integration, Multi-Unit Display stacks, migration-history backfill, seasonal content and final economic retuning.

This pass does not implement PWA installation, offline mode, service workers, notifications, calendar integration, JSON import, weekly review, guided Inbox processing, Kanban, AI, advanced keyboard navigation, nested tag groups, multi-Area Projects or collaboration.

Trusted-device approval, server-side lockout email delivery and production owner enrolment still require Supabase project configuration and Edge Function wiring before a public production deployment.

## Development

```powershell
npm.cmd install
npm.cmd run dev
```

PowerShell may block `npm.ps1` on this machine, so `npm.cmd` is the reliable form.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run check:encoding
npm.cmd test
npm.cmd run build
```

## GitHub Pages

The app uses client-side view state rather than server routes. Vite is configured with a relative base locally and a repository base path when `GITHUB_REPOSITORY` is present.

The `Deploy GitHub Pages` workflow builds the app on pushes to `main` and publishes `dist` through GitHub's Pages artifact deployment. GitHub Pages must use **GitHub Actions** as its source. The browser-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values are supplied through repository Actions variables.

The production build keeps launch-critical Task and navigation code eager. The less frequently used Bakery and Settings destinations load as separate chunks with an accessible in-shell loading state; stable hash routes continue to restore those destinations directly.

## Persistence

The `LocalDevelopmentProvider` is only for development and testing. It is not offline mode and is not the canonical production store.

Each loaded snapshot carries a `canonicalRevision`. Every save submits the revision originally read and an operation ID; stale revisions are rejected rather than merged or overwritten. Normal writes retain one current canonical snapshot only. No unbounded snapshot archive is created, and this implementation retains no recovery checkpoints by default.

Production uses Supabase when these public static-build variables are present:

```powershell
$env:VITE_SUPABASE_URL="https://your-project.supabase.co"
$env:VITE_SUPABASE_PUBLISHABLE_KEY="your-public-publishable-key"
```

For local setup, keep those values in `.env.local` and never put service-role keys, database passwords or access tokens in `VITE_` variables. Link the existing hosted project with the Supabase CLI:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref your-project-reference
npx.cmd supabase db push
```

After pulling this version, deploy the forward-only RPC contract and operation-retention migrations to the linked hosted project with:

```powershell
npx.cmd supabase db push
```

Then run `NOTIFY pgrst, 'reload schema';` once in Supabase Dashboard > SQL Editor (or in the same deployment SQL session). If CLI linking is unavailable, apply any unapplied migration files in order, including `supabase/migrations/0005_fix_snapshot_operation_cleanup.sql`, then run the `NOTIFY` statement. Schema reload notification is a deployment step only; the application does not issue it at runtime.

Migration `0005_fix_snapshot_operation_cleanup.sql` replaces the snapshot RPC without changing its frontend payload. It removes the table-wide operations cleanup that caused hosted `DELETE requires a WHERE clause` failures, inserts the current operation record, and retains only the most recent 16 operation records through an explicit predicate.

`supabase link` may prompt for the hosted database password. Enter it interactively in the CLI prompt; do not store it in `.env.local`, source code or documentation.

Owner account setup for testing is manual: in the Supabase dashboard, keep public sign-up disabled, open Authentication > Users, choose Add user, create the single owner email/password account, and confirm the email if your Auth settings require confirmation. Email/password is the temporary testing flow until the final TOTP owner flow is completed.

Password recovery depends on Supabase Auth redirect settings. In Supabase Dashboard > Authentication > URL Configuration, set the Site URL and Redirect URLs to the app origin you are testing, such as `http://127.0.0.1:5173/` for local Vite dev and the deployed GitHub Pages app URL for production. Recovery links return with a `type=recovery` hash; the app detects that hash, shows the Set Password screen and calls Supabase Auth `updateUser({ password })`. Do not use `localhost:3000` unless a dev server is intentionally running there.

LAN mobile testing:

```powershell
npm.cmd run dev -- --host 0.0.0.0 --port 5173
```

Verification steps: sign in with the owner account, create a small clearly labelled test task or list item, confirm it appears in the hosted `app_snapshots` row, refresh the page, confirm the record reloads from Supabase, then remove the test record unless you intentionally keep it labelled. Anonymous browser sessions should see the owner sign-in screen and must not read or modify ToDonut data.

For dock, Add button, safe-area, keyboard, orientation, refresh and browser Back checks on a physical phone, use [docs/mobile-verification.md](docs/mobile-verification.md). Browser emulation can cover the listed viewport sizes, but physical-device checks must be recorded separately.

See `docs/architecture.md` for provider rationale, sync, auth, recurrence and export details.
