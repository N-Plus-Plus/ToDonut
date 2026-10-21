# ToDonut

ToDonut is a dark-only, single-user task-management app built with Vite, React and TypeScript. It supports Tasks, Projects, Areas, reference Lists, Settings Schedules and optional Bakery progression, with provider-neutral canonical snapshot persistence.

## Current state

- Implemented source: shared task views/editors, entity lifecycle and history, configurable Status/Priority/Tags/Quantifiers, Lists/Items, client Schedule catch-up, Bakery, mutation recovery, sanitised Diagnostics and desktop full-fidelity export. Production is online-first Supabase; localStorage is development-only. Launch Child Task creation and Must Do Today remain disabled; existing hierarchy compatibility is retained.
- Source baseline inspected during v3 adoption: main at 5ab42fc, package version 0.1.0, AppData schema 11. Worktree documentation changes are separate from that commit.
- Last-confirmed live deployment: not established from available local evidence. A configured Pages workflow is not a confirmed live version/URL.
- Owner acceptance: no specific version/device acceptance record established here. Preserve earlier accepted unchanged flows without inventing acceptance dates.
- Unverified: current hosted migration ledger, owner/auth administration and physical-device sign-in/keyboard behaviour. Trusted-device/TOTP/lockout specifications must not be presented as completed.

Update this evidence only on material source/release/acceptance change using available evidence, not routine production probes.

## Start locally

Use Node 22 (the CI runtime) and pnpm with pnpm-lock.yaml. Windows PowerShell uses .cmd to avoid script-policy issues.

~~~powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd run dev
~~~

The dev command binds 127.0.0.1; Vite normally starts at http://127.0.0.1:10230/ and prints its actual port. Stop with Ctrl+C. Without Supabase configuration, development uses browser-local seeded data and preserves existing storage; it is not production/offline mode. Keep production data and credentials out of ordinary local tests.

For explicitly intended Supabase use, place the public VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in ignored .env.local. Never put service-role keys or passwords in browser variables. [Integrations](docs/INTEGRATIONS.md) owns auth/redirect setup.

For intended LAN testing: pnpm.cmd run dev -- --host 0.0.0.0 --port 5173. Physical-device checks remain distinct from emulation.

## Commands and routes

| Action | Command/authority |
| --- | --- |
| Focused tests | pnpm.cmd test -- src/path/to/owning.test.ts |
| Type feedback | pnpm.cmd run typecheck |
| Encoding | pnpm.cmd run check:encoding |
| Production build/release signal | pnpm.cmd run build; [Testing](docs/TESTING.md) |
| Local built preview | pnpm.cmd run preview |
| Publish/recover | Explicitly authorised Pages workflow; [Deployment](docs/DEPLOYMENT.md) |

Start future tasks with [AGENTS](AGENTS.md). Specialist authorities: [Architecture](docs/architecture.md), [Data](docs/DATA.md), [Contracts](docs/CONTRACTS.md), [Integrations](docs/INTEGRATIONS.md), [Testing](docs/TESTING.md), [Deployment](docs/DEPLOYMENT.md), [Style](STYLE.md), [User experience](USER_EXPERIENCE.md), [Roadmap](ROADMAP.md). Detailed references remain [Design](DESIGN.md), [Patterns](PATTERNS.md), [Game](GAME.md) and [Recipes](RECIPES.md). Historical [feature audit](FEATURE_AUDIT.md), [Bakery audit](BAKERY_AUDIT.md) and [balance report](docs/bakery-balance-report.md) do not create work or prove current deployment.

## Local directory and listener contract

Canonical checkout: `ToDonut`. Primary local default: **10230**. Additional explicit modes/listeners: 10239 UI preview; external Supabase ports unchanged. Service ID `todonut`, repository name, display name and external data locations remain unchanged. Port configuration does not migrate browser origin storage or external OAuth allowlists; those require individual acceptance. Never terminate an unidentified listener to free a port.
