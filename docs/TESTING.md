# ToDonut testing and release checks

## Authoring versus execution

Create focused coverage for changed business rules, security, migrations, concurrency, recovery, provider contracts, DST/time and reproducible regressions when existing tests do not protect the change. Extend the owning test first. Copy, icons and isolated CSS need no new automated harness. Fixtures are synthetic and disposable; do not call production.

Finish one coherent edit, then run the smallest useful check. Reuse unchanged successful evidence; avoid repeated builds/typechecks or full suites on each prompt. Documentation changes use links, paths, encoding and focused diff checks, not application builds.

| Purpose | Existing command |
| --- | --- |
| Focused Vitest coverage | pnpm.cmd test -- src/path/to/owning.test.ts |
| Type feedback when warranted | pnpm.cmd run typecheck |
| UTF-8/copy guard | pnpm.cmd run check:encoding |
| Production artefact and type compilation | pnpm.cmd run build |

The focused path above is command syntax, not a literal file. Vitest runs once with jsdom/globals as configured in package.json. Existing tests cover domain, providers, mutations, date services and UI primitives.

## Release signal and bounded policy

Use the existing pnpm.cmd run build as the single code-release verification entry point; it already includes tsc -b, so do not repeat typecheck. It measures type compilation and Vite artefact generation, not behavioural acceptance or database migration safety. Reuse a successful result for unchanged source, lockfile, relevant environment/base path and dist artefacts. CI currently runs the corresponding npm run build; do not add wrappers or duplicate tiers merely for this documentation.

No owner-approved numeric time cap or aggregate timeout/child-kill wrapper exists. Record elapsed time for the invocation and keep it to this one command; do not claim a hard 60-second limit. A release requiring an enforced numeric budget must establish that policy before execution. Relevant risk-based development tests are separate, not an automatic full-suite release tier.

On release-gate failure or an agreed budget expiring, stop and report the actual failure/time; do not silently retry, expand checks or publish. Resolve direction before increasing the gate. Ordinary development failures can be fixed within authorised scope.

## UI and acceptance evidence

Check affected narrow/wide layout, keyboard, touch and reachable failure/recovery states proportionately. Do not take screenshots unless directly requested. Source inspection cannot prove rendering or physical-device behaviour. [Mobile verification](mobile-verification.md) is a targeted manual aid, not a mandatory whole-app campaign. Real provider sign-in, device keyboard and production writes require explicit appropriate review.

Distinguish source inspection, synthetic tests, browser observation, owner acceptance and verified live behaviour. No permanent per-pass reports or repeated checks just because a commit/push occurred.
