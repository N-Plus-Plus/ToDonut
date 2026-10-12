# ToDonut deployment and recovery

## Release boundary

The configured host is GitHub Pages through [deploy-pages.yml](../.github/workflows/deploy-pages.yml), on pushes to main and workflow_dispatch. A main push publishes automatically; explain that consequence before acting on an ambiguous push request. Commit/push/publication and live schema/data changes require explicit task authority. Current confirmed deployment and acceptance evidence belong only in [README](../README.md#current-state).

## Code-only release

Inspect/stage only the approved diff, preserving unrelated work. Run or reuse the single relevant [Testing](TESTING.md) release signal for matching source, configuration and dist artefacts. With publication authority, use the existing Pages workflow; do not create another deployment path. One affected non-destructive live smoke is sufficient unless observed risk requires more. Report the actual workflow artefact/version and URL; leave untested sign-in/device acceptance explicit.

Vite uses relative base locally and GITHUB_REPOSITORY for project-site builds. Hash routes need no server rewrites. Pages must use GitHub Actions as source; dist is the uploaded artefact. CI uses Node 22, npm ci and npm run build with repository Actions variables VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Local pnpm uses pnpm-lock.yaml; CI uses package-lock.json. Preserve both current paths; dependency changes must account for this mismatch deliberately rather than silently changing tooling.

## Schema/data-affecting release

Verify the actual Supabase project/account and applied migration ledger read-only. Assess compatibility with the live writer, then prepare one appropriate verified private recovery point and isolated restore/rehearsal for material risk. The repository has no established backup/restore script: agree and verify the procedure before a live migration. Do not confuse application exports with a tested database restore.

Only with explicit target-specific authority, link the intended project using npx.cmd supabase link --project-ref followed by its verified reference, and apply authorised pending migrations using npx.cmd supabase db push. npx.cmd supabase login is interactive credential setup, not implied by documentation adoption. Never expose passwords in commands or docs. Applied migrations are immutable; include only pending forward migrations, including the operation-cleanup fix where unapplied. The repository does not prove hosted ledger state.

After an authorised schema deployment, NOTIFY pgrst, 'reload schema'; refreshes PostgREST metadata. This is an administrative step, not runtime behaviour. Check critical invariants and owner access, then publish compatible code if separately authorised. Never replay old migrations, reseed or overwrite newer writes.

## Uncertain outcomes and recovery

A local gate timeout fails verification. A remote deployment/migration timeout may have succeeded: stop, inspect the narrow authoritative workflow/version/ledger read-only and resolve uncertainty before retry. Process termination is not rollback. No fixed operation timeout has been adopted.

Rollback needs a compatible safe application artefact; restoring older auth/schema/data over newer writes is unsafe. Production restore, project replacement, secrets or domain changes need separate authority and reconciliation. Private recovery artefacts stay outside Git/public dist. No periodic backups or migration checklist for CSS-only work.

## Human review

Ask before consequential product/permission ambiguity; show the first usable material journey before broad polish. Live data changes require reviewed scope, target, impact and recovery. Successful authorised publication is deployment evidence, not proof of owner/device acceptance. Use [Integrations](INTEGRATIONS.md) for Auth redirect setup and [mobile verification](mobile-verification.md) for relevant physical checks.
