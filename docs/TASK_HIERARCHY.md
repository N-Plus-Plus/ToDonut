<!-- Document ceiling: 135 lines; 9,000 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Task hierarchy and shared movement

> Repository instruction precedence: [AGENTS.md](../AGENTS.md) governs this document.

Child Task creation and parent assignment are disabled in the launch UI; existing hierarchy data and shared command compatibility remain supported. Do not treat older design proposals as permission to enable them.

Task hierarchy rendering lives in `src/features/tasks/TaskSection.tsx` as the shared recursive hierarchy over the shared Task row. Domain hierarchy behaviour remains in `src/domain.ts`: parent validation, aggregate conversion, derived aggregate progress, automatic aggregate closure, aggregate completion/reopen cascades, child reopening with ancestor reopening, validated full-subtree movement, parent clearing, sibling ordering and Task subtree soft-delete/restore. Do not add per-screen tree implementations.

Task movement must use the shared subtree command path. Parent assignment, Parent clearing, Project/Area/Inbox/Someday movement, editor placement changes and bulk Move all need to preserve internal child relationships, reject cycles and invalid destinations, apply location inheritance across the moved subtree, update ancestor aggregate state and record Activity History through the domain command.

The launch UI uses `src/features/tasks/TaskMoveDialog.tsx` for single and bulk movement to Inbox, Someday, Area or Project roots; it does not offer Parent destinations. Task ordering is drag-only through the shared Task row and sibling-order commands; dragging must never reparent a Task.

Task filtering uses `src/viewModel.ts` for AND matching and hierarchy projection. The projection exposes match, structural-ancestor and visible IDs; `TaskSection` only renders that model. Detail route entity misses use the shared unavailable state and preserve the hash until the user leaves it. Recurrence templates deliberately normalise checklist content to empty and generated Tasks resolve the current first active Status at generation time.

Custom modal dropdowns use `core/dialogs/AnchoredOverlay`: portal outside modal overflow, anchor to the trigger, flip and clamp within the viewport, reposition on scroll/resize and close on outside pointer interaction. Area/s and shared Tag menus use this path; native selects remain browser-managed.
