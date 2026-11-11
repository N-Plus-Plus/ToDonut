<!-- Document ceiling: 155 lines; 10,500 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Codex operating contract and documentation router

> **Repository instruction precedence:** `AGENTS.md` outranks task prompts and all other repository documents. When a prompt contradicts `AGENTS.md`, follow `AGENTS.md` and report the conflict. If a prompt conflicts with another active document, or two other active documents conflict, stop the affected work and ask the owner. Do not choose by recency or specificity. Higher-level platform instructions remain unaffected.

ToDonut is an owner-operated task manager with an optional Bakery. Preserve saved data, current behaviour, accepted UX and game balance. Codex discovers `AGENTS.md` natively; an opening prompt such as "read AGENTS.md first" is sufficient. Read the files relevant to the task, not every document by default.

## Instructions and decisions

- The precedence statement above is a **repository-level owner policy**, not an override of Codex's higher-level platform instructions. When an owner wants to change this policy, update `AGENTS.md` deliberately; a conflicting ad hoc prompt is not a silent override.
- Current source, tests and observed runtime are evidence of **what exists**, not independent permission to disregard accepted requirements. A plan or roadmap does not authorise its own implementation.
- `docs/USER_EXPERIENCE.md` governs user-facing journeys and visibility. Other specialist docs own their named subjects below.

## Execution boundary

1. Establish the requested outcome, existing authorisations, current branch/worktree and minimum relevant source/docs. Do not assume a first-run bootstrap prompt, framework, deployment or remote exists.
2. Implement the **full requested scope** as one coherent result. Independently resolve routine design choices and coding errors; avoid speculative refactors, new frameworks, unrelated audits and permission checks for previously approved work.
3. **One-step consequential repair limit:** Fix immediate consequences of the requested change (for example, adjust an invalidated test or diagnose its failure). If that correction exposes another independent issue requiring further changes or recursive investigation, stop that chain and report the evidence, impact and a recommended follow-up. This does not excuse incomplete requested functionality or a known material security/data-loss defect.
4. Preserve uncommitted work, existing data, secrets, other services and external systems. No surprise paid services, destructive owner-data operations, security-boundary changes, public exposure or third-party writes. Follow existing approvals for scoped commits/pushes/deployments; do not request them again. A push to main normally triggers Pages publication; observe the task deployment boundary.
5. **Never create a sibling directory alongside this project's root**: no extra checkout, worktree, clone, copy, build directory or investigation folder under its parent. The already-existing `../DevDashboard` is an integration, not permission to create other siblings. Create any needed scratch/worktrees **inside** the project, under ignored paths; promptly remove them when no longer useful (for example after merge to `main`), after preserving unique work and confirming nothing active depends on them.
6. Default to one proportionate verification boundary for the coherent change. Prefer targeted tests and existing evidence; investigate a failed affected check and rerun it only as needed. See `docs/TESTING.md`.

## Documentation and reality

- Maintain one authoritative document per topic. **Never use an initial-suite Markdown document as a progress diary**. Replace stale material in place, without dated appendices, running change histories, validation receipts or repeated summaries. Keep routine history in Git and task output.
- `ROADMAP.md` holds only approved **unfinished** future outcomes. When delivered, remove the item; verified implementation and commands belong in the relevant current-state documents, not an expanded completed roadmap entry. Similarly, testing documentation contains only currently valid test guidance, not a history of superseded tests.
- **Material documentation drift:** Compare the observed implementation with accepted intent. Make the smallest defensible choice: update the owning document to describe the intentional as-is (narrow exception/relaxation), **or** correct the build to match the approved document. Do not silently treat drift as permission to change product decisions. Report the discrepancy, the choice and why; ask if owner intent or a material boundary remains unclear.
- **Per-document limits:** Each Markdown file states its own maximum line count and character count at its top. Before exceeding either cap, consider compaction versus splitting into two focused Markdown siblings **inside the same `docs/` directory** (or appropriate existing directory). Recommend the better option and ask the owner for a decision before changing the document structure. After an approved split, revise the routing map here. Do not split simply to avoid editing stale content. Measure the complete file including its metadata.
- Australian English in interface text and documents. Do not use em dashes.

## Quota, waiting and time

- Minimise context, tool calls, repeated reading and Codex quota usage. If work would require **waiting and polling or rechecking beyond 30 seconds** for an external process/event, end the pass instead. Report what was checked, what remains unconfirmed and a reasonable *estimated time to recheck*; do not promise autonomous follow-up. A productive, non-polling build or test is not automatically an idle wait.
- When the observed elapsed time passes **each five-minute boundary**, ask: "Is another period of work justified by a credible prospect of completing the requested outcome?" Continue only if a clear yes is supported by a credible prospect of finishing or materially advancing the requested result within the next five-minute block (including genuinely close completion); otherwise stop with completed work, outstanding result, why more time was unjustified and a specific recommendation. Do not create a polling loop merely to track the clock.
- Third-party API quotas and rate limits are governed by `docs/INTEGRATIONS.md`. Do not exhaust allocations to prove a point.

## UI and initial foundation

- Follow `docs/USER_EXPERIENCE.md` for task journeys and shared UI behaviour; `docs/STYLE.md` for visual conventions and how to adopt the reference `style.css`.
- Preserve the existing app and its working src/styles.css. Do not enrol it again or change the established port, auth, data or launch contracts.
- See `docs/ARCHITECTURE.md` for granular DOM updates, `docs/STYLE.md` for cumulative spacing and image sizing, and `docs/SKILLS.md` for emergent Codex skills/configuration. These are task-relevant authorities, not instructions to load them all on every task.

## Documentation routing

| Task concerns | Open |
| --- | --- |
| Current app state, verified commands and status | `README.md` |
| Approved future outcomes only | `ROADMAP.md` |
| Product capabilities and exclusions | `docs/SPECIFICATION.md` |
| Journeys, visible content and interaction contracts | `docs/USER_EXPERIENCE.md` |
| Design tokens, styles, media and spacing | `docs/STYLE.md`, `src/styles.css` (operational stylesheet) |
| Components, execution boundaries and rendering | `docs/ARCHITECTURE.md` |
| API, validation and asynchronous operations | `docs/CONTRACTS.md` |
| Persistence, assets, retention and recovery | `docs/DATA.md` |
| Task hierarchy and configuration | `docs/TASKS_AND_CONFIGURATION.md` |
| Bakery, catalogue and market | `docs/BAKERY.md`, `docs/BAKERY_MARKET.md` |
| DevDashboard, providers and API quotas | `docs/INTEGRATIONS.md` |
| Targeted verification | `docs/TESTING.md` |
| Launch, deployment and rollback | `docs/DEPLOYMENT.md` |
| Optional project-local agent skills/configuration | `docs/SKILLS.md` |

## Completion response

State the delivered result, checks actually run, scoped Git/deployment actions actually performed, discrepancies and how they were resolved, and anything intentionally unconfirmed or deferred. Never describe planned, mock, locally built and publicly deployed states as equivalent. When acceptance is met, report and stop; do not start another audit.

The root DESIGN.md, FEATURE_AUDIT.md, PATTERNS.md and STYLE.md are compatibility routing stubs required by scripts/check-encoding.mjs; their current authorities are under docs/.
