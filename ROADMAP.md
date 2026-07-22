# ToDonut Roadmap

This document records features that have been deliberately deferred beyond the initial ToDonut launch scope.

It is not a commitment to implement every item in a specific order. Unless an item is explicitly marked as low priority, prioritisation should be based on practical use of the launch application.

## Roadmap principles

Future work should continue to preserve the following product principles:

* ToDonut is designed for one primary user, not a general multi-user audience.
* Frontend responsiveness remains a higher priority than waiting for backend confirmation.
* All ordinary deletion remains soft deletion.
* New features should remain compatible with the existing GitHub Pages deployment model.
* Hosted services should remain viable without a paid subscription for the expected single-user workload.
* Future workflow features should remain compatible with Getting Things Done, while avoiding mandatory adherence to one productivity system.
* Roadmap features should be implemented in focused passes rather than introduced partially across unrelated work.
* Existing JSON exports should remain migratable through explicit schema-version handling.

---

# 1. Quick-add shorthand

## Goal

Allow experienced use of the quick-add field without opening the full Task editor.

## Intended capabilities

Quick-add syntax may eventually support:

* Project selection.
* Area or special-location selection.
* Priority selection.
* Tag selection.
* Must Do Today.
* Scheduled date.
* Reveal date.
* Status selection.

Example syntax might eventually resemble:

```text
Buy replacement cable #Errands !High @Hardware tomorrow
```

The exact syntax has not been selected.

## Requirements

* Plain text without shorthand must continue to create an Inbox Task.
* Shorthand must be optional.
* Invalid shorthand must not silently discard text.
* Ambiguous text should remain part of the Task title unless explicitly recognised.
* The syntax should be discoverable through lightweight inline help.
* Mobile entry must remain fast.
* The parser should remain separate from Task creation logic.

## Open questions

* Which prefix characters should represent Tags, Projects, Areas and Priorities?
* Whether date shorthand should be added at the same time.
* Whether autocomplete should appear while typing.

---

# 2. Task templates

## Goal

Allow commonly repeated Tasks or groups of Tasks to be recreated without manually rebuilding their structure.

## Intended capabilities

Templates should eventually support:

* Saving an existing Task as a template.
* Creating a new Task from a completed Task without permanently saving a template.
* Creating multiple related Tasks from one template.
* Including descriptions, Tags, Priority, location and checklist content.
* Optionally including subtask trees.
* Editing and archiving templates.
* Selecting which fields are copied when applying a template.

## Requirements

* Templates must not retain completion history from their source Task.
* Applying a template must create independent new records.
* Later changes to a template must not alter Tasks already created from it.
* Creating several Tasks from one template should be one undoable logical operation.
* Template-generated Tasks should not need to expose their template origin in normal use.
* Templates should support Inbox, Project, Area and Someday destinations.

## Related roadmap work

* Aggregate-tree duplication.
* Recurring subtasks.
* Quick-add shorthand.

---

# 3. Expanded date model

## Goal

Extend the launch date model beyond a single scheduled date and optional reveal date.

## Current launch model

* Scheduled date means when the user intends to act on the Task.
* Reveal date controls when a deferred Task becomes ordinarily visible.
* Dates are date-only.
* There is no separate deadline.

## Intended future capabilities

Add distinct concepts for:

* Scheduled or planned work date.
* Due deadline.
* Optional start date.
* Reveal date.
* Potentially a date range.

A Task may eventually have both a planned work date and a deadline.

## Requirements

* Existing scheduled dates must migrate without changing meaning.
* Today must distinguish work planned for today from deadlines due today.
* Overdue behaviour must specify whether it refers to the deadline, the scheduled date or both.
* Sorting and filtering must distinguish date types.
* Recurrence templates must define which date fields are produced.
* Existing launch views must remain understandable when multiple dates exist.

## Open questions

* Whether the current `scheduledDate` becomes `plannedDate`.
* Whether deadlines may have times or remain date-only.
* Whether start date and reveal date remain separate concepts.
* Which date drives Upcoming by default.

---

# 4. Advanced recurrence patterns

## Goal

Expand recurrence beyond the launch daily, weekly and monthly calendar patterns.

## Intended capabilities

Future recurrence rules may support:

* The last Friday of each month.
* The first weekday of a month.
* The second Tuesday of a month.
* Other ordinal weekday patterns.
* More complex monthly scheduling.
* Potential yearly recurrence if later required.

## Requirements

* Calendar calculations must use the Australia/Sydney timezone.
* Generation must remain idempotent.
* Concurrent clients must not create duplicate occurrences.
* Existing generated Tasks must remain independent snapshots.
* Editing a rule must affect future generated Tasks only.
* Advanced rules must be representable in the versioned JSON export format.

## Open questions

* Whether to adopt a limited recurrence-rule model or a more general RRULE-compatible model.
* How complex rules should be presented on mobile.
* Whether unsupported imported recurrence rules should be preserved but made read-only.

---

# 5. Completion-relative recurrence

## Goal

Allow selected recurrence rules to schedule the next Task from completion of the previous Task rather than from a fixed calendar pattern.

## Example

A Task configured for every 10 days after completion would create its next occurrence 10 days after the prior occurrence is completed.

## Requirements

* This must be an explicit per-rule option.
* Calendar-based recurrence remains the default.
* Completion-relative recurrence must not generate the next Task before the triggering Task closes.
* Cancelled Tasks need a defined outcome.
* Reopening a triggering Task must not silently remove a later generated occurrence.
* Duplicate generation must remain impossible.
* Rule history must make the generation decision auditable.

## Open questions

* Whether cancellation counts as completion for recurrence purposes.
* Whether the next occurrence is based on completion date or completion timestamp.
* What happens when a completed occurrence is later reopened.

---

# 6. Recurring subtasks and Task trees

## Goal

Allow a recurrence rule to generate a complete Task tree rather than only one actionable Task.

## Intended capabilities

* Recurrence templates containing subtasks.
* Nested recurring subtask structures.
* Aggregate parents generated from a recurrence template.
* Independent editing of each generated tree.
* Optional completion-relative recurrence at the tree level.

## Requirements

* Each generated Task tree must be a complete independent snapshot.
* Editing one generated tree must not alter the rule template.
* Existing aggregate-parent rules must be preserved.
* Generation must be atomic so that partial trees cannot be created.
* Missed-occurrence collapsing must treat each generated tree as one occurrence.
* The recurrence ledger must identify every Task belonging to an occurrence without exposing that relationship in normal Task editing.

## Dependencies

* Stable aggregate-tree duplication.
* Mature recurrence generation.
* Versioned recurrence template schema.

---

# 7. Skipping recurrence occurrences

## Goal

Allow one expected recurrence occurrence to be deliberately skipped without pausing or changing the entire rule.

## Intended behaviour

A skipped occurrence should:

* Create a historical skipped-occurrence record.
* Not create an ordinary Task.
* Leave later recurrence dates unchanged.
* Remain visible in the recurrence rule history.
* Be included in full JSON exports.

## Requirements

* Skipping must be possible before the occurrence is generated.
* A generated Task should not be converted into a skip record after ordinary editing has begun.
* Undo should be supported before the occurrence boundary passes where practical.
* Skips must not create duplicate future occurrences.
* Pausing and skipping must remain separate concepts.

## Open questions

* Whether a skipped occurrence can later be restored as a Task.
* Whether skip reasons should be supported.
* How upcoming occurrences are exposed before generation.

---

# 8. Aggregate Task-tree duplication

## Goal

Allow an aggregate parent and all descendants to be duplicated as one new Task tree.

## Intended capabilities

* Duplicate an entire Task hierarchy.
* Preserve names, descriptions, Tags, Priority and structure.
* Reset completion, cancellation and Activity History.
* Select the destination Project, Area or special location.
* Optionally adjust scheduled dates relative to the source tree.

## Requirements

* New stable IDs must be created for every duplicated Task.
* Parent-child relationships must point only to new duplicated records.
* Duplication must be one atomic and undoable operation.
* The original tree must remain unchanged.
* Aggregate progress must recalculate from the duplicated descendants.
* Recurrence and template origin metadata must not be copied accidentally.

## Related roadmap work

* Task templates.
* Recurring subtasks.
* Relative date shifting.

---

# 9. Multi-Area Project membership

## Goal

Allow a Project to be associated with more than one Area.

## Current launch rule

A Project may belong to no Area or exactly one Area.

## Intended capabilities

* A Project may appear within multiple Areas.
* One relationship may optionally be designated primary.
* Area views should present the same canonical Project rather than duplicated Project records.
* Moving or editing the Project from any Area should update the one shared Project.

## Requirements

* Existing single-Area Projects must migrate cleanly.
* Project progress must not be double-counted in global totals.
* Filters and grouping need deterministic behaviour.
* Deleting or archiving an Area must not delete a shared Project.
* Area-specific manual ordering may need a relationship record rather than a field on the Project.
* JSON exports must preserve all Area relationships.

## Open questions

* Whether standalone Tasks may also belong to multiple Areas.
* Whether one Area is required to be marked primary.
* Whether Project Tags can be inherited from multiple Areas.

---

# 10. Nested Tag Groups

## Goal

Allow Tag Groups to contain other Tag Groups.

## Intended capabilities

* Hierarchical Tag organisation.
* Inherited boolean properties through parent groups.
* Shared mutually exclusive behaviour where appropriate.
* Collapsible Tag selection interfaces.

## Requirements

* Circular nesting must be prevented.
* Property inheritance order must be deterministic.
* Conflicting inherited values must have explicit resolution rules.
* Mutually exclusive behaviour must clearly define whether it applies within a direct group, descendant groups or both.
* Existing flat Tag Groups must migrate without change.
* Tag-selection performance must remain responsive.

## Open questions

* Whether multiple parent groups are allowed.
* Whether inherited properties may be overridden by child groups.
* Whether mutually exclusive rules can cross group boundaries.

---

# 11. Advanced Tag Group rules

## Goal

Extend Tag Group behaviour beyond the launch global inherited boolean properties.

## Possible capabilities

* Different inherited properties depending on whether a Tag is applied to a Task, Project or Reference List.
* Scope-specific mutually exclusive rules.
* Conditional Tag availability.
* Validation rules involving several Tag Groups.
* More expressive group-level metadata.

## Requirements

* Rules must remain understandable in the management interface.
* Hidden inherited behaviour must be visible when inspecting a selected Tag.
* Existing simple Tag Groups must remain valid.
* The rule engine must not make ordinary Tag selection slow or unpredictable.
* Configuration errors must be detectable before rules are activated.

## Status

This is a lower-confidence roadmap item because the added complexity may outweigh its value. It should be revisited only after sustained use of the launch Tag system.

---

# 12. Advanced status behaviour

## Goal

Extend global statuses beyond a single manually selected value.

## Confirmed future candidates

### Inline status changes

Allow status to be changed directly from Task cards without opening the full editor.

### Status automation rules

Statuses may eventually define optional behaviours such as:

* Setting a completion timestamp.
* Setting a cancellation timestamp.
* Clearing or retaining scheduled dates.
* Requiring confirmation.
* Requiring or suggesting a note.
* Applying an icon or completion effect.
* Controlling whether the Task counts as Closed.

### Derived or multi-axis workflow state

Explore whether some Task state should eventually be inferred from independent properties rather than represented only by one status.

Examples might include:

* Action state.
* Blocking state.
* Closure state.
* Waiting state.

## Requirements

* The launch one-status model remains canonical until an explicit migration is designed.
* Existing custom statuses must remain usable.
* Automation must not silently destroy user-entered fields.
* Any inferred state must be visibly explainable.
* Bulk status changes must remain predictable.
* Closed remains the broader category containing Completed and Cancelled.

## Status

Inline status editing and simple status automation are likely earlier candidates. A derived multi-axis status model is exploratory and should not be introduced without a clear demonstrated need.

---

# 13. GTD Next Actions

## Goal

Provide a dedicated Next Actions concept while retaining ToDonut’s method-neutral core.

## Intended capabilities

A Next Action may eventually be:

* Manually designated.
* Automatically inferred from Task order.
* Inferred from aggregate hierarchy.
* Inferred from future dependency support.
* Surfaced in a dedicated view.
* Used by GTD-oriented saved filters and review workflows.

## Requirements

* The preconfigured GTD starting state must continue to work without requiring Next Actions.
* Users must be able to override an inferred Next Action.
* Aggregate parents themselves must not become actionable Next Actions.
* Closed, deferred and unavailable Tasks must not be selected.
* Inference logic must be explainable.
* Next Action should remain separate from Priority and Must Do Today.

## Open questions

* Whether each Project has exactly one Next Action.
* Whether Projects may expose several parallel Next Actions.
* Whether manual designation overrides all inference.
* Whether Task ordering alone is sufficient without dependencies.

---

# 14. Weekly review workflow

## Goal

Add an optional guided review process compatible with Getting Things Done.

## Intended review stages

A weekly review might step through:

* Inbox.
* Overdue Tasks.
* Deferred Tasks becoming visible.
* Active Projects.
* Projects without an actionable next step.
* Waiting Tasks.
* Blocked Tasks.
* Someday Tasks.
* Loose Reference Lists.
* Stale or unreviewed Projects.
* Recurrence health.
* Failed or unsynchronised mutations.

## Requirements

* The workflow must remain optional.
* Progress through the review should be resumable.
* Review stages should eventually be configurable.
* The app should record when each Project was last reviewed.
* Dismissing a review must not modify Tasks.
* The review must use existing canonical Tasks rather than creating a parallel planning state.
* Mobile use must remain practical.

## Related roadmap work

* GTD Next Actions.
* Search and smart views.
* Reminder system.

---

# 15. Kanban board

## Goal

Provide a board presentation for Projects or filtered Task sets.

## Possible columns

Columns might be based on:

* Status.
* Priority.
* Scheduled-date state.
* A selected Tag Group.
* A future custom workflow field.

## Requirements

* Kanban is a presentation of canonical Tasks, not a separate data model.
* Moving a card between columns must apply a clearly defined field change.
* Aggregate parents need deliberate presentation rules.
* Subtasks that match a board must remain independently actionable.
* Drag-and-drop must work on mobile and desktop.
* Explicit move controls must remain available.
* Closed and deferred visibility must follow the board’s settings.
* Board preferences should be persisted per Project or view.

## Open questions

* Whether custom board definitions are needed.
* Whether one Task may appear in multiple Tag-based columns.
* Whether swimlanes should be supported.

---

# 16. Full-text search

## Goal

Provide fast search across ToDonut data.

## Intended search scope

Search may include:

* Task titles.
* Task descriptions.
* Project names.
* Area names.
* Reference List titles.
* Reference List entries.
* Tags and Tag Groups.
* Activity History.
* Recurrence rule names.

## Requirements

* Closed and deleted records should be excluded by default and optionally included.
* Search must remain responsive with years of data.
* Search results must link to the canonical item.
* Opening a result must preserve relevant view context where practical.
* Search should not expose authentication or diagnostic secrets.
* Backend search and client-side search behaviour must remain consistent.

## Potential later extensions

* Exact phrase matching.
* Structured operators such as `project:`, `tag:` and `status:`.
* Recent-search history.
* Search-driven saved views.

---

# 17. Advanced filters and smart views

## Goal

Extend launch AND-only transient filters into reusable and more expressive views.

## Intended capabilities

* OR filter groups.
* Nested AND and OR logic.
* Exclusion filters such as “does not have Tag X”.
* Saved named filter configurations.
* Smart views displayed in navigation.
* Optional custom sorting, grouping and presentation per smart view.
* Smart views based on GTD concepts.

## Requirements

* The filter expression format must be versioned.
* Invalid filters must fail visibly rather than hiding all Tasks without explanation.
* Active conditions must always be inspectable.
* Smart views must use canonical Tasks and must not create copies.
* Multi-Tag grouping must avoid duplicate editable Task rows.
* Saved views must synchronise between devices.
* Deleting a Tag, Project or Status referenced by a smart view must produce a repairable configuration state.

## Dependencies

* Stable filtering model.
* Full-text search if text queries are supported.
* Mature per-view preference persistence.

---

# 18. Reminders and notifications

## Goal

Allow Tasks to notify the user outside ordinary in-app viewing.

## Intended capabilities

* Reminders separate from scheduled dates.
* Multiple reminders per Task.
* Relative reminders such as one day before.
* Snoozing.
* Browser or device notifications.
* Missed-notification history inside ToDonut.
* Optional recurring reminder behaviour.
* Potential daily summaries.

## Requirements

* Reminders must be optional.
* Core Task management must continue to work if notification permission is denied.
* Notification previews should avoid exposing sensitive Task content where configured.
* Reminder delivery must not rely solely on a browser tab remaining open.
* Timezone and daylight-saving behaviour must use Australia/Sydney.
* Reminder records must be included in future JSON exports.
* Notification failures must be visible in diagnostics.

## Dependencies

* A suitable backend scheduler or push-notification architecture.
* Potential PWA support for more reliable mobile delivery.
* A later decision on exact Task times.

---

# 19. Calendar integration

## Goal

Allow ToDonut scheduling information to interact with an external calendar.

## Potential capabilities

* Display scheduled Tasks in a calendar.
* Export Tasks as calendar events.
* Import selected calendar events as Tasks.
* One-way synchronisation from ToDonut to a calendar.
* Later consideration of bidirectional synchronisation.
* Linking a Task to its source calendar event.

## Requirements

* Calendar integration must not become the canonical Task store.
* Duplicate event creation must be prevented.
* External deletions and edits must have explicit conflict behaviour.
* Date-only Tasks must not be accidentally converted into misleading timed events.
* Authentication credentials must never enter JSON exports.
* The integration must remain optional.
* Launch Task behaviour must remain unchanged when calendar integration is disabled.

## Open questions

* Which calendar provider should be supported first.
* Whether synchronisation should initially be one-way.
* Whether external calendar events should become Tasks automatically or only by explicit action.

---

# 20. Import and restoration

## Goal

Allow exported or externally sourced data to be brought into ToDonut.

## Confirmed future capabilities

### Native JSON import

Import a full-fidelity ToDonut JSON export.

This is the highest-priority future import format because it enables:

* Hosting-provider migration.
* Restoration into a fresh deployment.
* Reconstruction of an offline simulation.
* Schema migration testing.

### External application import

Potentially import data from a previous or alternative to-do application.

This may use:

* A one-off migration script.
* A permanent user-facing importer.
* Both, depending on repeat value.

## Native import requirements

* Validate export format and schema version before mutation.
* Preview the import.
* Identify incompatible or unknown fields.
* Preserve stable IDs where safe.
* Detect collisions.
* Support migrations from older export versions.
* Include soft-deleted records, Activity History and configuration.
* Never import authentication secrets.
* Create a safety export of current data before applying the import.
* Apply the import atomically where possible.
* Provide a clear recovery path if import fails.

## External import requirements

* Map external statuses, priorities, projects and Tags explicitly.
* Avoid silently discarding unsupported fields.
* Produce an import report.
* Detect probable duplicates.
* Keep provider-specific migration code separate from the core domain.

---

# 21. Trusted-device approval

## Goal

Allow a new device to require approval from an already trusted device before gaining access.

## Current fallback

New-device authentication may use:

* Username.
* Password or recovery secret.
* Current TOTP code.

This is acceptable if trusted-device approval is impractical in the selected free-tier backend.

## Intended future behaviour

* A new device submits an approval request.
* An already trusted device receives or discovers the request.
* The trusted device approves or rejects it.
* Approval is short-lived and bound to the requesting session.
* The new device completes authentication and becomes trusted.

## Requirements

* Approval must be server-authoritative.
* Client-only approval tokens are unacceptable.
* Requests must expire.
* Replays must fail.
* Approval must not replace TOTP or the recovery secret unless a later security review explicitly permits it.
* Security events must be logged.
* Notification email may alert the owner to new-device requests.

## Status

Conditional roadmap item. Implement only if the chosen backend supports it securely without disproportionate infrastructure.

---

# 22. Progressive Web App support

## Priority

Low priority and intentionally well below core workflow improvements.

## Goal

Allow ToDonut to be installed from the browser and launched with an app-like presentation.

## Intended capabilities

* Installable application manifest.
* ToDonut donut icon at appropriate sizes.
* Standalone display mode.
* Mobile home-screen installation.
* Desktop installation where supported.
* Appropriate theme and background colours.
* Update notification when a new frontend build is available.

## Explicit boundary

PWA support does not automatically imply offline Task editing.

Offline mode remains a separate architectural decision.

## Requirements

* GitHub Pages compatibility must be preserved.
* Authentication callbacks must continue to work.
* Cached assets must not trap the user on an obsolete incompatible schema.
* Service-worker updates must be handled safely.
* The app must not present stale cached production data as canonical.
* Any later offline mutation support requires a separate conflict and queue design.

---

# 23. Entity icon system revisit

## Goal

Reintroduce configurable entity icons only after the icon set, scope and display rules are strong enough for practical daily use.

## Current launch model

Stored icon fields remain in the data model for compatibility, but the launch UI does not show entity icons or expose icon pickers for Lists, Projects, Areas, Statuses or Priorities.

## Intended future capabilities

Future icon work should define:

* A better curated icon vocabulary for each supported record type.
* Where icons should appear, and where colour or text should remain the identity signal.
* Migration behaviour for existing stored icon values.
* Export/import compatibility for icon values.
* Accessibility rules so icons never become the only meaningful identifier.

## Open questions

* Whether each record type needs icons, or only selected surfaces benefit from them.
* Whether icons should be fixed semantic system markers or user-selectable identity markers.
* Whether custom icon sets are worth the maintenance cost compared with a tighter Lucide subset.

---

# Possible future ideas not currently committed

The following concepts have been discussed but are not presently confirmed roadmap requirements:

* A general dependency system between Tasks.
* Automatic workload planning.
* Time tracking.
* A dedicated focus or Pomodoro mode.
* Artificial intelligence features.
* Collaboration or shared Projects.
* Native mobile applications.
* Public registration.
* Attachments or image uploads.
* Rich-text or Markdown Task descriptions.
* Permanent deletion.
* Custom light themes.
* Fully custom keyboard shortcuts.
* A general-purpose API or webhooks.

These should not be implemented merely because adjacent architecture makes them possible. Each requires a fresh requirements decision.

---

# Suggested implementation sequencing

## Editable recurrence checklist templates

Allow a Recurrence Schedule template to define and edit checklist Items that are copied into each generated Task. This remains post-launch; launch-generated Tasks continue to use the current default open Status and no editable recurrence checklist-template UI is exposed.

This ordering is provisional and should be adjusted after real use of the launch application.

## Earlier candidates

1. Re-implement parent/child Task relationships to a high UI and domain standard, including creation, assignment, movement, hierarchy repair, and clear mobile/desktop interaction.
2. Revisit Must Do Today as a due-date-adjacent property with predictable interactions against future dates, schedules and Today ordering.
3. Inline Task-card status editing.
4. Full-text search.
5. Advanced filters and smart views.
6. Quick-add shorthand.
7. Task templates.
8. Aggregate-tree duplication.
9. Native JSON import.

## Workflow expansion

10. GTD Next Actions.
11. Weekly review.
12. Kanban board.
13. Expanded date model.

## Recurrence expansion

14. Advanced recurrence patterns.
15. Recurrence skipping.
16. Completion-relative recurrence.
17. Recurring Task trees.

## Structural expansion

18. Multi-Area Projects.
19. Nested Tag Groups.
20. Advanced Tag Group rules.
21. Advanced or derived status behaviour.

## Integrations and delivery

22. Reminders and notifications.
23. Calendar integration.
24. Trusted-device approval.

## Long-term platform work

25. Progressive Web App support.

---

# Roadmap completion standard

A roadmap item should not be marked complete until:

* Its requirements have been reconciled with the current application behaviour.
* Data-model and export-format changes have explicit migrations.
* GitHub Pages deployment remains functional.
* Production authentication and synchronisation remain secure.
* Soft-deletion and Activity History behaviour are defined.
* Mobile and desktop interactions are both usable.
* Optimistic frontend behaviour remains responsive.
* First-save-wins concurrency remains enforced.
* Focused tests cover the new high-risk rules.
* Documentation distinguishes implemented behaviour from remaining future work.
# Confirmed deferral: recurrence checklist templates

Editable recurrence checklist templates remain post-launch work. Launch Schedule templates do not copy, store or edit checklist items.
