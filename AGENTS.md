# ToDonut agent guidance

ToDonut is an owner-operated, single-user task-management web app with a Bakery companion. Use proportionate assurance for ordinary edits and stronger safeguards for personal data, authentication and persistence.

## Authority and task boundaries

Current user instructions and accepted decisions take precedence. Read this map first, then only relevant specialist passages and their source owners. Current accepted contracts below supersede conflicting older specifications; source proves implementation, never live deployment or owner acceptance. Preserve unrelated work.

Inspect the branch and worktree before editing. Complete one coherent requested outcome and necessary adjacent correctness work, inspect its diff, then stop. Do not start unsolicited audits, upgrades, refactors, report files or backlog work. Reuse prior findings and accepted unchanged functionality; recover task state after compaction instead of restarting investigation.

Make ordinary implementation choices independently. Ask before materially ambiguous product, permission, destructive or irreversible decisions. Show the first usable material new journey for owner review before broad polish; trivial edits need no artificial gate.

Commit, push, publication, remote migrations, production data, secrets and DNS changes require explicit task authorisation. A push to main triggers Pages deployment: treat it as publication. Never reset user work or silently substitute production data for local fixtures.

## Targeted routes

| Concern | Authority | Source owner |
| --- | --- | --- |
| Setup and evidence of current state | [README](README.md) | package.json, src/main.tsx |
| Runtime and module ownership | [Architecture](docs/architecture.md), relevant [Patterns](PATTERNS.md) sections | src/app, src/core, src/infrastructure |
| Schema, concurrency, recovery | [Data](docs/DATA.md) | src/domain.ts, supabase/migrations |
| Current domain/API/access rules | [Contracts](docs/CONTRACTS.md) | src/domain.ts, src/viewModel.ts, feature commands |
| Provider/auth/time boundaries | [Integrations](docs/INTEGRATIONS.md) | src/infrastructure/persistence, src/features/auth |
| UI and workflows | [Style](STYLE.md), [User experience](USER_EXPERIENCE.md) | src/styles.css, src/shared, src/features |
| Test selection and release signal | [Testing](docs/TESTING.md) | package.json, owning *.test files |
| Publication and recovery | [Deployment](docs/DEPLOYMENT.md) | .github/workflows/deploy-pages.yml |
| Owner-approved future work | [Roadmap](ROADMAP.md) | No implied implementation mandate |

[DESIGN.md](DESIGN.md) retains launch intent and detailed product reference; [GAME.md](GAME.md) and [RECIPES.md](RECIPES.md) retain Bakery reference material. Historical audits and superseded proposals do not override accepted rules or create work. Read relevant passages, not the entire suite.

## Editing and verification discipline

Reuse shared mutation, domain, validation, date, dialog and visual paths. Before UI changes, read applicable STYLE rules and use existing tokens/primitives and Lucide icons. Update the owning authority only when an enduring rule changes; README owns material source/live/acceptance evidence. No automatic README/AGENTS rewrite on every pass.

Separate test authoring from execution. Add focused coverage when changed business, security, persistence, provider, time-zone or regression rules warrant it; copy/CSS do not require harnesses. After a coherent edit, run the smallest relevant check. Release verification is a separate event; reuse matching successful evidence and do not duplicate checks because of a commit or push.

Check affected mobile/desktop interactions proportionately. Do not take screenshots unless the owner directly asks. State source-only or untested device limitations honestly. Keep source/docs UTF-8 without BOM; use the existing encoding guard after copy changes.

Keep secrets, tokens, private exports and production records out of source, logs and public artefacts. Applied migrations are immutable; live data changes require a verified target, one risk-appropriate recovery point and explicit authorisation.

Report the result, actual checks and material limitations concisely, distinguishing worktree changes from committed, deployed and accepted states.
