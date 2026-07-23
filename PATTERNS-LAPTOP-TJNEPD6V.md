# ToDonut Technical Design Patterns

## 1. Purpose

This document defines the authoritative technical design patterns for ToDonut.

It exists to ensure that new features use shared, dependable implementation paths rather than creating screen-specific versions of common behaviour.

This document governs:

* application structure;
* module boundaries;
* shared technical services;
* state ownership;
* mutation handling;
* user feedback;
* dialogs and modals;
* validation;
* soft deletion and restoration;
* Undo;
* Activity History;
* navigation;
* diagnostics;
* date handling;
* ordering;
* testing;
* extension of existing patterns.

`DESIGN.md` defines what the product should do.

`STYLE.md` defines how the product should look and behave visually.

`PATTERNS.md` defines how the code should implement recurring technical concerns.

`FEATURE_AUDIT.md` describes current implementation status.

`ROADMAP.md` describes deferred product work.

## 2. Authority

Future Codex tasks must read this document before changing application architecture or implementing behaviour that could be reused across features.

When implementation conflicts with this document:

1. The implementation should normally be corrected.
2. A deliberate exception must be documented.
3. A genuinely better reusable pattern should update this document.
4. A feature prompt may override a pattern only when it explicitly states why.

Do not preserve duplicated or fragile code merely because it already exists.

## 3. Core principles

### 3.1 One dependable path per cross-cutting concern

A recurring technical concern should have one primary implementation path.

Examples include:

* showing transient feedback;
* showing confirmation dialogs;
* opening modals;
* applying optimistic mutations;
* reporting failed mutations;
* soft deleting and restoring entities;
* recording Activity History;
* offering Undo;
* validating URLs;
* generating dates;
* reordering records;
* reading build metadata;
* creating diagnostics;
* navigating between views.

Feature code should configure and call the shared path rather than reproduce its internal mechanics.

### 3.2 Reuse behaviour, not only appearance

A shared button component is useful, but visual reuse alone is insufficient.

Shared patterns should also centralise:

* timing;
* cleanup;
* accessibility;
* state transitions;
* error handling;
* version checking;
* event recording;
* retry behaviour;
* focus management;
* navigation cleanup;
* diagnostics.

### 3.3 Prefer cohesive packages over miscellaneous utilities

Do not create a growing `utils.ts` containing unrelated functions.

Each shared concern should have a cohesive package with:

* types;
* public API;
* implementation;
* hooks or adapters where required;
* focused tests;
* documentation or examples where useful.

For example:

```text
src/core/feedback/
  feedbackTypes.ts
  feedbackStore.ts
  FeedbackProvider.tsx
  FeedbackHost.tsx
  useFeedback.ts
  feedback.test.ts
```

Small packages may contain fewer files, but their responsibility should remain explicit.

### 3.4 Shared does not mean overly generic

Do not build abstract frameworks for hypothetical future needs.

A shared implementation should be extracted when:

* the behaviour appears in multiple features;
* the behaviour is safety-critical;
* consistent cleanup is required;
* accessibility is easy to implement incorrectly;
* the same lifecycle will clearly recur;
* feature-specific implementations would create drift.

A single current use may still justify a shared pattern when the concern is inherently cross-cutting, such as feedback, mutations, dialogs or diagnostics.

### 3.5 Domain rules remain independent

Domain rules should be expressible and testable without React, Supabase, the browser or CSS.

Domain code must not import:

* React;
* visual components;
* browser navigation;
* Supabase clients;
* local storage;
* feedback services;
* modal services.

### 3.6 Infrastructure stays behind interfaces

Feature and domain code should not call Supabase directly.

Supabase and development persistence implementations must satisfy application-facing ports or interfaces.

The application should depend on behaviour such as:

* load canonical state;
* submit mutation;
* subscribe to changes;
* authenticate;
* sign out;
* read diagnostics;

rather than provider-specific SDK details.

### 3.7 Preserve immediate frontend behaviour

Shared architecture must not make ToDonut feel slower.

Optimistic interaction remains a core requirement.

The shared mutation path should make immediate updates safer and more consistent, not force every action to wait for the backend.

### 3.8 Explicit state is preferable to hidden side effects

Important states should be represented explicitly, including:

* loading;
* ready;
* pending;
* failed;
* conflicted;
* unauthenticated;
* disconnected;
* deferred;
* closed;
* deleted.

Avoid behaviour that depends on unrelated component mounting or incidental rerenders.

---

# 4. Recommended source structure

The precise file names may evolve, but responsibilities should follow this structure.

```text
src/
  app/
    App.tsx
    AppProviders.tsx
    AppShell.tsx
    navigation/
    routing/
    startup/

  core/
    activity/
    build/
    capabilities/
    dates/
    diagnostics/
    dialogs/
    errors/
    feedback/
    mutations/
    ordering/
    undo/
    validation/

  domain/
    entities/
    rules/
    selectors/
    commands/
    types/

  features/
    auth/
    tasks/
    lists/
    projects/
    areas/
    trash/
    settings/
    recurrence/
    export/

  infrastructure/
    persistence/
    supabase/
    localDevelopment/

  shared/
    components/
    hooks/
    icons/
    testing/

  styles/
```

An immediate full migration to this exact tree is not mandatory if it creates unnecessary churn.

The important requirements are:

* clear ownership;
* controlled dependency direction;
* no monolithic application component;
* no duplicated cross-cutting behaviour.

---

# 5. Dependency direction

Use this general dependency direction:

```text
App composition
    |
    v
Feature modules
    |
    +--> Core technical services
    +--> Shared UI primitives
    +--> Domain rules and types
    |
    v
Application-facing ports
    |
    v
Infrastructure adapters
```

Rules:

* Domain must not import Feature, App or Infrastructure code.
* Shared UI primitives must not import feature-specific modules.
* Core services must not depend on individual feature screens.
* Feature modules may depend on Domain, Core and Shared packages.
* Infrastructure implements ports consumed by the application.
* App composition wires providers and feature routes together.
* Circular dependencies are not acceptable.

---

# 6. State ownership

Each kind of state should have a clear owner.

## 6.1 Canonical application data

Canonical production data comes from the persistence provider.

The application should expose canonical data through one store or state boundary.

Feature screens should not maintain independent copies of canonical collections.

## 6.2 Optimistic data

Optimistic changes should be owned by the shared mutation system.

Feature components should submit an operation describing:

* the intended change;
* the optimistic update;
* affected records;
* expected versions;
* persistence command;
* success behaviour;
* failure recovery;
* optional Undo behaviour.

## 6.3 Form state

Temporary form input belongs to the form or editor component.

Form state should not modify canonical application state until the appropriate commit point.

## 6.4 Derived state

Filtered, grouped and sorted views should be derived through selectors.

Do not store duplicated derived arrays as separate canonical state.

## 6.5 Navigation state

Navigation destinations, labels, icons and mobile dock membership should come from one navigation registry.

Desktop and mobile navigation should not maintain unrelated definitions of the same destination.

## 6.6 Feedback state

Transient user feedback belongs to the shared feedback provider.

Individual screens must not own global feedback timers.

## 6.7 Dialog state

Shared confirmations and modal lifecycle state should be owned by a dialog or modal host.

## 6.8 Mutation state

Pending, failed and conflicted operations should be centrally observable so they can support:

* feature-level indicators;
* global connection messaging;
* Diagnostics;
* Export safety;
* recovery actions.

---

# 7. User feedback pattern

## 7.1 Purpose

All transient cross-screen user feedback should use one shared feedback system.

Examples include:

* Moved to Trash
* Restored
* List Item added
* Changes saved
* Link copied
* Export created
* Synchronisation failed
* Could not save changes
* Undo available

Do not implement these through feature-specific labels, local `setTimeout` calls or screen-owned message state.

## 7.2 Shared feedback package

Provide a package such as:

```text
src/core/feedback/
```

Its public API should support operations similar to:

```ts
feedback.show({
  tone: "success",
  message: "Moved to Trash",
  duration: "standard",
  scope: "route",
  action: {
    label: "Undo",
    run: undoDelete,
  },
});
```

Convenience methods may include:

```ts
feedback.success(...)
feedback.info(...)
feedback.warning(...)
feedback.error(...)
```

## 7.3 Feedback message model

A feedback message should support, where applicable:

* stable message ID;
* tone;
* concise message;
* optional title;
* optional Lucide icon;
* display duration;
* creation timestamp;
* optional action;
* optional dismiss action;
* deduplication key;
* scope;
* accessibility priority;
* optional related operation ID.

## 7.4 Feedback scopes

Support explicit scopes such as:

### Route-scoped

Cleared when navigating to another destination.

Use for feedback tied to the screen where an operation occurred.

Example:

```text
Moved to Trash
```

### Global transient

Persists briefly across navigation when the result remains relevant.

Example:

```text
Export created
```

### Persistent

Remains until explicitly resolved or dismissed.

Use sparingly for conditions such as:

* failed mutation;
* lost connection;
* unresolved conflict.

Persistent system failures may be better represented by a dedicated status surface rather than a toast.

## 7.5 Automatic cleanup

The feedback system must centrally handle:

* timers;
* route-change cleanup;
* component unmount cleanup;
* message replacement;
* duplicate suppression;
* maximum visible queue length;
* action completion;
* reduced-motion behaviour.

Feature components must not implement their own cleanup timer.

## 7.6 Feedback host

Render one `FeedbackHost` near the application root.

The host should:

* display the active queue;
* use `aria-live`;
* distinguish ordinary and urgent messages appropriately;
* follow `STYLE.md`;
* avoid obstructing the mobile dock or Add button;
* support keyboard-accessible actions;
* avoid stacking unlimited messages.

## 7.7 Feedback boundaries

Use transient feedback for concise operation results.

Do not use it for:

* field validation;
* lengthy instructions;
* permanent system state;
* detailed error diagnostics;
* content that must remain visible for a user decision.

Those belong in inline fields, panels, dialogs or Diagnostics.

---

# 8. Dialog, confirmation and modal pattern

## 8.1 Shared modal primitive

All feature modals should use one shared modal primitive.

It should own:

* backdrop;
* focus containment;
* initial focus;
* focus restoration;
* Escape handling;
* body scroll locking;
* responsive dimensions;
* viewport overflow;
* accessible labelling;
* safe close behaviour.

Feature modals should supply content and actions rather than recreate modal mechanics.

Custom dropdowns and popovers inside a modal use the shared anchored-overlay portal rather than absolute positioning within the modal. The overlay prefers below its trigger, flips above when needed, clamps to the viewport, repositions on scroll/resize and uses internal overflow when the available screen is constrained. Because client rectangles include the effective CSS interface zoom, the shared positioning path converts final viewport coordinates and matched widths back through that CSS zoom before assigning fixed CSS positions. Browser zoom remains browser-managed and must not be folded into that conversion. Native `select` popups remain browser-managed.

## 8.2 Shared confirmation service

Confirmation requests should use a central confirmation path.

Feature code should describe:

* title;
* message;
* confirmation label;
* cancellation label;
* destructive or ordinary tone;
* optional consequences;
* confirmation callback.

Do not use:

* `window.confirm`;
* bespoke confirmation overlays;
* different confirmation mechanics per feature.

## 8.3 Form dialogs

Feature-specific forms may compose the shared modal with:

* form fields;
* validation;
* submission state;
* feature-specific content.

The shared modal should not understand Task, List or Project fields.

Project selection in creation and editing flows uses the shared Project combobox. Consumers provide active Project records and retain both draft display text and the resolved Project ID. A unique exact title match is resolved through the shared helper before domain validation and submission, so typed and clicked selection paths persist the same relationship. Ambiguous duplicate titles require an explicit choice.

Parent context display uses the shared entity-context line and location selector. It derives indirect Area context from a Project, orders Area before Project, replaces their visible prefixes with the established LandPlot and FolderKanban icons, retains accessible kind labels, applies entity colour only to titles and joins multiple parents with commas. Icon-bearing entries must preserve the surrounding inline text baseline. Feature rows should not rebuild this hierarchy, icon or colour logic.

Area and Project selection controls expose configured entity colour on option titles and the resolved selected value. Keep a custom dropdown's Lucide disclosure icon on the ordinary foreground colour instead of inheriting the selected entity colour. Whenever Area and Project/Destination controls coexist in an editable modal or screen, place Area first in both source and visual order. Schedule Area and Destination controls remain two presentations over one canonical Task location: either control replaces the prior location rather than persisting conflicting Area and Project fields.

Use the shared `CircleCheckbox` for every binary or multi-select checkbox interaction, including menu options. It preserves checkbox semantics with `role="checkbox"` and `aria-checked`, renders Lucide `Circle` off and `CircleCheck` on, uses an associated entity colour for the checked icon when available, and otherwise uses mint. Do not introduce visible native checkbox inputs.

Use generic Quantifier definitions for unique dimensional metadata rather than mutually exclusive Tag Groups. Store stable option IDs per definition in an entity's `quantifierSelections`; validate selections against active definitions and options on every write. Each option owns a canonical ordered `iconNames` array. Parse the Settings pipe string through `parseLucideIconTokens`, preserving repeats; validate names against the installed Lucide registry in the Settings save path, while the domain command normalises and enforces canonical token syntax without pulling the full icon registry into the startup bundle. Renaming options preserves assignments, while removing options cleans invalid assignments from Tasks, Projects, Lists and Schedule templates. Use `QuantifierFields` for editing. Display configured icon sequences through the shared `QuantifierTitleIcons` beside Project, Task and List names, and use `quantifierMetadataContextsForSelections` with `EntityContextLine` for selections that need the dimension-icon-plus-name fallback. Both paths preserve Quantifier definition order and accessible full names; metadata follows hierarchical Area/Project context.

Render Task-count and completion summaries through shared `TaskProgressMeta`, including Project cards/details and aggregate Tasks. It owns the established `ListTodo` marker, baseline-safe inline geometry and action-colour icon treatment; feature rows supply only the derived progress wording.

Projects reference the same stable global Status IDs as Tasks. Derive active/closed behavior from the referenced Status category and synchronize legacy `completedAt`/`cancelledAt` timestamps as lifecycle compatibility fields; do not infer a Project's configured Status from timestamps after migration. Render configured status glyphs through the shared `StatusIcon` mapping, and enforce colour/icon uniqueness in domain Status commands as well as filtered editor choices. Status drag/drop must call the relative reorder command with stable dragged and target IDs plus before/after placement; a drop target's directional move callback cannot represent non-adjacent reordering.

Project colour remains a supported persisted/domain field but is dormant in Project management UI. The Project modal must forward the existing stored colour unchanged on edit and the established default on create without rendering a picker. Project browser rows do not activate the retained `.project-row--colour-accent` hook. Do not remove the field, migration, command validation, Activity History support or dormant CSS because the presentation may be restored later.

Cross-kind Task/Project conversion uses atomic pure commands, never a kind mutation on an existing record. Construct and validate a fresh target record, rewrite compatible hierarchy and dependent destinations, then remove the source record within the returned snapshot. Preserve information through compatible target fields or an explicit readable fallback; never delete the source before a complete target exists.

Optional appearance fields distinguish `undefined` from `null`: omitted values preserve existing state during partial command use, while explicit `null` unassigns the stored appearance value.

---

# 9. Mutation coordination pattern

## 9.1 One mutation path

All canonical data changes should pass through one mutation coordinator.

Feature components must not:

* directly replace the application snapshot;
* call persistence adapters directly;
* manually duplicate retry logic;
* manually create pending states;
* manually resolve version conflicts.

## 9.2 Mutation request

A mutation request should identify:

* operation name;
* affected entity IDs;
* expected canonical revision baseline, with expected record versions only where they add useful diagnostics;
* optimistic transformation;
* persistence command;
* success result;
* transient retry policy;
* failure recovery options;
* Activity Event description;
* optional Undo receipt;
* feedback configuration.

For the current whole-snapshot persistence model, every mutation must submit the canonical revision originally read. Creation is not exempt. Per-record versions may remain in requests for diagnostics or future granular persistence, but they do not replace the canonical snapshot revision guard.

## 9.3 Mutation lifecycle

The shared coordinator should manage:

1. Validate the request.
2. Create an operation ID.
3. Apply the optimistic change.
4. Mark the operation pending.
5. Submit through the persistence port.
6. Retry eligible transient failures.
7. Reconcile confirmed authoritative state.
8. Record success metadata.
9. Create feedback where configured.
10. Record or expose Undo where applicable.

On failure:

1. Classify the error.
2. Mark the operation failed or conflicted.
3. Preserve sufficient information for recovery.
4. Expose Retry, Discard or Reload where applicable.
5. Add safe diagnostic information.
6. Avoid silently reverting unless the operation explicitly requires rollback.

## 9.4 Mutation observability

The coordinator should provide:

* pending operation count;
* retrying operation count;
* failed operation count;
* conflict count;
* latest confirmed canonical revision;
* latest failure category;
* last successful mutation time;
* operation lookup by ID.

Diagnostics and Export safety should consume this shared state.

## 9.5 Persistence boundary

The mutation coordinator should call an application-facing persistence interface.

Provider-specific behaviour remains in Infrastructure.

---

# 10. Error pattern

## 10.1 Typed application errors

Use a shared error taxonomy where practical.

Examples:

* ValidationError
* AuthenticationError
* AuthorisationError
* ConnectionError
* ConflictError
* PersistenceError
* ConfigurationError
* NotFoundError
* UnknownApplicationError

## 10.2 Error normalisation

Provider and browser errors should be normalised before reaching feature UI.

Feature components should not interpret raw Supabase error strings.

## 10.3 User-facing errors

A user-facing error should provide:

* concise summary;
* relevant recovery action;
* optional expandable technical details;
* stable category for diagnostics.

## 10.4 No silent catches

Do not swallow errors without:

* deliberately handling them;
* recording them safely;
* or passing them to the shared error path.

---

# 11. Entity lifecycle pattern

## 11.1 Central lifecycle commands

Soft deletion, restoration, archiving, unarchiving, closing and reopening should use shared domain or application commands.

Feature UI must not directly patch fields such as:

```ts
deletedAt = undefined
```

## 11.2 Soft deletion

A central soft-delete command should consistently:

* set deletion metadata;
* update timestamps;
* increment version;
* record Activity History;
* preserve original location;
* create an Undo receipt where appropriate;
* produce shared feedback.

## 11.3 Restoration

A central restore command should:

* validate the previous location;
* restore safely;
* update timestamps;
* increment version;
* record Activity History;
* report fallback placement if the original container is unavailable.

## 11.4 Archive and Closed states

Archive, Closed and deleted are distinct concepts.

Shared lifecycle functions must not conflate them.

---

# 12. Undo pattern

## 12.1 Operation-based Undo

Undo should reverse a specific completed application operation.

An Undo receipt should contain:

* operation ID;
* description;
* affected entities;
* reversal command or safe restoration data;
* expiry where applicable;
* whether the operation remains undoable.

## 12.2 Shared Undo service

A shared Undo service should:

* register receipts;
* expose the current available action;
* expire temporary Undo safely;
* perform reversal through the mutation coordinator;
* create a new Activity Event;
* prevent repeated reversal;
* provide feedback.

## 12.3 Undo is not state rollback

Undo is a new user operation.

It must not erase the original Activity Event.

Immediate Undo may be a fuller reversal than later ordinary Restore. For example, a Project deletion Undo can use a temporary receipt to restore severed Task and List relationships, while a later Trash Restore only restores the Project record because those relationships were deliberately detached by the deletion command. Do not retain Undo receipts indefinitely or treat Restore as a hidden rollback.

---

# 13. Activity History pattern

## 13.1 Shared event creation

Use shared event factories or recorders for common operations.

Examples:

* entity created;
* field changed;
* moved;
* completed;
* cancelled;
* reopened;
* deleted;
* restored;
* archived;
* reordered;
* Undo performed.

## 13.2 Event consistency

Events should consistently include:

* ID;
* entity type;
* entity ID;
* operation type;
* timestamp;
* old value where applicable;
* new value where applicable;
* source operation ID;
* short human-readable summary.

## 13.3 Feature-specific history

Feature modules may define specialised event details, but should still use the shared recorder and base event format.

---

# 14. Validation pattern

## 14.1 Pure validators

Validation rules should be pure and independently testable.

Examples:

* required title;
* supported HTTP or HTTPS URL;
* valid date-only value;
* destination compatibility;
* Tag scope compatibility;
* mutually exclusive Tag selection.

## 14.2 Shared validation result

Use a consistent validation result shape:

```ts
type ValidationResult =
  | { valid: true }
  | { valid: false; code: string; message: string };
```

## 14.3 Field validation

Field errors should appear beside the relevant control.

Do not use global feedback for ordinary form validation.

## 14.4 No duplicated URL checks

List Item links and any future links should use the same safe URL validator.

## 14.5 Configuration selectors and effective Tag rules

Feature code should use shared pure selectors for active ordered configuration records rather than manually filtering arrays. This includes ordered active Statuses, ordered Priorities, default Priority, active Tags by scope, ordered active Tag Groups, grouped Tag picker data and effective Tag rules.

Mutually exclusive Tag behavior must be evaluated through the shared effective-rule function derived from the current Tag and active Tag Group. Do not copy inherited Tag Group properties onto Tags or entities.

---

# 15. Date and time pattern

## 15.1 Shared date service

All date-only and timezone-sensitive behaviour should use shared date helpers.

Do not scatter direct date calculations throughout feature components.

## 15.2 Application timezone

The application timezone is:

```text
Australia/Sydney
```

## 15.3 Date-only semantics

Shared helpers should cover:

* current local date;
* date comparison;
* overdue calculation;
* scheduled-date formatting;
* reveal-date eligibility;
* start of week;
* recurrence boundaries;
* daylight-saving-safe conversion.

## 15.4 Testable clock

Time-sensitive logic should accept an injectable clock or explicit current date in tests.

Avoid tests that depend on the machine’s current date.

---

# 16. Ordering pattern

## 16.1 Shared ordering service

Manual ordering should use one shared ordering strategy.

It should support:

* move before;
* move after;
* move up;
* move down;
* insert at end;
* stable tie-breaking;
* optimistic reorder;
* persistence of the resulting order.

## 16.2 No exposed numeric order

Users must not see internal order values.

## 16.3 Feature independence

Tasks, Projects, Lists and List Items may use the same ordering primitives while retaining feature-specific validation.

## 16.4 Avoid unnecessary full rewrites

Prefer an ordering strategy that does not rewrite every sibling for a normal move where practical.

Do not introduce an excessively complex fractional-ordering system unless it provides clear value.

---

# 17. Navigation and capability pattern

## 17.1 Navigation registry

Define launch destinations once.

Each destination definition may include:

* ID;
* label;
* Lucide icon;
* desktop visibility;
* mobile dock page;
* desktop order and, where the dock intentionally differs, mobile order;
* route or state key;
* capability requirements.

Desktop and mobile navigation should derive from this registry.

## 17.2 Capability checks

Feature availability such as desktop-only Export should use shared capability rules.

Avoid repeated viewport checks and scattered conditional rendering.

CSS may control presentation, but unavailable controls should also be absent from keyboard and accessibility trees.

## 17.3 Navigation cleanup hooks

Route changes should centrally trigger appropriate cleanup such as:

* closing Add menus;
* clearing route-scoped feedback;
* resetting transient filters;
* closing temporary panels where defined.

## 17.4 Contextual Add registry

Global creation actions should resolve through one application-level contextual Add registry.

Screens may declare active context such as open List, active parent Task or Settings subsection, but they must not manually concatenate FAB action arrays.

The root FAB host should:

* resolve permanent actions;
* append available contextual actions;
* enforce capability checks;
* sort deterministically in visual top-to-bottom order;
* hide the FAB during blocking overlays;
* close and recalculate the menu during route or context changes.

Unavailable future actions should be absent, not disabled placeholders.

---

# 18. Loading, empty, pending and failure states

Use shared primitives for:

* initial loading;
* empty collection;
* inline pending;
* failed mutation;
* disconnected state;
* unavailable configuration;
* unauthenticated state.

Feature modules should provide the feature-specific wording and actions.

The shared primitives should provide consistent structure, accessibility and styling.

---

# 19. Diagnostics and logging pattern

## 19.1 Structured diagnostics

Cross-cutting services should expose safe structured diagnostic state.

Diagnostics should aggregate from:

* build information;
* authentication;
* persistence;
* subscriptions;
* mutation coordinator;
* recurrence processor;
* configuration;
* feature capability state.

## 19.2 Secret redaction

All diagnostic output must pass through the shared redaction path.

## 19.3 Logging

Use a small structured logger rather than scattered production `console.log` calls.

Logging should support:

* category;
* severity;
* timestamp;
* operation ID;
* safe metadata.

Sensitive record content and credentials must not be logged.

---

# 20. Build metadata and Export pattern

## 20.1 Central build information

Application version, schema version, build identifier and build timestamp should come from one build-information module.

Do not hard-code version strings in screens.

## 20.2 Export guard

Export should consult shared application state for:

* initial sync completion;
* pending mutations;
* failed mutations;
* canonical-state confidence.

## 20.3 Export builder

The versioned export envelope should be created through one shared builder.

Feature screens should trigger export but should not assemble its format.

---

# 21. Feature module pattern

Each substantial feature should own its feature-specific code.

A feature package may contain:

```text
features/lists/
  components/
  hooks/
  listCommands.ts
  listSelectors.ts
  listValidation.ts
  listTypes.ts
  index.ts
```

Feature modules should:

* compose shared primitives;
* call shared application services;
* contain feature-specific rules;
* expose a small public API;
* avoid reaching into another feature’s internal files.

Cross-feature operations should live in Domain or Core application services rather than one feature importing another feature’s UI internals.

---

# 22. React component pattern

## 22.1 App composition

The root `App` component should compose providers, shell and feature routing.

It should not contain the implementation of every screen.

## 22.2 Screen components

Each major destination should have its own screen component or feature entry point.

## 22.3 Hooks

Use hooks for reusable React lifecycle integration.

Do not hide domain rules inside hooks when they can be pure functions.

## 22.4 Event handlers

Large event handlers should delegate to commands or services.

A component should not manually perform:

* domain mutation;
* persistence;
* retry;
* feedback;
* Activity History;
* Undo registration

inside one inline handler.

---

# 23. Infrastructure pattern

## 23.1 Persistence port

Define the application-facing persistence contract independently from Supabase.

## 23.2 Provider adapters

Provider adapters should:

* translate provider errors;
* enforce version behaviour;
* expose subscriptions;
* report diagnostics;
* avoid leaking provider-specific types into Feature code.

## 23.3 Development provider

The development-only provider should implement the same contract.

It must remain clearly identified as non-production.

---

# 24. Testing pattern

## 24.1 Test by responsibility

Use:

* pure unit tests for Domain rules;
* service tests for Core packages;
* contract tests for persistence adapters;
* interaction tests for shared UI patterns;
* focused feature tests for complete workflows.

## 24.2 Required shared-service coverage

Shared technical services should have focused tests for:

* feedback cleanup;
* route-scoped feedback removal;
* feedback deduplication;
* modal focus restoration;
* mutation state transitions;
* retry classification;
* failed mutation preservation;
* soft deletion;
* restoration;
* Undo;
* Activity Event creation;
* URL validation;
* date boundaries;
* ordering;
* diagnostic redaction;
* export guard behaviour.

## 24.3 Avoid brittle implementation tests

Test observable behaviour and public service contracts rather than internal variable names.

## 24.4 Focused execution

Run the smallest relevant tests.

Do not run the full suite repeatedly.

A hanging test process is a technical defect and should be investigated rather than ignored indefinitely.

---

# 25. Prohibited patterns

Avoid:

* screen-specific feedback timers;
* repeated toast implementations;
* direct `window.confirm`;
* direct Supabase calls from feature components;
* direct local storage calls from feature components;
* raw `new Date()` calculations scattered across screens;
* manual patches of lifecycle fields;
* duplicated URL validators;
* duplicated navigation arrays;
* hard-coded build versions;
* one giant `App.tsx`;
* feature components assembling export data;
* feature components interpreting raw provider errors;
* silent `catch` blocks;
* a miscellaneous utility dumping ground;
* abstractions created only to reduce line count;
* generic repositories that erase meaningful domain behaviour.

---

# 26. Initial adoption targets

The current application should adopt these shared patterns first.

## 26.1 User feedback

Migrate all current transient feedback, including:

* Moved to Trash;
* restored messages;
* creation success or failure;
* copied diagnostics;
* export success or blocked state;
* list reorder or delete feedback;
* synchronisation messages.

## 26.2 Modals and dialogs

Migrate:

* creation modal;
* List Item edit modal;
* authentication-related modal surfaces where applicable;
* future confirmation dialogs.

## 26.3 Mutation coordination

Replace the central `commit` implementation and feature-specific persistence calls with one mutation coordinator.

## 26.4 Entity lifecycle

Use shared commands for:

* Task deletion;
* List deletion;
* List Item deletion;
* Trash restoration;
* archive and unarchive when exposed.

## 26.5 Undo

Centralise the existing List Item delete Undo and prepare the same path for other reversible operations.

## 26.6 Activity History

Centralise event creation for current Task, List and List Item mutations.

## 26.7 Navigation

Unify desktop navigation, mobile dock definitions and destination metadata.

## 26.8 Validation

Centralise:

* required names and titles;
* List Item URL validation;
* destination validation.

## 26.9 Ordering

Centralise List Item reorder and prepare the same service for later Task, Project and List ordering.

## 26.10 Diagnostics and build information

Centralise:

* application version;
* schema version;
* build metadata;
* mutation counts;
* provider status;
* safe diagnostic copying.

## 26.11 Shared states

Migrate repeated:

* empty states;
* loading states;
* pending states;
* failed states;
* configuration-unavailable states.

---

# 27. Extending the architecture

Before creating a new technical pattern, ask:

1. Does an existing Core package already own this concern?
2. Can the existing package be extended without making it incoherent?
3. Is the behaviour feature-specific or cross-cutting?
4. Who owns the state?
5. What is the dependency direction?
6. How will cleanup occur?
7. How will errors be represented?
8. How will Diagnostics observe it?
9. How will it be tested?
10. Does `PATTERNS.md` need updating?

A new shared package should include a clear public API and focused tests.

---

# 28. Completion standard

A feature implementation follows this document when:

* cross-cutting behaviour uses the established shared service;
* Feature components remain focused on feature presentation and orchestration;
* Domain rules remain pure;
* provider details remain in Infrastructure;
* feedback and cleanup are not bespoke;
* mutations use the shared coordinator;
* lifecycle operations use shared commands;
* Activity History and Undo are consistent;
* common validation is reused;
* date and ordering logic is centralised;
* Diagnostics can observe important state;
* focused tests cover the shared contract;
* documentation is updated when the pattern is extended.

---

# 29. Launch task-view coordination

Task-containing launch views should call the shared selector layer instead of filtering inside screen components. The selector owns deleted exclusion, reveal eligibility, Closed visibility, Deferred placement, no-duplicate sectioning, sorting, grouping and transient AND filters.

View preferences belong to stable view keys. Broad task views use their route-level keys; Project and Area detail use shared `project-detail` and `area-detail` keys unless a future model deliberately supports per-container preferences.

Hash route serialisation remains centralised in the app routing boundary. Public stable routes use GitHub Pages-compatible hashes and parse into screen state before feature components render.

Entity-detail Back controls are resolved once in the app shell for Lists, Projects and Areas. Detail-route pushes mark that an in-app predecessor exists, allowing Back to use browser route history and preserve arbitrarily deep access paths. Direct detail loads use the entity landing route as a safe fallback. Feature detail components must not add parallel local Back controls.

Settings subsection Back controls are likewise resolved once in the app shell. Every non-home Settings route returns directly to Settings home through the central Settings route setter; subsection components must not render parallel local Back controls.

Bulk Task actions should be implemented as command functions that accept canonical data, selected IDs and one command description, then return a complete next snapshot plus affected IDs. React components may collect control values and request confirmation, but they should not own hierarchy deduplication, cascade calculation, validation or Activity Event generation.

Task hierarchy mutations should share the domain command path. Editor placement saves, standalone Move actions, Parent clearing and bulk Move must call the same subtree movement command rather than patching location fields directly. Aggregate Complete/Reopen and individual child reopening likewise belong in reusable commands so Activity History, ancestor closure/reopen, version increments and Undo receipt payloads stay consistent across row actions, editor saves and bulk operations.

The shared Task Move dialog supplies one `TaskMoveDestination` to the same subtree command for single and bulk movement. Parent candidate filtering is centralised in that workflow. Sibling drag ordering calls the shared sibling-order command and must not encode location changes.

Launch-critical Undo receipts store only affected records or relationship fields. Whole-application snapshot restoration is prohibited for bulk Task Undo. Reversal validates the confirmed affected versions before committing one protected Undo mutation and one new immutable Activity Event.
# 2026-07-02 shared filtered-route patterns

Filtered hierarchy projection belongs in pure view-model code and returns matching IDs, structural ancestor IDs and visible hierarchy IDs. React renders that projection and must not rediscover traversal rules. Detail routes with a valid entity-shaped hash retain the route and render one shared unavailable state instead of silently redirecting.

# 2026-07-02 desktop cleanup shared patterns

Header application actions belong in the app-level hamburger menu, not as repeated direct header buttons. Desktop Export remains capability-gated and absent from mobile layout/focus order. Bakery remains a navigation destination in desktop navigation and the secondary mobile dock, so it does not duplicate in the header menu.

Mobile view-control disclosure state belongs at the app shell because the trigger sits in the shared top bar while the controlled toolbar belongs to the active feature surface. It resets through the central route-cleanup path. Feature screens continue to own their filter values and view preferences; the shell controls only mobile visibility.

Task row interactions stay on the shared `TaskSection`/`TaskRow` path. Row-body clicks may toggle bulk selection, but interactive children must stop propagation and continue to call the existing editor, move, completion, deletion, ordering and mutation paths. Compact row presentation is a view preference fallback, not a separate row implementation.

Root Task alignment is part of the hierarchy pattern. Root rows align to their section heading and empty/filtered states; only descendant nodes receive hierarchy indentation. Do not add compensating padding both at the section and row level.

Completion exit animation is a view projection, not a second domain command. When hidden Closed rows need to show the completion animation, keep a short local exiting row projection mounted for the CSS completion window, call the existing completion mutation path, disable repeated completion clicks for that projection, then remove the projection. If reduced motion is preferred, do not add an artificial delay. If mutation recovery returns the Task to an open state, the temporary projection must clear and the canonical row must render from current data.

Shared editor disclosures use the `.disclosure-heading` style for uppercase headings and ordinary button semantics for click and keyboard operation. History panels that can be expensive or visually noisy should be collapsed by default and mount their Activity History content only when expanded.

Transient feedback timing belongs in `src/core/feedback/FeedbackHost.tsx` and `feedbackTypes.ts`. Feature code must not add local toast timers. Failed canonical mutations remain represented by mutation coordinator state plus the persistent recovery banner; transient toasts may dismiss after 2.5 seconds.

The selected left-edge pill is a shared visual state in CSS for comparable selectable rows. Do not encode full aqua borders in individual feature components for selected rows.

# 2026-07-23 mobile card patterns

Card-list safe area belongs to the mobile workspace scroller. Fixed dock, FAB and FAB-menu layers do not participate in document flow, and the outer shell must not repeat the workspace's bottom reservation.

Responsive card actions remain one component/action source per entity. Lists use CSS placement for their three mobile icon actions. Projects and Areas pass their existing callbacks into the shared card hamburger menu, which uses `AnchoredOverlay` with left placement for portal escape, viewport clamping, scroll/resize repositioning and outside-pointer dismissal. Do not fork mutation logic into a mobile-only component.

Task-bearing launch and detail views share `TaskViewPanel`, `TaskSection`, `TaskRow` and `ViewControls`; mobile action-grid, filter disclosure and title-row changes belong in those shared layers. Reorder handles align to the complete rendered card height rather than a title sub-row. Trash's entity selector remains four columns at mobile width.

## Optional destination loading

Large, infrequently used destination components may be loaded with `React.lazy` at the app composition boundary when a measured production build shows a worthwhile initial-chunk reduction. Canonical state, domain commands, routing, navigation, mutation recovery and launch-critical Task surfaces remain eager. Each lazy destination renders inside `Suspense` with visible `role="status"` loading text and remains covered by the application error boundary. Do not create tiny destination chunks or arbitrary manual vendor chunks solely to silence Vite's size warning.
