# ToDonut Launch Design Specification

## 1. Document purpose

This document defines the intended launch-ready state of ToDonut.

## Launch Task hierarchy behaviour

Task checklists are leaf-only embedded content. Checklist edits remain local to the shared Task editor until Save Changes, persist with the Task record, are included in JSON export and Activity History, and never complete the Task automatically. Cancelling the editor discards checklist draft changes. Aggregate parents show checklist content as inactive; when a leaf with checklist content converts to aggregate, the active checklist is cleared from the parent and the prior values are preserved in the aggregate conversion Activity Event.

Leaf Tasks are actionable records with Status, Priority, Due Date, Reveal On, Must Do Today, Tags, description and checklist. Aggregate Tasks are structural parents marked by the persisted aggregate flag. Once converted, an aggregate remains aggregate even if it later has no children; it keeps title and placement editable but does not reactivate leaf-only fields or automatically convert back to a leaf.

Child Task creation uses the shared contextual Add registry and shared Task editor. Child Task appears only for one concrete open Task in a writable context. The child inherits the parent location, can be title-only, and assigning the first child converts a leaf parent to aggregate in the same domain command. Meaningful prior leaf values are recorded in Activity History as inactive conversion data.

Task hierarchy presentation uses one recursive hierarchy component over the shared Task row. Roots render at the top level and children render beneath their parent, so descendants are not duplicated as independent roots inside the same hierarchy. Aggregate rows show aggregate state and descendant progress; leaf rows show leaf workflow fields and compact checklist progress in Detailed presentation.

Aggregate progress is derived, not stored. It counts every non-aggregate actionable descendant once at any depth, excludes aggregate parents, reports open, Completed, Cancelled and total Closed counts, and displays `No actionable Tasks` when no actionable descendants exist.

When all actionable descendants of an open aggregate are Closed, satisfied aggregate ancestors close automatically through the shared aggregate closure helper. Reopening a descendant reopens required Closed aggregate ancestors. Aggregate tree reopening is a cascade command that reopens Closed descendants and required ancestors through one domain operation.

Moving or deleting an aggregate Task applies to the full subtree. Task subtree soft deletion marks the root and descendants deleted together, records one subtree Activity Event, and Trash presents deleted subtrees from their deleted root instead of listing every descendant as an unrelated restore root. Restoring a deleted Task root restores its deleted descendants in one command.

Confirmed Task editor saves that include checklist changes create one logical save operation. Draft checklist edits are not canonical, cancelling the editor discards them, and failed saves leave the canonical Task unchanged. Checklist Activity History records meaningful item-level additions, removals, text edits, checked-state changes and reorders with stable item IDs and safe old/new values. Undo for a saved checklist edit restores the complete pre-save Task and checklist state only when the affected records have not changed incompatibly since the save.

Aggregate rows expose structural actions rather than leaf-only controls. Open aggregate Tasks use Complete Tree, Closed aggregate Tasks use Reopen Tree, and aggregate editors keep title and placement editable while suppressing Priority, Due Date, checklist and ordinary Status editing. Completing a tree marks open actionable descendants Completed, preserves already Completed and Cancelled descendants as distinct Closed states, closes nested and satisfied ancestor aggregates, records concise Activity History and registers one undoable operation. Reopening a tree assigns the configured default open Status to Closed actionable descendants, reopens nested and required ancestor aggregates, preserves all other leaf fields and is blocked while the containing Project is completed or archived.

Reopening one Closed child Task reopens only that child and every required aggregate ancestor. Closed siblings remain Closed. The operation uses the configured default open Status, preserves the Task's other fields and records the user action plus derived ancestor reopen events.

Parent assignment, Parent clearing and Move share the same subtree movement rules. A valid Parent is active, non-deleted, not Closed, not the moved Task, not a descendant, not inside an archived or completed Project, and compatible with the destination location. Selecting a leaf Parent first uses the established aggregate conversion command and preserves prior leaf values in Activity History. Clearing Parent makes the selected Task or subtree a root in its current Project, Area, Inbox or Someday location without splitting descendants.

Moving any Task with descendants moves the complete subtree. Moving to a Project root applies that Project to every descendant and clears incompatible Area or special-location state; moving to an Area root applies the Area to every descendant and clears Project state; moving to Inbox or Someday clears incompatible container state; moving under a Parent inherits that Parent's location. Cycles and movement beneath a descendant are rejected. After movement, aggregate and leaf identity is preserved, old and new ancestor progress updates, satisfied old ancestors may close, and Closed new ancestors reopen when an open subtree is moved beneath them. Empty aggregate parents remain aggregates.

Manual ordering is sibling-only. Root Project Tasks, root Area Tasks, Inbox roots, Someday roots and children sharing one Parent may be moved up or down. Reordering never changes Parent, Project, Area or special location and never interprets horizontal dragging as reparenting.

Hierarchy Undo is operation based. Each confirmed checklist save, cascade, child reopen, Parent change, Parent clear, movement, subtree movement and supported sibling reorder registers one temporary receipt containing only the pre-operation fields needed to reverse the change. Undo validates current versions or operation lineage before restoring prior Task state, locations, Statuses, aggregate closure state, checklist state and order. Unsafe Undo refuses to partially overwrite newer deliberate changes and records successful Undo as a new immutable Activity Event.

It is the shared product reference for:

* the product owner;
* Codex implementation work;
* feature audits;
* testing;
* launch-readiness decisions;
* future maintenance.

This document defines what ToDonut should do at launch. It does not describe how much of that behaviour is currently implemented.

Current implementation status belongs in `FEATURE_AUDIT.md`.

Deferred features and post-launch ideas belong in `ROADMAP.md`.

Visual design details belong in `STYLE.md`.

Technical deployment and infrastructure details may be expanded in architecture documents, but those documents must not contradict the product behaviour defined here.

## 2. Document authority

When documents conflict, use this precedence:

1. `DESIGN.md`

   * Authoritative launch behaviour and product requirements.
2. `STYLE.md`

   * Authoritative visual and interaction design rules.
3. Current focused implementation prompt

   * May clarify or amend a limited part of the design.
4. `FEATURE_AUDIT.md`

   * Describes current implementation status, not intended behaviour.
5. Architecture documentation

   * Describes implementation choices.
6. `ROADMAP.md`

   * Describes explicitly deferred features.
7. `README.md`

   * Provides setup and project orientation only.

Any future prompt that intentionally changes a launch requirement should also update this document.

Codex should read this document before implementing or materially changing a feature.

---

# 3. Product definition

## 3.1 Product name

The application is called **ToDonut**.

The name may be considered a working title, but it is expected to remain the launch name unless a substantial issue emerges.

The product identity uses a restrained donut motif, primarily through:

* the application name;
* page and application icons;
* progress-ring imagery;
* brief completion feedback;
* occasional playful completion effects.

Normal productivity terminology should remain conventional.

ToDonut should not rename ordinary concepts using excessive donut-themed language.

## 3.2 Intended user

ToDonut is designed for one primary user.

It is not intended to support:

* public registration;
* multiple independent accounts;
* team collaboration;
* shared Projects;
* comments between users;
* role-based permissions;
* public content.

The architecture may internally use a user identifier, but the visible product is owner-only.

## 3.3 Product objective

ToDonut should replace the user’s existing to-do application for normal daily use.

Launch means:

* dependable enough for ordinary daily use;
* accessible from desktop and mobile;
* persistent across devices;
* secure enough for private personal information;
* capable of recovering from ordinary connection and synchronisation failures;
* complete across the defined launch workflows;
* not merely a technical demonstration.

## 3.4 Product philosophy

ToDonut should:

* prioritise frontend responsiveness;
* remain flexible rather than enforcing one productivity method;
* begin with a useful Getting Things Done-compatible configuration;
* support Tasks, Projects, Areas and Reference Lists as distinct concepts;
* use clear, conventional terminology;
* preserve user data rather than deleting it permanently;
* make hidden, deferred, failed and closed states understandable;
* favour deliberate interaction design over feature quantity;
* remain visually minimal and consistent;
* avoid unnecessary complexity in ordinary use.

## 3.5 Launch scope philosophy

The launch version may contain broad functionality, but each included feature should be usable through a complete workflow.

A feature should not be treated as launch-complete merely because:

* a database table exists;
* a type exists;
* a placeholder interface exists;
* one part of the workflow works;
* a button is visible;
* a test fixture demonstrates the underlying function.

---

# 4. Platform and deployment

## 4.1 Frontend platform

The launch frontend uses:

* Vite;
* React;
* TypeScript;
* static HTML, JavaScript and CSS output;
* Lucide icons;
* a custom tokenised CSS design system.

The production frontend is hosted on GitHub Pages.

The application must remain compatible with a GitHub Pages project-site base path.

It must not require a conventional frontend application server.

## 4.2 Backend platform

The production backend uses Supabase for:

* authentication;
* PostgreSQL persistence;
* Row Level Security;
* server-authoritative mutations;
* realtime or equivalent multi-device updates;
* recurrence processing;
* migrations;
* protected backend functions where required.

The frontend may communicate directly with Supabase using browser-safe credentials only where Row Level Security and backend constraints make that safe.

Privileged credentials must never be embedded in the frontend.

## 4.3 Local development

Local development may use:

* the Vite development server;
* the hosted Supabase project;
* a clearly identified development-only local persistence adapter where needed.

Local development storage is not production offline support.

A configured production build must never silently fall back to `localStorage`.

## 4.4 Offline and PWA boundary

Launch does not include:

* Progressive Web App installation;
* a service worker;
* offline editing;
* offline mutation queues;
* guaranteed operation without a network connection.

The application should handle temporary disconnection gracefully, but the backend remains canonical.

---

# 5. Authentication and access

## 5.1 Owner-only access

All production application data requires an authenticated owner session.

Unauthenticated users must not be able to:

* read application records;
* create records;
* modify records;
* inspect private diagnostic data;
* export application data.

## 5.2 Managed authentication

Authentication should use Supabase Auth and established authentication standards.

The application must not implement custom cryptographic algorithms.

The intended secure flow is:

1. A conventional first authentication factor.
2. TOTP verification using an authenticator application such as Google Authenticator.
3. A persistent trusted session on the device.

The visible account may have an editable username, but the secure backend identity may still use an email address or another Supabase-supported identifier.

## 5.3 Trusted-device behaviour

After successful authentication, a device should remain signed in until one of the following occurs:

* the user signs out;
* the session is revoked;
* a security event invalidates the session;
* the backend requires reauthentication;
* authentication configuration materially changes.

The launch interface does not require a trusted-device management screen.

## 5.4 New-device access

A new or untrusted device should require:

* the primary authentication factor;
* a current TOTP code;
* any additional secure recovery factor required by the selected Supabase flow.

Approval from an already trusted device is not required at launch unless it can be implemented securely without disproportionate complexity.

## 5.5 Recovery

Launch authentication should support recovery codes or an equivalent secure recovery mechanism.

Recovery material must:

* be generated securely;
* never be stored as readable plaintext;
* never be included in JSON exports;
* never be logged;
* never be exposed in diagnostics.

## 5.6 Failed attempts and lockout

Repeated failed sign-in attempts should trigger a temporary server-authoritative lockout.

The lockout should:

* use a sensible threshold;
* expire after a configured period;
* avoid revealing whether a username exists;
* create a security event;
* send a notification email where the configured service supports it.

User-facing messages should remain brief, with technical details available only where safe.

---

# 6. Canonical data and synchronisation

## 6.1 Canonical data source

Supabase is the canonical production data source.

The frontend must not treat browser storage as canonical production data.

## 6.2 Initial loading

On launch:

1. Restore or establish the authentication session.
2. Load a coherent snapshot of current data.
3. Show a clear loading or synchronising state.
4. Populate the application once the initial state is coherent.
5. Begin ongoing synchronisation.

The application should not briefly present unrelated stale local data as if it were current production data.

## 6.3 Frontend-first interaction

Normal changes should feel immediate.

For ordinary mutations:

1. Apply the change to frontend state.
2. Mark the record or operation as pending.
3. Submit the change to Supabase.
4. Clear the pending state when confirmed.
5. Retry appropriate transient failures.
6. Preserve a visible failed state when retries are exhausted.

The user should not have to wait for the backend before a successfully initiated interaction appears to occur.

## 6.4 Failed mutations

Failed optimistic changes should remain visible until the user resolves them.

Available resolution actions may include:

* Retry;
* Discard local change;
* Reload authoritative record.

Failed changes must never disappear silently.

## 6.5 Multi-device synchronisation

Changes made on one active device should become visible on another active device without requiring a manual refresh.

The application should:

* receive remote updates;
* avoid applying a local mutation twice;
* reconnect after temporary network failure;
* refresh authoritative state after reconnect where necessary;
* display connection or synchronisation problems.

There is no manual `Synchronise now` action at launch.

## 6.6 First-save-wins concurrency

Every mutable record must have a version or equivalent revision.

An update must state the version originally read.

The backend must atomically:

1. Confirm that the submitted version is still current.
2. Apply the mutation.
3. Increment the version.

If the record has already changed:

* reject the stale write;
* preserve the newer server record;
* keep the rejected optimistic change visibly failed;
* inform the user that a newer update exists;
* allow the authoritative record to be reloaded.

The launch version does not require a side-by-side conflict comparison or merge editor.

---

# 7. Global information architecture

## 7.1 Primary launch destinations

The launch application contains these principal destinations:

* Today;
* Inbox;
* Tasks;
* Lists;
* Projects;
* Areas;
* Upcoming;
* Overdue;
* Someday;
* Trash;
* Settings.

Areas are a top-level destination distinct from Projects.

## 7.2 Initial destination

The application opens to Today.

On mobile, the visible page title must read `Today`, with Today content immediately beneath it.

## 7.3 Route behaviour

Important destinations should have stable internal routes or equivalent state that supports:

* browser Back and Forward;
* refreshing an open page;
* reopening a specific List where practical;
* returning from List detail to the List browser;
* GitHub Pages-compatible deployment.

List, Project and Area detail routes provide an on-screen Back icon immediately left of the active entity name. Back unwinds the actual in-app access path, including nested Area to Project to List navigation. A directly loaded detail route without an in-app predecessor falls back to the corresponding entity landing screen.

Every Settings subsection route shows the same application-top-bar Back icon immediately left of the Settings title. It returns directly to Settings home, including from Statuses, Priorities, Tags, Tag Groups, Quantifiers, Schedule and Diagnostics.

The routing strategy must not require server-side rewrites unavailable on GitHub Pages.

---

# 8. Mobile navigation

## 8.1 Mobile bottom dock

Mobile uses a fixed bottom dock with two pages.

### Primary dock page

From left to right:

1. Today
2. Inbox
3. Tasks
4. Lists
5. Projects

### Secondary dock page

From left to right:

1. Areas
2. Upcoming
3. Overdue
4. Someday
5. Trash
6. Settings

## 8.2 Dock swiping

The user may swipe horizontally across the dock to switch between the primary and secondary pages.

Requirements:

* a horizontal swipe changes the visible dock page;
* swiping again returns to the other page;
* changing the dock page does not change the current destination;
* mostly vertical gestures do not change the dock page;
* taps must not be misread as swipes;
* the animation should follow the swipe direction;
* reduced-motion settings must be respected.

A fresh mobile load begins on the primary dock page.

## 8.3 Dock selection state

The selected destination remains selected even when its dock page is not currently visible.

When the relevant dock page is shown again, the selected item must display correctly.

## 8.4 Mobile content spacing

Scrollable content must include sufficient bottom space so that:

* the dock does not cover the final rows;
* the floating Add button does not cover important content;
* device safe-area insets are respected.

---

# 9. Desktop navigation

Desktop should provide direct access to all launch destinations through a persistent or readily available navigation layout.

Desktop navigation should include:

* Today;
* Upcoming;
* Inbox;
* Tasks;
* Lists;
* Projects and Areas;
* Overdue;
* Someday;
* Trash;
* Settings;
* desktop Export access.

The desktop interface should use available whitespace deliberately rather than stretching a dense mobile layout across the viewport. At viewport widths of `2000px` or more, the complete interface starts at a `1.3` presentation scale so ultra-wide displays do not leave the active UI disproportionately small. Below `2000px`, the interface returns to its ordinary `1` scale. This application default must compound with, and never disable or reset, user-controlled browser zoom.

---

# 10. Contextual Add system

## 10.1 Persistent Add button

The previous persistent top-of-page quick-add form is not part of the launch interface.

A circular floating Add button appears at the lower right of the main content area.

The button:

* uses a Lucide plus icon;
* sits above the mobile dock;
* respects safe-area insets;
* remains visible across normal application screens;
* does not cover important content;
* has an accessible name.

## 10.2 Shared contextual Add architecture

The Add menu is resolved through one application-level contextual Add registry.

Individual screens do not construct their own FAB action arrays.

The registry defines:

* a stable action ID;
* label and accessible name;
* Lucide icon;
* persistent or contextual group;
* deterministic order;
* active-context availability predicate;
* capability requirement;
* invocation target;
* optional context payload and creation defaults.

The active Add context contains only relevant current state, such as destination, open List ID, open Area ID, open Project ID, active parent Task ID, active Settings subsection, blocking overlay state and supported creation capabilities.

The root FAB host obtains the context, resolves persistent actions, appends available contextual actions, sorts by the defined order and renders the final array directly in visual top-to-bottom order.

The implementation must not rely on reversed CSS rendering to correct action order.

## 10.3 Permanent actions

Project, List and Task are permanent creation actions on every authenticated ordinary application screen unless the entire FAB is intentionally hidden.

The menu expands upward and the permanent actions appear visually from top to bottom as:

```text
Project
List
Task
FAB
```

Task is the permanent action closest to the FAB.

Each permanent action opens the established creation flow:

* Project opens the minimum viable Project creation modal;
* List opens the minimum viable Reference List creation modal;
* Task opens the shared Task editor in Create mode.

Do not create parallel creation implementations.

## 10.4 Contextual action placement

Contextual actions are appended after the permanent actions, placing them closer to the FAB than Task.

For one contextual action:

```text
Project
List
Task
Status
FAB
```

For two contextual actions, the more structural action appears above the more direct or frequently used action.

For example:

```text
Project
List
Task
Tag Group
Tag
FAB
```

Contextual actions appear only when the context is active, the creation flow exists and the user can complete it. No disabled placeholders, dead actions or "not implemented" actions are shown.

## 10.5 Launch contextual-action map

No contextual action is shown on Today, Inbox, Tasks, Upcoming, Overdue, Someday, Lists browser, an open Area, an open Project with no specific Task selected, Trash, Settings home, Diagnostics or Activity History.

Permanent actions apply safe context defaults where defined. A Task created from Someday defaults to Someday. A Task, List or Project created from an Area defaults to that Area. A Task or List created from an open Project defaults to that Project. Do not add redundant contextual variants when a permanent action can apply the context safely.

Open Reference List injects:

```text
Project
List
Task
List Item
FAB
```

List Item targets the currently open List.

The Areas destination injects an Area contextual action when no concrete Area detail is open.

Active Task context injects:

```text
Project
List
Task
Child Task
FAB
```

Child Task appears only when exactly one concrete valid parent Task is active, such as a Task detail or hierarchy screen, or a Project screen where one specific Task is selected. It must not appear merely because a Project is open. It opens the shared Task editor in Create mode, preselects the active Task as Parent, inherits the parent's Project or loose location, allows title-only creation and preserves normal parent validation and aggregate-conversion rules.

Open Project alone injects no contextual action. The permanent Task action creates a root Task in that Project. There is no Project Section action.

Recurrence management intends:

```text
Project
List
Task
Schedule
FAB
```

Schedule remains hidden unless recurrence management is accessible and a functioning Schedule creation flow exists.

Status settings injects:

```text
Project
List
Task
Status
FAB
```

The Status action opens the Status creation modal.

If Tags and Tag Groups use one combined Settings screen, the intended actions are:

```text
Project
List
Task
Tag Group
Tag
FAB
```

If they use separate Settings screens, Tag settings injects Tag only and Tag Group settings injects Tag Group only. These actions remain hidden until complete corresponding creation flows exist.

## 10.6 Hidden FAB contexts

Hide the complete FAB while any blocking interaction is active, including:

* authentication gate;
* modal;
* confirmation dialog;
* hierarchical chooser;
* overlay date picker where FAB interaction would conflict;
* other blocking full-screen overlays.

When hidden, the FAB is not keyboard-focusable and is absent from the accessibility tree.

## 10.7 Add menu behaviour

The shared FAB system centrally handles:

* closing after selecting an action;
* closing on outside click or tap;
* closing on Escape;
* closing on destination change;
* recalculating actions when context changes;
* removing stale contextual actions when leaving a screen;
* hiding while blocking overlays are active;
* restoring focus to the FAB after a creation modal closes where appropriate;
* reduced-motion behaviour;
* safe-area positioning.

Do not implement screen-specific cleanup timers or effects.

## 10.8 Context defaults

### Task creation

When opened from:

* a Project, default to that Project;
* an Area, default to that Area;
* Inbox, default to Inbox;
* Someday, default to Someday;
* a List, do not attach the Task to the List.

### List creation

When opened from:

* a Project, default to that Project;
* an Area, default to that Area;
* Lists, default to a loose List;
* another List, default to the current List’s containing Project, Area or loose location.

Lists do not nest inside Lists.

### Project creation

When opened from an Area, default to that Area.

Otherwise create an unassigned Project.

### List Item creation

List Item creation is available only while one List is open and always targets that List.

---

# 11. Creation modals

## 11.1 General behaviour

Creation uses tidy, focused modals.

Each modal should:

* initially show only minimum required fields;
* offer `More options` for nonessential fields;
* autofocus the primary field where appropriate;
* prevent invalid submission;
* prevent duplicate submission;
* close after successful optimistic creation;
* preserve failed optimistic creation visibly;
* restore focus sensibly after closing.

## 11.2 Task creation

Task creation and Task editing use one shared Task editor modal.

The modal uses local draft state while open. It does not write canonical Task changes when the user changes tabs, opens or closes Details, edits checklist draft rows, selects a date or navigates the Parent chooser.

The modal submits through explicit actions only:

* Create mode uses `Create Task`;
* Edit mode uses `Save Changes`;
* a successful confirmed mutation closes the modal;
* a failed mutation keeps the modal and draft values available.

When first opened, the editor shows only:

* Task title;
* collapsed `Details`;
* Create or Save actions.

The Task title is the only mandatory Task field. A title-only Task:

* lands in Inbox;
* uses the default New or active Status;
* uses the default Priority;
* has no Due Date;
* has no Reveal On date;
* has no Tags;
* has no description;
* has no checklist items;
* has no parent.

Expanding Details reveals exactly four tabs:

1. Basics.
2. More.
3. Dates.
4. Checklist.

Details may be collapsed and reopened without discarding any draft values. Basics is selected on first expansion, and the selected tab is preserved during the same editor session. Only the selected tab content is presented.

Basics contains Status, Priority, Tags and Description. Status and Priority share one row where width permits and are populated from current non-deleted configured records. Tags use the established compact Tag component; the `Add tag` button remains first in the wrapping row, only Task-scoped Tags may be selected and mutually exclusive Tag Groups are enforced. Description is optional plain multiline text, not Markdown or rich text.

More contains Project and Parent only. Project includes Inbox plus current non-deleted Projects. Parent selection uses a hierarchical chooser with Projects and Loose branches. Parent selection must reject deleted Tasks, the Task itself, descendants of the edited Task, cycles, incompatible locations and closed Tasks where active-parent rules do not allow them. Selecting a Parent aligns the child location to the parent Project or loose location. Changing Project after selecting an incompatible Parent clears Parent and explains the change inline. Selecting a leaf Task as Parent converts that Task into an aggregate parent through the domain command and adds the child in the same logical mutation.

Dates contains Due Date and Reveal On. Due Date is the launch user-facing name for the existing single scheduled-date field; the persisted/internal field may remain `scheduledDate` for compatibility. Reveal On defers the Task from ordinary active views until that date, while still allowing access from deliberate container or hierarchy browsing. Both fields are optional and blank by default. Manual entry accepts `D/M/YY`, `DD/MM/YY`, `D/M/YYYY` and `DD/MM/YYYY` in Australian order, with two-digit years interpreted in the 2000s. Invalid calendar dates are rejected. Past Due Dates are allowed with a warning; past Reveal On dates are allowed.

Both date fields use the same date-only picker. The picker shows seven Monday-first columns and nine rows, beginning on Monday of the current Australia/Sydney local week. It identifies a subtle monochrome middle-month underlay from the central portion of the 63-day window, provides previous, next and Today controls, and distinguishes selected date, today, focus, hover and out-of-month states without relying only on colour.

The date picker remains wholly inside the visible viewport. It prefers below the trigger, flips above when needed, then clamps both axes to a small viewport margin; if viewport height is constrained, the overlay scrolls internally instead of clipping outside the screen.

Checklist contains embedded checklist items, not child Tasks. Each item has a stable ID, text, checked state, manual order, created timestamp and updated timestamp. Checklist items do not have Status, Priority, Tags, description, dates, recurrence or children. Rows show reorder handle, checkbox, item text, Move Up and Move Down chevron buttons, Edit and Delete actions. Checking an item is reversible, mutes and strikes through the text, and never completes the parent Task automatically. Reordering supports drag and explicit chevron alternatives. Checklist data is included in JSON export as embedded Task content.

Editing an aggregate parent preserves its title and hierarchy role. Leaf-only workflow values remain inactive and are not reactivated merely by saving the aggregate parent.

## 11.3 List creation

Collapsed fields:

* required title.

Expanded fields may include:

* location;
* List-level Tags.

Lists do not require descriptions.

A List's configured colour applies to the List title in List browsing and detail headings. It does not cascade to List Items. Related entity context retains prefixes such as `Area:` and `Project:`; only the related title uses that entity's colour. When several parents apply, they appear on one comma-separated line ordered from Area to Project and then to any future lower parent level. Indirect hierarchy is included, so a Project-linked List or Task shows the Project's Area before the Project.

The first blank List Appearance swatch explicitly unassigns the List colour when saved. It is distinct from omitting the colour field during an internal partial update, which preserves the current value.

Schedule create and edit Task tabs expose a blank-default Area selector to the left of Destination. Destination defaults to Inbox and contains current Projects; choosing Area or Destination sets the Schedule template's single canonical Task location, matching ordinary Task placement. Priority follows beneath the placement row. Selectable Area and Project names use their configured colours. Due-on-occurrence uses a circular Lucide checkbox presentation. Desktop Trash shows Areas, Projects, Tasks and Lists together in one compact row with tabs approximately half their former width.

All checkbox-driven interactions, including dropdown menu options, render Lucide `Circle` when unchecked and `CircleCheck` when checked. A checked option associated with a coloured entity uses that entity colour; otherwise the checked icon is mint. Native checkbox artwork is not presented.

Energy and Context are configurable first-class Quantifier dimensions shared by Tasks, Projects, Lists and recurring Task templates. Energy begins with Relaxed, Low Energy, Medium Energy, High Energy and It's a Whole Thing. Context begins with Home, Work, Outing, Mental, Digital and Relationship. Settings provides one Quantifiers entry where each dimension can be renamed and its arbitrary-length option list can be added to, renamed, removed and reordered. Persist assignments by stable dimension and option IDs so renames are non-destructive. During migration, matching Energy and Context Tag Group assignments are copied without deleting legacy tags. A selected option with configured Lucide icons places its ordered icon sequence immediately after the associated Project, Task or List name; further configured Quantifiers follow in definition order. Selected options without configured icons remain in entity metadata after Area and Project context using the semantic dimension icon and option name.

When a List or another creation editor requests a Project, it uses a text combobox with filtered Project suggestions. Clicking a suggestion stores that Project relationship. Typing a unique exact Project title, ignoring case and surrounding whitespace, stores the same Project ID relationship even when the suggestion is not clicked; display text alone is never persisted as a substitute for the relationship.

## 11.4 Project creation

Collapsed fields:

* required title.

Expanded fields may include:

* Area;
* description;
* icon;
* Tags.

The stored Project colour field and existing values remain compatibility data for possible restoration, but Project create/edit does not expose a colour control and Project browser rows do not display a per-Project colour accent.

## 11.5 List Item creation

Fields:

* required text;
* optional link.

List Item creation does not include hidden advanced fields.

---

# 12. Core entity model

The launch domain includes:

* Area;
* Project;
* Task;
* Reference List;
* Reference List Item;
* Status;
* Priority;
* Tag;
* Tag Group;
* Activity Event;
* Recurrence Rule;
* Recurrence Generation Record;
* View Preference;
* Application Setting.

Every mutable entity should have, where applicable:

* stable ID;
* created timestamp;
* updated timestamp;
* version;
* soft-deletion metadata;
* archive or closure metadata;
* owner association at the backend.

---

# 13. Areas

## 13.1 Purpose

Areas represent broad ongoing domains of responsibility.

Examples may include:

* Home;
* Work;
* Health;
* Administration.

## 13.2 Area contents

An Area may contain:

* Projects;
* standalone Tasks;
* Reference Lists.

## 13.3 Area relationships

A Project may belong to:

* no Area;
* one Area.

Multi-Area Project membership is roadmap-only.

A standalone Task may belong directly to one Area.

A Reference List may belong directly to one Area.

## 13.4 Area access

Areas must be visible and manageable through the Projects or organisational interface.

They must not exist only in the data model.

## 13.5 Area lifecycle

Areas support:

* creation;
* editing;
* manual ordering where applicable;
* optional visual identity;
* archiving if supported by the current container model;
* soft deletion;
* restoration.

Deleting an Area must not permanently delete its contents.

Any movement or reassignment of contained records must be explicit and safe.

---

# 14. Projects

## 14.1 Purpose

Projects represent completable outcomes containing actionable Tasks and optional Reference Lists.

## 14.2 Project fields

A Project supports:

* one current globally configured Status, defaulting to the configured default open Status;
* one Status icon and colour inherited from that Status for Project-list display;
* required title;
* optional description;
* optional Area;
* colour;
* icon;
* Tags;
* ordered Tasks;
* contained Reference Lists;
* completion state;
* archive state;
* timestamps;
* version;
* soft-deletion metadata.

## 14.3 Project membership

A Task may belong to at most one Project.

A Project may contain:

* ordinary Tasks;
* aggregate Task trees;
* Reference Lists.

## 14.4 Project completion

When the user attempts to complete a Project containing open actionable Tasks:

* show a warning;
* clearly state that proceeding will close remaining descendants;
* offer Proceed or Cancel;
* on Proceed, complete remaining actionable descendants;
* record Activity Events;
* provide Undo where practical.

## 14.5 Project progress

Project progress must count every actionable descendant at every Task depth.

Aggregate parents must not be double-counted.

Progress should distinguish:

* open descendants;
* Completed descendants;
* Cancelled descendants;
* total actionable descendants.

## 14.6 Project archive

Archiving a Project:

* removes it from ordinary active Project views;
* retains its contents;
* does not move it to Trash;
* remains reversible.

## 14.7 Project deletion

Project deletion is always soft deletion.

Deleted Projects appear in Trash and can be restored.

No normal deletion interface may permanently delete a Project. Confirmed cross-kind conversion is the deliberate exception because a complete replacement Task is committed in the same atomic snapshot.

## 14.8 Task and Project conversion

Every Task card offers Promote to Project with Lucide `panel-top-close`; every current Project offers Demote to Task with `panel-bottom-close` beside Edit. Each action opens a confirmation modal before committing.

Conversion creates a new record of the target kind, copies compatible title, description, Area, Status, Tags and Quantifiers, transfers compatible hierarchy and rewrites dependent List or Schedule destinations, then purges the source record only after the replacement snapshot is complete. Promoting an aggregate Task moves its direct children to the new Project root. Demoting a Project creates an aggregate Task when the Project has root Tasks and keeps those Tasks as its children. Information without a target field must use an explicit readable preservation path rather than disappearing silently.

---

# 15. Tasks

## 15.1 Task purpose

A Task represents an actionable item that may be completed or cancelled.

## 15.2 Required field

Every Task requires a title.

Task titles may span more than one visual line when necessary.

## 15.3 Task fields

An actionable Task may support:

* title;
* description;
* status;
* priority;
* scheduled date;
* reveal date;
* Must Do Today;
* one Project or one standalone location;
* one Area when standalone;
* Tags;
* optional checklist;
* parent Task relationship;
* ordered child Tasks;
* Activity History;
* completion timestamp;
* cancellation timestamp;
* timestamps;
* version;
* soft-deletion metadata.

## 15.4 Description

Descriptions support:

* plain multiline text;
* clickable web links.

Launch does not require:

* file attachments;
* pasted images;
* rich text;
* Markdown rendering.

## 15.5 Task locations

A Task may be located in:

* Inbox;
* Someday;
* one Project;
* one Area as a standalone Task.

A Task must not belong to multiple Projects.

A Task should not exist in an unrecognised invisible location.

## 15.6 Task lifecycle

An actionable Task may be:

* New;
* In Progress;
* Waiting;
* Blocked;
* Completed;
* Cancelled;
* another user-configured global status.

Completed and Cancelled belong to the broader Closed category.

## 15.7 Reopening Tasks

A Closed Task may be reopened.

Reopening should:

* assign the configured open status, normally New;
* clear or appropriately preserve closure timestamps;
* record an Activity Event;
* reopen any Closed aggregate ancestors required to make the Task active.

---

# 16. Checklists

A Task may contain a lightweight checklist.

Checklist items contain only:

* text;
* completion state;
* manual order.

Checklist items are not Tasks.

They do not have:

* status;
* priority;
* dates;
* Tags;
* descriptions;
* recurrence;
* independent appearance in views.

Completing all checklist items does not automatically complete the Task unless explicitly added as a later rule.

---

# 17. Subtasks and aggregate parents

## 17.1 Aggregate conversion

When an ordinary Task receives its first child:

* it becomes an aggregate parent;
* only its title remains active as ordinary Task content;
* its children become the actionable items;
* former workflow values become inactive;
* former values are preserved in Activity History.

Inactive former values include, where present:

* description;
* status;
* priority;
* scheduled date;
* reveal date;
* Must Do Today;
* Tags;
* checklist content.

## 17.2 Nesting

Task nesting is unlimited in the domain model.

Every child may itself become an aggregate parent.

The interface must remain usable for practical nesting depths.

## 17.3 Actionable descendants

Only leaf Tasks are actionable.

Aggregate parents:

* do not independently appear as scheduled actionable Tasks;
* do not carry ordinary Task priority or scheduling;
* summarise their descendants.

## 17.4 Aggregate progress

An aggregate should display:

* total actionable descendants;
* open count;
* Completed count;
* Cancelled count;
* completion percentage.

Every actionable descendant at every depth is counted once.

## 17.5 Automatic aggregate closure

When every actionable descendant becomes Closed:

* the aggregate parent automatically becomes Closed;
* if all descendants are Completed, the parent closes as Completed;
* if one or more descendants are Cancelled, the parent remains Closed and displays the Completed and Cancelled breakdown;
* closure creates an Activity Event.

Closed ancestors should continue to update consistently as descendant states change.

## 17.6 Closing an aggregate manually

When the user attempts to close an aggregate with open descendants:

* warn that all open descendants will close;
* offer Proceed or Cancel;
* do not offer a mode that closes only the parent;
* on Proceed, close the full descendant tree;
* record Activity Events;
* support Undo.

## 17.7 Reopening an aggregate

When reopening a Closed aggregate parent:

* warn that all Closed actionable descendants will reopen;
* offer Proceed or Cancel;
* on Proceed, reopen the descendants;
* record Activity Events;
* support Undo.

## 17.8 Reopening a child

When reopening a child beneath Closed aggregate ancestors:

* automatically reopen every required Closed ancestor;
* record derived Activity Events;
* do not leave an active child hidden beneath a Closed parent.

## 17.9 Moving aggregate trees

Moving an aggregate parent moves its entire descendant tree.

The operation must:

* validate the destination;
* preserve hierarchy;
* update optimistically;
* apply as one logical operation;
* avoid partial movement.

Aggregate-tree duplication is roadmap-only.

---

# 18. Dates and scheduling

## 18.1 Date-only model

Launch dates do not have times.

The user’s local date format is Australian.

The week begins on Monday.

## 18.2 Scheduled date

A scheduled date means:

> The date on which the user intends to act on the Task.

It is not a separate deadline.

## 18.3 Reveal date

A reveal date means:

> Do not ordinarily surface this Task before this date.

A Task with a future reveal date is deferred.

## 18.4 Deferred visibility

Deferred Tasks:

* do not clutter ordinary active views before the reveal date;
* remain visible when their containing Project or Area is deliberately opened;
* appear in a distinct Deferred section where relevant;
* become ordinarily eligible when the reveal date arrives.

## 18.5 Overdue behaviour

A Task becomes overdue when:

* it is not Closed;
* its scheduled date is before the current local date.

Overdue Tasks retain their original date.

They do not automatically move to Today.

## 18.6 Date actions

The interface should support:

* date picker selection;
* direct date entry where practical;
* move to Tomorrow;
* move to Next Week;
* move to Next Month;
* postponement;
* date-change Activity History.

Assigning a past date may produce a warning but remains permitted.

## 18.7 Public holidays

The intended default public-holiday calendar is the Australian Capital Territory.

Public holidays should be visually identifiable where the date interface displays calendar context.

Holiday display must not modify Task dates automatically.

## 18.8 Excluded date behaviour

Launch does not include:

* exact Task times;
* date ranges;
* a separate due deadline;
* morning, afternoon or evening buckets;
* flexible `this week` dates;
* duration estimates.

---

# 19. Statuses

## 19.1 Global statuses

Statuses are global.

Projects and Lists do not define separate status sets.

## 19.2 Initial statuses

The launch configuration should include at least:

* New;
* In Progress;
* Waiting;
* Blocked;
* Completed;
* Cancelled.

New is the default status for a newly created Task unless context specifies otherwise.

## 19.3 One status per Task

A Task has one current status.

Waiting and Blocked are statuses, not independent flags.

## 19.4 Closed category

Completed and Cancelled are both Closed.

Relevant views use one combined `Show Closed` control.

There are not separate Completed and Cancelled visibility toggles at launch.

## 19.5 Status configuration

Statuses are managed from a `Statuses` screen under Settings.

The screen displays all non-deleted Statuses, current ordering, visual identity, open or Closed classification, default Status indication, Edit and Delete actions.

The screen does not contain a duplicate Add Status button. New Status creation is initiated through the contextual FAB Status action.

The user may configure:

* status name;
* colour;
* Lucide icon;
* open or Closed classification;
* Closed semantic type where applicable;
* ordering;
* default Status selection.

Internal IDs and numeric order values are not shown.

Status creation validates non-empty unique names, valid visual configuration and required semantic invariants. Creation is one protected mutation, uses the current canonical revision, records Activity History, provides shared feedback and preserves entered form data if persistence fails.

Status editing uses the same modal where practical. It preserves stable Status ID, Task references, Activity History references, canonical versioning and required semantic invariants. If semantic changes would affect existing Tasks, the interface must require clear confirmation rather than silently reinterpreting large numbers of Tasks.

Manual Status ordering is supported where the domain treats Status order as configurable. Ordering provides drag handles plus accessible Move Up and Move Down alternatives, saves optimistically through the Mutation Coordinator, uses canonical revision protection, records Activity History and recovers through the shared failure path.

Status deletion is always soft deletion. No hard-delete action exists.

The final remaining non-deleted Status cannot be deleted. When exactly one non-deleted Status remains, Delete is disabled with an accessible explanation and no deletion dialog opens.

Before deletion, count every Task whose stored `statusId` references the Status being deleted. This count includes active, Closed, deferred, Project, loose, child and soft-deleted Tasks. Including soft-deleted Tasks prevents invalid references if those Tasks are restored later. Immutable historical Activity Event references are not rewritten.

If zero Tasks use the Status, do not request a Task migration target. Show a concise confirmation and soft delete on confirmation. If the Status is the default, another non-deleted open Status must still be selected or established as the replacement default, but the interface copy must keep default reassignment distinct from Task migration.

If one or more Tasks use the Status, show the exact affected Task count, require one replacement non-deleted Status, exclude the deleting Status from replacement choices and disable confirmation until the replacement is valid. The dialog states that affected Tasks will be changed to the replacement Status before the old Status is moved to Trash.

Deletion with migration is one logical mutation:

1. validate the deleting Status;
2. validate the replacement Status;
3. verify at least one other active Status remains;
4. migrate all affected Tasks;
5. reassign the default Status if required;
6. soft delete the original Status;
7. update timestamps and versions;
8. create Activity Events;
9. commit the complete state atomically.

If any step fails, no partial migration or partial deletion is committed, the dialog state remains available and shared failure recovery is used.

There must always be one valid non-deleted default Status for title-only Task creation. Deleting the default Status requires another non-deleted open Status to become the default. If Tasks also require migration, the selected migration target becomes the new default by default when it is a valid open Status.

Required semantic safeguards must be preserved. The app must not permit deletion or editing that leaves required Completed or Cancelled semantics undefined. Semantics are identified by stable classification, not by visible Status name alone.

Soft-deleted Statuses remain in storage for future administrative recovery, but launch does not provide an ordinary deleted-Status restoration interface. Status settings must not render a `Show deleted Statuses` restoration section, and Statuses do not appear in Trash.

Status Activity History records confirmed operations for creation, rename, colour change, icon change, order change, semantic classification change, default Status change, soft deletion and Tasks migrated from one Status to another. Bulk migration records a Status-level migration event and Task-level status-change events where consistent with the existing Activity History design, including old and new Status IDs and safe human-readable names.

Task creation and editing populate Status choices dynamically from non-deleted Statuses. A soft-deleted Status does not appear as a normal selection option, no Task retains it after successful migration deletion and title-only Task creation continues to receive the valid default Status. Existing open Task editor drafts that reference a newly deleted Status fail validation cleanly and require a current Status before saving.

Advanced status automation is roadmap-only.

---

# 20. Priorities

## 20.1 Five priority levels

Launch contains exactly five ordered Priority levels:

1. Top
2. High
3. Medium
4. Low
5. None

The internal ordering may be stored in either direction, but display and sorting must preserve this hierarchy.

## 20.2 Default Priority

New Tasks default to Medium unless context or user configuration specifies otherwise.

## 20.3 Priority configuration

Each Priority supports:

* name;
* colour;
* icon;
* rank.

## 20.4 Priority behaviour

Priority affects:

* visual prominence;
* default Task sorting;
* completion feedback.

Priority does not automatically increase as a date approaches.

There is no separate Importance field at launch.

## 20.5 Must Do Today

Must Do Today is a separate boolean property.

It is not a sixth Priority.

It receives precedence in default sorting and Today presentation.

---

# 21. Tags and Tag Groups

## 21.1 Tag purpose

Tags provide flexible classification independently from Projects and Areas.

## 21.2 Tag fields

A Tag supports:

* name;
* description;
* colour;
* one or more allowed scopes;
* optional Tag Group membership.

## 21.3 Tag scopes

A Tag may be scoped to one or more of:

* Tasks;
* Projects;
* Reference Lists.

Scope determines which entity types may apply the Tag.

A Tag may support several scopes simultaneously.

Reference List Items do not require Tags at launch.

## 21.4 Multiple Tags

An entity may have several Tags unless a Tag Group rule restricts selection.

## 21.5 Tag Groups

A Tag Group:

* contains Tags;
* may define inherited boolean properties;
* may be mutually exclusive;
* is not nested at launch.

The Settings Tags tab groups Tags beneath active Tag Group headings in Tag Group order, with Loose Tags in a final section. Grouped Tag rows are slightly indented beneath their heading. Tag ordering is sibling-only: a Tag may move within its current Tag Group, or within Loose Tags, but reordering never changes Tag Group membership.

New Tags default to the Tasks and Projects scopes, with Lists unselected. In the Settings Tags tab, Loose Tags show their own colour marker. Grouped Tags show one colour marker beside the white Tag Group name instead; member Tag names use the inherited Tag Group colour and do not repeat individual markers.

Each non-Loose Tag Group in the Tags tab can be collapsed or expanded with a leading chevron control. Tag rows present their name and scope on one wrapping line, with scope following the name after a gap. Tag row names use a medium weight below the group-heading weight.

## 21.6 Inherited properties

Tag Group properties are evaluated dynamically.

They are not copied into each Tag record.

## 21.7 Mutual exclusion

When a mutually exclusive Tag Group has one member selected:

* selecting another member removes the previously selected sibling;
* the final state contains only one selected member from that group.

The application does not store explicit negative Tag assertions.

## 21.8 Excluded Tag behaviour

Launch does not include:

* nested Tag Groups;
* scope-specific group rules;
* explicit positive and negative assertion storage;
* conditional Tag logic;
* cross-group validation engines.

---

# 22. Reference Lists

## 22.1 Purpose

Reference Lists store remembered or reference information.

They are not completable work.

Examples may include:

* books to consider;
* model numbers;
* useful links;
* packing references;
* names;
* recurring shopping references;
* technical commands.

## 22.2 List locations

A Reference List may be:

* loose;
* contained in one Area;
* contained in one Project.

A List belongs to exactly one of these locations at a time:

* Loose: no Area and no Project.
* Area List: one valid non-deleted Area and no Project.
* Project List: one valid non-deleted, non-archived Project and no separate Area assignment.

Project location determines Area context indirectly through the Project. A List must not store a contradictory Area assignment while assigned to a Project.

## 22.3 List fields

A Reference List supports:

* required title;
* one location;
* optional List-level Tags;
* ordered List Items;
* archive state;
* timestamps;
* version;
* soft-deletion metadata.

A List does not have:

* completion state;
* priority;
* Task status;
* scheduled date;
* recurrence;
* rich description.

Editable launch fields are title, location and List-level Tags. Archive and deletion state are changed only through lifecycle actions.

## 22.4 Lists destination

Lists is a first-class destination.

Opening Lists displays a List browser that allows the user to choose a List by title.

The browser should:

* show List titles clearly;
* include active non-deleted, non-archived loose, Area and Project Lists;
* indicate loose, Area or Project context, including the container name;
* open a List by clicking its title/main row area;
* expose compact row actions for Edit, Archive and Move to Trash;
* provide an empty state;
* use the contextual Add menu for List creation.

Archived Lists are excluded from active browsing and appear in Trash under Archived > Lists. Deleted Lists appear in Trash under Deleted > Lists.

## 22.5 List detail

Opening a List displays:

* the List title;
* location context;
* List-level Tags;
* ordered rows;
* compact actions for Edit, Archive and Move to Trash while active;
* contextual Add behaviour with List Item nearest the Add button.

The detail header provides Back, title, location context, Tags and actions. It does not duplicate the contextual List Item FAB with a second large Add Item button unless an existing empty-state action requires it.

The shared List editor is used for both create and edit. Create requires title and may include location and Tags. Create defaults to the active context: open Project, open Area, loose Lists browser, or the current List's containing context. Edit preloads title, current location and current List-level Tags, and the primary action is `Save Changes`. A failed save keeps the modal open, preserves the draft and uses shared mutation failure recovery.

The List editor location control presents Loose, Area and Project. Area selection shows current non-deleted Areas. Project selection shows current non-deleted, non-archived Projects. An archived Project may remain visible only as the current existing context of an edited List, marked archived, and is not a new relocation target.

Supported relocation moves are loose to Area, loose to Project, Area to loose, Area to Project, Project to loose, Project to Area, Project to Project and Area to Area. Relocation is one protected mutation and preserves List ID, title, Tags, Items, Item order, archive/deletion state where applicable, timestamps and version semantics.

Invalid destinations are rejected inline: deleted Project, archived Project, deleted Area, missing container and contradictory Project/Area state. Activity History records confirmed title changes, moves with previous and new location/container names, Tag additions/removals, archive, unarchive, move to Trash and restore.

List-level Tags use existing Tag scope rules. Only non-deleted Tags allowing Reference List scope are selectable. The Add tag button appears first, selected Tags follow immediately, Tags wrap, removal is available, mutual-exclusion Tag Groups are enforced and no Tag creation is offered from the List editor. If no valid List-scoped Tags exist, the picker shows a concise empty state.

## 22.6 List archive

Archived Lists remain associated with their original location.

They appear in Trash under Archived > Lists.

Archived Lists are viewable but read-only until unarchived. The app must not expose List Item creation, editing, deletion or contextual List Item Add actions for an archived List.

Archived List detail shows the Archived state and Unarchive through Trash. Active-detail Edit and Archive are suppressed while archived. Move to Trash is allowed from archived state: deletion clears archive metadata and sets deletion metadata in one mutation, so a record never appears as both Archived and Deleted.

## 22.7 List deletion

List deletion is always soft deletion.

Deleted Lists appear in Trash and can be restored.

Move to Trash uses the shared confirmation system. A non-empty List confirmation states the non-deleted Item count, explains that the List and Items disappear from active views and that restoring the List later restores the List container and non-deleted Items. Empty Lists use a simpler confirmation. Items are not hard-deleted; individually deleted Items remain deleted after List restoration.

Deleted Lists are visible only through Deleted mode. They may be restored but cannot be edited, relocated or receive new Items until restored.

---

# 23. Reference List Items

## 23.1 Item fields

A Reference List Item contains:

* stable ID;
* parent List ID;
* required text;
* optional link;
* user-defined order;
* timestamps;
* version;
* soft-deletion metadata.

Nothing else is required at launch.

List Items do not have:

* completion;
* status;
* priority;
* Tags;
* description;
* headings;
* sections;
* nesting;
* recurrence.

## 23.2 Text

The visible value is plain text.

Long text may wrap.

## 23.3 Optional link

An Item may include an optional absolute web URL.

Accepted schemes:

* `https://`
* `http://`

Rejected schemes include:

* `javascript:`
* `data:`
* unsupported script-capable protocols.

When a valid link exists:

* the Item text is visibly underlined;
* tapping or clicking the text opens the link;
* safe anchor behaviour is used.

When no link exists:

* the Item is ordinary text.

Invalid link text must produce validation feedback rather than silently becoming active.

## 23.4 Item row structure

From left to right, a List Item row contains:

1. reorder handle;
2. Item text or linked text;
3. Edit icon button;
4. Delete icon button.

Use Lucide icons:

* `GripVertical` or an equivalent vertical grip;
* `Pencil`;
* `Trash2`.

## 23.5 Reordering

The user controls Item order directly.

Requirements:

* drag begins only from the handle;
* touch drag works on mobile;
* mouse drag works on desktop;
* explicit Up and Down controls or another accessible non-drag method remain available;
* numeric order values are never exposed;
* reorder applies optimistically;
* failed reorder remains visible;
* linked text and action buttons do not begin drag.

## 23.6 Editing

Edit opens a modal containing:

* current text;
* optional link beneath it.

The modal:

* preloads current values;
* validates the link;
* requires non-empty text;
* does not expose order values;
* updates optimistically;
* preserves failure state if persistence fails.

## 23.7 Deletion

List Item deletion is soft deletion.

It may be initiated by:

* the Delete icon;
* swiping left;
* swiping right.

Swipe deletion must:

* require deliberate horizontal movement;
* avoid activation during vertical scrolling;
* avoid activating a link;
* provide threshold feedback;
* remove the Item immediately on commit;
* offer Undo;
* restore the Item to its former position on Undo.

## 23.8 Gesture separation

List row gestures must remain distinct:

* drag starts from the handle;
* swipe uses horizontal row movement;
* vertical scrolling takes precedence over small movement;
* links activate only on an ordinary tap or click;
* Edit and Delete remain normal buttons;
* gesture interactions must have non-gesture alternatives.

## 23.9 Bulk entry

Lists support bulk Item creation from pasted multiline text.

The bulk operation should:

* split by line;
* trim outer whitespace;
* ignore empty lines;
* create one Item per remaining line;
* preserve order;
* commit as one logical operation;
* support Undo;
* record Activity History where applicable.

Bulk entry does not parse CSV.

---

# 24. Core views

## 24.1 Today

Today shows:

* Tasks scheduled for today;
* revealed Tasks marked Must Do Today;
* relevant undated high-priority Tasks;
* Overdue Tasks in a separate Overdue section.

Today is a passive dashboard at launch.

It is not a guided daily-planning wizard.

## 24.2 Upcoming

Upcoming shows scheduled Tasks grouped by date.

The future range is configurable.

Undated Tasks do not appear.

## 24.3 Inbox

Inbox contains newly captured or deliberately unprocessed Tasks.

Inbox is a special Task location.

Launch does not include a guided GTD Inbox-processing wizard.

## 24.4 Tasks

The mobile-facing label is `Tasks`.

This opens the All Tasks functionality.

Tasks provides a broad view of active Tasks with launch sorting, grouping and filtering.

## 24.5 Lists

Lists opens the List browser described in this document.

## 24.6 Projects

Projects provides access to:

* active Projects;
* Project detail;
* Area organisation;
* contained Tasks;
* contained Reference Lists;
* Project progress;
* archived Project visibility.

## 24.7 Overdue

Overdue shows:

* open Tasks;
* with scheduled dates before today;
* excluding deferred Tasks not yet revealed where appropriate.

Tasks retain their original scheduled dates.

## 24.8 Someday

Someday shows Tasks explicitly assigned to the Someday special location.

Someday is distinct from future reveal-date deferral.

## 24.9 Trash

Trash shows soft-deleted entities.

Trash supports restoration.

Launch does not support permanent deletion.

## 24.10 Settings

Settings is the parent destination for configuration and diagnostics.

Diagnostics is not a top-level destination.

---

# 25. Task presentation

## 25.1 Compact and detailed modes

Task views support:

* compact presentation;
* detailed presentation.

The selected mode may be remembered per view or Project.

## 25.2 Task row information

Depending on presentation mode, a Task row may display:

* status or completion control;
* title;
* Project or Area context;
* Priority;
* Tags;
* scheduled date;
* Must Do Today;
* deferred state;
* pending state;
* failed state;
* additional actions.

## 25.3 Closed Tasks

Closed Tasks are hidden from ordinary active lists by default.

Relevant views and containers provide one `Show Closed` control.

Closed Tasks must remain visually distinguishable as Completed or Cancelled.

## 25.4 Deferred Tasks

Deferred Tasks must not rely only on opacity.

They should have a clear Deferred indicator and reveal date where shown.

## 25.5 Pending and failed Tasks

Pending mutations should have a restrained visible state.

Failed mutations should have:

* a clear failure indicator;
* brief error summary;
* available recovery actions.

---

# 26. Editing Tasks

## 26.1 Full editor

Full Task editing uses the shared Create/Edit Task modal defined in section 11.2.

## 26.2 Save behaviour

Routine Task editor changes remain local draft state until the user activates `Save Changes`.

Saving applies the complete draft as one logical protected mutation through the shared Mutation Coordinator. Failed saves keep the editor open and preserve the draft.

## 26.3 Editable fields

The full Task editor exposes the launch Task workflow fields through progressive disclosure:

* initial title-only state;
* Basics: Status, Priority, Tags and Description;
* More: Project and Parent;
* Dates: Due Date and Reveal On;
* Checklist: embedded checklist items.

Status configuration, Priority configuration, Tag configuration, Project creation, Area management, recurrence, reminders, exact times, separate planned/deadline dates, Task duration, attachments, Markdown, rich text, templates, aggregate-tree duplication, bulk editing and checklist nesting are not part of this modal.

## 26.4 Activity History location

Confirmed Task editor saves append Activity History events for significant changes. Activity History is retained in the canonical history model; this pass does not add a separate Activity History tab to the Task editor.

---

# 27. Bulk Task actions

Launch supports bulk selection.

Bulk actions include:

* move;
* add Tags;
* remove Tags;
* change status;
* change Priority;
* reschedule;
* complete;
* cancel;
* soft delete.

Bulk operations should:

* update optimistically;
* avoid partial mutation where practical;
* record Activity Events;
* provide Undo for reversible actions where practical;
* preserve failed-state visibility.

---

# 28. Sorting

## 28.1 Default ordering

Default Task order is:

1. Must Do Today;
2. Priority;
3. scheduled date;
4. manual order;
5. stable creation or ID tie-breaker.

## 28.2 Date sorting

When sorting by scheduled date:

* dated Tasks appear before undated Tasks;
* earlier dates appear before later dates;
* overdue Tasks retain their original date;
* undated Tasks appear last.

## 28.3 Manual order

Manual order remains available as a tie-breaker even when another automatic sort is active.

Manual ordering should not require exposing a numeric order field.

## 28.4 View-specific settings

Each view may remember its own sort configuration.

---

# 29. Grouping

## 29.1 One grouping field

A view supports one grouping field at a time.

## 29.2 All Tasks grouping

All Tasks supports grouping by:

* Area;
* Project or special location;
* Status;
* Priority;
* scheduled date;
* Tag.

## 29.3 Multi-Tag Tasks

Grouping by Tag must not create independent editable copies of the same Task.

The implementation must use a deterministic representation, such as:

* one primary Tag;
* a Multiple Tags group;
* one canonical row with secondary references.

---

# 30. Filters

## 30.1 Launch filter logic

Launch filters use AND logic.

All active conditions must match.

## 30.2 Supported filter fields

Launch filters may include:

* Area;
* Project or special location;
* Status;
* Priority;
* scheduled-date state;
* Must Do Today;
* Tag;
* active or Closed;
* deferred state.

## 30.3 Filter visibility

Active filters must be clearly visible.

A `Clear Filters` action must be available.

## 30.4 Filter persistence

Filter state is transient.

It resets when leaving the view.

Sort, grouping and presentation preferences remain remembered.

## 30.5 Excluded filtering

Launch does not include:

* OR groups;
* exclusion filters;
* full-text search;
* saved filters;
* smart views.

---

# 31. Recurrence

## 31.1 Recurrence model

Recurrence exists as durable Schedule records. A Schedule owns its rule, independent Task template, destination, cursor, processing metadata, optional pause state, optional Needs Attention state, soft deletion metadata and Activity History.

Generated Tasks are ordinary independent leaf Tasks with durable provenance back to the Schedule and occurrence slot.

Occurrence keys are deterministic and use the Schedule ID plus Sydney local occurrence date. They never use Task ID, processing timestamp, browser session, current title or current Schedule name.

## 31.2 Management

Recurrence management lives at `Settings > Recurrence` with stable route `#/settings/recurrence`. Recurrence is not a top-level navigation destination.

The screen lists active and paused non-deleted Schedules. Rows show Schedule label, concise rule summary, Active/Paused/Needs Attention state, next eligible occurrence date, destination, last successful generation date where available, Edit, Pause or Resume, and Move to Trash.

Deleted Schedules do not appear in ordinary management and have no ordinary Trash restoration UI.

The contextual Add registry exposes `Schedule` on `Settings > Recurrence` in this visual order: Project, List, Task, Schedule, FAB. The action is hidden while the Schedule editor, confirmation or another blocking modal is open.

## 31.3 Supported launch patterns

Launch supports Daily, Weekly and Monthly Schedules.

Daily supports every N days, where N is at least 1.

Weekly supports every N weeks, where N is at least 1, with one or more selected weekdays displayed Monday-first.

Monthly supports every N months, where N is at least 1, with one selected day of month. If the selected day does not exist in a shorter month, the occurrence clamps to that month's final valid day.

Start date is inclusive. Optional end date is inclusive and must not be before the start date.

Rule edits apply prospectively from the Sydney edit date. They do not recreate historical occurrences, delete generated Tasks or rewrite existing provenance.

## 31.4 Excluded recurrence patterns

Launch does not support:

* yearly recurrence;
* fixed occurrence count;
* last Friday of the month;
* ordinal weekday rules;
* skipping an occurrence;
* completion-relative recurrence;
* hourly or minute-level recurrence;
* arbitrary cron syntax;
* recurrence exceptions;
* recurring subtasks;
* recurring aggregate trees;
* per-occurrence template overrides.

## 31.5 Task template

A Schedule Task template may define:

* title;
* description;
* Priority;
* destination;
* Project or Area;
* Tags;
* Must Do Today;
* scheduled date derived from the occurrence;
* reveal-date behaviour where applicable;
* checklist content where supported.

Generated Tasks always use the current configured default open Status and fresh IDs. They do not copy source Task ID, parent relationship, child Tasks, source Activity History, deletion state or closed state.

Existing leaf Tasks may seed a new Schedule draft through `Create recurrence Schedule`. The source Task is unchanged and the Schedule must be explicitly saved.

## 31.6 Generation timing

The rule generates Tasks only as occurrence boundaries become due.

It does not generate a large future set in advance.

For a weekly Sunday recurrence:

* the Sunday occurrence exists during Sunday;
* when Sunday becomes past, the next required occurrence is generated;
* generation does not depend on completing Sunday’s Task.

## 31.7 Incomplete prior Tasks

An incomplete prior occurrence does not block generation of later occurrences.

Missed occurrences may accumulate.

## 31.8 Idempotence

Repeated processing must not generate duplicate occurrences.

The backend must enforce a unique occurrence identity.

Multiple:

* tabs;
* devices;
* launches;
* scheduled jobs;
* reconnects

must not create duplicate Tasks for the same rule and occurrence.

## 31.9 Missed-occurrence presentation

Missed occurrences are collapsed by the launch processor rather than each becoming a full canonical Task.

Where several open overdue Tasks belong to the same rule, applicable list views may collapse them into one summary stub.

The stub should:

* show the number of missed open occurrences;
* expand to reveal individual Tasks;
* preserve individual editing and closure;
* not merge or delete canonical Tasks.

## 31.10 Recurrence management

A Recurrence management screen supports:

* active rules;
* paused rules;
* rule creation;
* editing;
* pausing;
* resuming;
* soft deletion;
* next scheduled boundary;
* generation health;
* number of generated open Tasks.

## 31.11 Pausing and deleting rules

Pausing:

* prevents future generation;
* leaves existing Tasks unchanged.

Soft-deleting a rule:

* stops future generation;
* leaves existing generated Tasks unchanged.

## 31.12 Processing reliability

Launch recurrence uses the application-level authenticated catch-up processor.

It runs after canonical startup, reload, focus, visibility restoration and one shared foreground timer while the app is open.

GitHub Pages cannot generate Tasks while the browser is closed. Catch-up on the next authenticated application session is the guaranteed launch behaviour.

## 31.13 Timezone

Recurrence boundaries use `Australia/Sydney`.

Date calculations must handle daylight-saving changes correctly.

## 31.14 Launch recurrence contract

`Settings > Recurrence` is the management surface and restores at `#/settings/recurrence`. It lists active and paused non-deleted Schedules with label, rule summary, Active/Paused/Needs Attention state, next eligible occurrence date, destination, last successful generation date, Edit, Pause or Resume, and Move to Trash. Deleted Schedules have no ordinary restoration UI.

The contextual Add registry exposes `Schedule` on that screen in the order Project, List, Task, Schedule, FAB, and hides it while blocking overlays are open.

Supported launch rules are Daily, Weekly and Monthly with intervals of at least 1. Weekly requires one or more Monday-first weekdays. Monthly uses one selected day of month and clamps to the final valid day in shorter months. Start and optional end dates are inclusive, and rule edits apply prospectively from the Sydney edit date.

Generated Tasks are ordinary independent leaf Tasks with fresh IDs, the current default open Status, configured Priority and Task Tags, configured destination, optional fresh checklist item IDs, and immutable provenance containing Schedule ID, occurrence key, occurrence date, generation operation ID, Schedule label snapshot and collapsed-count details when applicable.

Occurrence keys are deterministic from Schedule ID and Sydney local occurrence date. Active, Closed, deferred and soft-deleted generated Tasks remain consumed occurrences, so deleting or completing a generated Task does not allow regeneration.

Processing is application-level, single-flight and revision-protected through the shared Mutation Coordinator. Task creation and Schedule cursor advancement are atomic. Concurrent tabs rely on deterministic keys, canonical revision conflicts, reload and bounded retry; the expected result is one generated Task for one consumed occurrence.

When several missed slots are due, processing creates one catch-up Task for the latest due slot, records collapsed count plus first and last missed dates, and advances the cursor beyond all collapsed due slots. Discarded slots do not become Tasks or fake events.

Pausing skips the paused interval. Resuming is prospective from the Sydney resume date and does not backfill. Invalid destinations mark the Schedule Needs Attention and create no silent Inbox fallback; correction resumes prospectively.

All recurrence calculations use `Australia/Sydney` local calendar semantics and must avoid browser-timezone assumptions, fixed UTC offsets and millisecond-day stepping.

---

# 32. Activity History

## 32.1 Purpose

Activity History provides an append-only record of significant changes.

## 32.2 Recorded events

Record at least:

* creation;
* title change;
* description change;
* movement;
* scheduled-date change;
* reveal-date change;
* Priority change;
* status change;
* Tag change;
* completion;
* cancellation;
* reopening;
* aggregate conversion;
* aggregate cascade closure;
* restoration;
* soft deletion;
* Undo;
* relevant List and List Item operations.

## 32.3 Old and new values

Where practical, events include:

* previous value;
* new value;
* timestamp;
* affected entity;
* operation source.

## 32.4 Immutability

Activity Events are immutable.

Undo creates a new event stating that an earlier action was reversed.

The original event is not deleted or rewritten.

## 32.5 Retention

Activity History is retained indefinitely.

---

# 33. Soft deletion and Trash

## 33.1 Universal soft deletion

Normal user deletion is always soft deletion.

This applies to:

* Areas;
* Projects;
* Tasks;
* Lists;
* List Items;
* Tags;
* Tag Groups;
* recurrence rules;
* applicable settings records.

## 33.2 Trash

Trash is the launch surface for Hidden records. Hidden is an umbrella product category with two distinct lifecycle states:

```text
Hidden
|-- Deleted
`-- Archived
```

Deleted records are soft-deleted, use deletion metadata such as `deletedAt`, are removed from active use and may be restorable where launch UI supports restoration. Archived records are hidden from normal browsing, use archive metadata such as `archivedAt`, keep their structure and relationships intact and may be unarchived.

Deleted and Archived must remain technically and behaviourally separate. Do not replace them with one generic `hidden` field.

Launch entity support:

| Entity | Deleted | Archived |
| ------ | ------- | -------- |
| Project | Yes | Yes |
| Task | Yes | No |
| Reference List | Yes | Yes |

Tasks use Completed and Cancelled as Closed states instead of Archive. List Items, Statuses, Priorities, Tags, Tag Groups, recurrence Schedules and settings records may remain soft-deleted in storage, but have no ordinary launch restoration UI and do not appear in Trash.

Trash keeps the navigation label `Trash` and contains a top-level segmented mode control:

1. Deleted.
2. Archived.

Deleted is the default mode on a fresh visit. Deleted mode shows entity tabs in this order:

1. Projects.
2. Tasks.
3. Lists.

Archived mode shows entity tabs in this order:

1. Projects.
2. Lists.

Archived mode must not show a disabled or empty Tasks tab. If the user switches from Deleted > Tasks to Archived, the selected tab becomes Projects.

Deleted records sort by `deletedAt` descending. Archived records sort by `archivedAt` descending. Title is only a tie-breaker.

Deleted rows provide `Restore`. Archived rows provide `Unarchive`.

## 33.3 Restoration

Restoration should return an entity to its previous location where possible.

If the previous container is unavailable:

* explain the issue;
* restore to a safe recognised location;
* do not silently lose the record.

Immediate Undo is a fuller reversal than later restoration from Trash. Immediate Undo of a Project deletion restores the Project and the Task/List relationships captured in the deletion receipt, subject to conflict checks. Later restoring a deleted Project from Trash only clears the Project deletion metadata and restores the Project itself; it does not reclaim formerly linked Tasks or Lists because Project deletion deliberately severed those relationships.

Project archive preserves completion state, Area membership, Task relationships and List relationships. Archived Projects disappear from active Project browsing and assignment selectors, but existing Task and List references display the Project name with a subdued archived indicator and a Lucide Archive icon rather than treating the reference as broken.

Project deletion is structurally stronger than archive. Before confirming deletion, count every current Task and Reference List that references the Project, including Closed, deferred, child and soft-deleted Tasks plus archived and soft-deleted Lists. The deletion command detaches every Task and List atomically before soft-deleting the Project. Tasks fall back to the Project Area when that Area is valid; otherwise they move to Inbox. Lists fall back to the Project Area when valid; otherwise they become loose Lists. Deleted Project references must not survive in current records.

## 33.4 Retention

Soft-deleted records are retained indefinitely.

Launch does not include permanent deletion.

## 33.5 Archive, Closed and deleted distinction

These are separate states:

* Archived: hidden from active organisational views but still retained in place.
* Closed: a Completed or Cancelled Task.
* Deleted: soft-deleted and shown in Trash.

The interface must not treat them as interchangeable.

---

# 34. Settings

## 34.1 Settings purpose

Settings is the parent location for:

* application configuration;
* status configuration;
* Priority configuration;
* Tag configuration;
* Tag Group configuration;
* view configuration where applicable;
* recurrence access where appropriate;
* diagnostics;
* desktop data export;
* authentication-related configuration where exposed.

## 34.2 Mobile Settings

Settings appears on the secondary mobile dock page.

Diagnostics is accessed from within Settings.

## 34.3 Configuration completeness

Any user-configurable feature included at launch must have a usable configuration path.

A capability is not launch-complete if its configuration only exists in seed data or source code.

---

# 35. Diagnostics

## 35.1 Diagnostics location

Diagnostics is a screen inside Settings.

It is not a primary top-level destination.

## 35.2 Diagnostic information

Diagnostics should display:

* application version;
* frontend build identifier;
* schema version;
* backend provider;
* authentication state;
* initial synchronisation state;
* connection or subscription state;
* last successful synchronisation time;
* pending mutation count;
* failed mutation count;
* recurrence processor state;
* last recurrence processing time;
* production configuration health;
* development-adapter warning where relevant.

## 35.3 Error detail

Ordinary errors should be brief.

Expandable technical details may show safe debugging information.

## 35.4 Copy Diagnostics

Diagnostics should provide a sanitised Copy Diagnostics action.

It must exclude:

* credentials;
* tokens;
* passwords;
* TOTP secrets;
* recovery codes;
* private URLs containing secrets;
* sensitive record payloads.

---

# 36. JSON export

## 36.1 Desktop-only interface

Export is available through the desktop interface.

It is not shown on mobile.

There should be no disabled mobile Export control.

## 36.2 Export purpose

The export supports:

* migration to another hosting platform;
* recovery investigation;
* long-term portability;
* recreating a full-scale offline simulation;
* future import into a fresh deployment.

## 36.3 Export contents

The full-fidelity export includes:

* Areas;
* Projects;
* Tasks;
* Task hierarchy;
* Lists;
* List Items;
* statuses;
* Priorities;
* Tags;
* Tag Groups;
* inherited Tag Group properties;
* recurrence rules;
* recurrence generation ledger;
* Activity Events;
* archived records;
* soft-deleted records;
* application settings;
* view preferences;
* schema version;
* application version;
* export timestamp;
* timezone;
* safe non-secret metadata.

## 36.4 Export exclusions

The export must exclude:

* passwords;
* password hashes;
* TOTP secrets;
* recovery secrets;
* recovery-code values;
* recovery-code hashes;
* service-role credentials;
* access tokens;
* refresh tokens;
* email-delivery secrets;
* privileged backend keys.

## 36.5 Export format

The export uses a documented versioned envelope containing:

* format identifier;
* format version;
* application version;
* schema version;
* export timestamp;
* timezone;
* provider-neutral domain data;
* clearly separated provider metadata where unavoidable.

## 36.6 Import boundary

JSON import is roadmap-only.

Launch includes export, not restoration through the production interface.

---

# 37. Visual design

## 37.1 Authoritative style guide

`STYLE.md` is authoritative for exact visual rules.

This section defines product-level intent only.

## 37.2 Visual foundation

ToDonut uses:

* a dark-only interface;
* true monochrome surfaces and structure;
* deliberate whitespace;
* restrained use of highlight colours;
* consistent Lucide icons;
* precise control dimensions;
* consistent border radii;
* limited elevation;
* strong focus states.

## 37.3 Highlight colours

The established palette is used selectively for:

* Priority;
* status;
* Tags;
* Project identity;
* warnings;
* destructive actions;
* success;
* progress;
* selection;
* completion effects.

Ordinary interface structure remains monochrome.

## 37.4 Whitespace

Desktop uses available space deliberately.

Mobile remains compact enough for effective use while preserving touch comfort.

Whitespace should organise information rather than merely enlarge components.

## 37.5 Buttons and controls

Controls must use established shared primitives.

Similar controls must have consistent:

* height;
* padding;
* icon size;
* radius;
* focus treatment;
* disabled treatment;
* pending treatment.

## 37.6 Tags

Tags must remain compact metadata elements.

They must not become oversized pill buttons.

## 37.7 Completion feedback

Completion feedback should be:

* brief;
* non-blocking;
* slightly varied by Priority;
* more playful for Project or large aggregate completion;
* respectful of reduced-motion preferences.

The product may be a little silly here without becoming visually noisy.

---

# 38. Accessibility and interaction reliability

Launch should provide:

* visible keyboard focus;
* semantic buttons and links;
* accessible names for icon-only buttons;
* adequate touch targets;
* non-colour state indicators;
* modal focus management;
* reduced-motion support;
* gesture alternatives;
* safe links;
* readable contrast.

Complete keyboard-only desktop operation is not a launch requirement, but ordinary controls should remain keyboard-operable where standard HTML behaviour provides it.

Swipe and drag interactions must always have practical non-gesture alternatives.

---

# 39. Error handling

## 39.1 Error presentation

Errors should:

* state what failed;
* avoid blaming the user;
* preserve affected data where possible;
* provide a recovery action;
* hide technical detail unless expanded.

## 39.2 Configuration errors

Missing production configuration must produce a clear configuration screen or error.

The app must not silently use local persistence.

## 39.3 Backend errors

Backend errors should be categorised where possible as:

* temporary connection failure;
* authentication failure;
* validation failure;
* stale-version conflict;
* permission failure;
* server error;
* unknown failure.

## 39.4 No silent failure

No action that appears to save data may fail silently.

---

# 40. Data integrity and migrations

## 40.1 Schema migrations

Every schema change requires an explicit migration.

## 40.2 Existing data

Migrations should preserve existing records where practical.

Destructive interpretation changes must be documented.

## 40.3 Pre-migration export

Before a destructive schema migration or major upgrade:

* create a full JSON export where the migration is user-driven;
* or require an explicit verified backup step for backend deployment migrations.

## 40.4 Migration failure

A failed migration must not leave the database in a partially applied, falsely successful state.

## 40.5 Version compatibility

The application and export format should record schema versions.

Older exports should remain migratable through future explicit import logic.

---

# 41. Performance expectations

The application should remain responsive with years of ordinary single-user data.

Important interactions should feel immediate, including:

* Task completion;
* List Item creation;
* List reordering;
* moving Tasks;
* opening views;
* applying Tags;
* changing status;
* soft deletion.

Large lists may use optimisation such as virtualisation only where needed.

Animation must not delay interaction.

Repeated tapping must not create duplicate records.

---

# 42. Launch exclusions

The following are explicitly outside launch scope and should not be reported as defects unless the interface misleadingly suggests they exist:

* PWA installation;
* offline editing;
* native mobile applications;
* public registration;
* collaboration;
* shared Projects;
* comments between users;
* file attachments;
* image uploads;
* Markdown or rich-text descriptions;
* exact Task times;
* Task duration estimates;
* time tracking;
* focus or Pomodoro mode;
* task dependencies;
* automatic Next Action inference;
* guided daily planning;
* weekly review;
* Kanban;
* full-text search;
* saved smart views;
* OR filter groups;
* exclusion filters;
* reminders;
* browser notifications;
* calendar integration;
* JSON import;
* CSV export;
* multi-Area Project membership;
* nested Tag Groups;
* advanced Tag Group rule engines;
* completion-relative recurrence;
* recurrence skipping;
* advanced ordinal recurrence;
* recurring Task trees;
* aggregate-tree duplication;
* Task templates;
* quick-add shorthand;
* permanent deletion;
* artificial intelligence features;
* general API or webhooks;
* custom light theme.

See `ROADMAP.md` for fuller definitions.

---

# 43. Launch-readiness criteria

ToDonut is launch-ready only when all of the following are true.

## 43.1 Access and persistence

* Production authentication works.
* Unauthenticated users cannot access data.
* Data persists in Supabase.
* Data survives refresh and device changes.
* Multi-device updates work.
* Stale writes cannot overwrite newer data.
* Failed mutations remain visible and recoverable.
* Production never silently falls back to local storage.

## 43.2 Navigation

* Mobile opens to Today.
* Both mobile dock pages work.
* Dock swiping is reliable.
* Desktop can access all launch destinations.
* Lists is clearly accessible.
* Settings contains Diagnostics.
* Export is desktop-only.

## 43.3 Core creation

* Task creation works.
* Project creation works.
* List creation works.
* List Item creation works.
* Context-aware defaults work.
* Minimal and expanded modal states work.

## 43.4 Tasks and Projects

* Task editing works.
* status and Priority work.
* dates and deferral work.
* Inbox and Someday work.
* Project membership works.
* aggregate Task conversion works.
* aggregate closure and reopening work.
* Project completion and progress work.
* bulk actions work.

## 43.5 Lists

* loose, Area and Project Lists work.
* List browser works.
* List detail works.
* Items support text and optional links.
* link validation works.
* reorder works on mobile and desktop.
* Edit works.
* Delete icon works.
* swipe deletion works.
* Undo works.
* archive and Trash behaviour work.
* bulk multiline entry works.

## 43.6 Views

* Today derives correct Tasks.
* Upcoming derives correct Tasks.
* Overdue derives correct Tasks.
* Inbox works.
* Tasks supports launch sorting, grouping and filtering.
* Someday works.
* Trash restores records.
* Closed visibility works.
* deferred behaviour works.

## 43.7 Configuration

* statuses are configurable.
* Priorities are configurable.
* Tags are configurable.
* Tag Groups are configurable.
* view preferences persist.
* recurrence rules are manageable.

## 43.8 Recurrence

* daily generation works.
* weekly generation works.
* selected weekdays work.
* monthly generation works.
* intervals work.
* end dates work.
* pause and resume work.
* generation is idempotent.
* incomplete occurrences do not block later generation.
* missed-occurrence collapsing works.
* generated Tasks remain independent.

## 43.9 Safety

* deletion is soft.
* Trash restoration works.
* Activity History records significant changes.
* Undo creates new history.
* JSON export includes full safe data.
* authentication secrets are excluded.
* diagnostics are sanitised.
* migrations are explicit.

## 43.10 Interface quality

* `STYLE.md` is followed.
* mobile and desktop are both usable.
* no major content is obscured.
* focus states are visible.
* gesture alternatives exist.
* completion feedback is non-blocking.
* ordinary controls remain consistent.

---

# 44. Relationship to the feature audit

`FEATURE_AUDIT.md` should assess every launch area against this document.

For each feature, the audit should identify whether it is:

* implemented and usable;
* implemented with limitations;
* partially implemented;
* model-only;
* UI-only;
* inaccessible;
* broken;
* not implemented;
* roadmap-only.

The audit should not redefine intended behaviour.

When the audit identifies missing or conflicting requirements, this document should be updated before implementation proceeds.

---

# 45. Maintenance rule

Whenever a future implementation pass:

* adds a launch feature;
* changes launch behaviour;
* removes a launch requirement;
* changes an entity relationship;
* changes a workflow;
* changes a security rule;
* changes a synchronisation rule;
* changes the authoritative interpretation of a view;

the same pass should update this document.

Minor visual adjustments that remain within `STYLE.md` do not require duplication here.

Post-launch ideas should be added to `ROADMAP.md`, not this document.
# Bakery access addendum

Bakery is a dedicated destination with a persistent header launcher and a labelled desktop navigation entry. The launcher becomes icon-led at narrow widths. It participates in browser history and Back navigation. Bakery is intentionally not inserted into the mobile dock.

# Configuration launch addendum

Settings contains separate entries for Statuses, Priorities and Tags. Tags opens one destination with two tabs: Tags and Tag Groups. Only the active tab content is shown.

Contextual Add behavior for configuration is:

* Statuses injects `Status`.
* Priorities injects no contextual action because exactly five Priority records always exist.
* Tags tab injects `Tag`.
* Tag Groups tab injects `Tag Group`.
* The Tags destination never shows both contextual actions at once.

Statuses preserve stable semantic identities through the `category` field, not editable names. Completed and Cancelled behavior survives renaming. Statuses support editable name, colour, manual ordering, one default open Status, safe soft deletion, affected Task migration and no ordinary deleted-Status restoration UI. Stored icon fields remain compatibility data only and are not exposed in launch UI.

The first active Status in configured order is the default open Status. `Set Default` changes that order. No separate default Status ID is stored.

Priorities are exactly five active records. They cannot be created, deleted or archived. The user may rename, recolour, reorder and choose the default Priority. Priority IDs remain stable and independent from name, colour, icon and rank. Stored icon fields remain compatibility data only and are not exposed in launch UI. Reordering changes Task sorting rank without rewriting every Task.

Tags have required name, optional description, colour, one or more scopes, optional Tag Group, order and soft-deletion metadata. Supported scopes are Tasks, Projects and Reference Lists. Removing a used scope detaches the Tag from affected entities in the same mutation. Deleting a Tag soft deletes it and removes all current assignments from Tasks, Projects and Reference Lists. There is no ordinary Tag restoration UI.

Tag Groups have required name, optional description, manual order, `Mutually exclusive`, inherited boolean properties defined by the model, and soft-deletion metadata. Groups do not nest. Deleting a Group soft deletes the Group and ungroups member Tags without deleting Tags or entity assignments. There is no ordinary Tag Group restoration UI.

Tag Group rules are dynamic. Pickers use effective rules derived from the current Tag plus active Tag Group. For mutually exclusive Groups, selecting one member removes selected siblings while preserving unrelated Tags. Enabling exclusivity or moving a Tag into an exclusive Group repairs existing conflicts atomically; the deterministic survivor is the first assigned member by current Tag order, except moving a Tag into an exclusive Group preserves the moved Tag.

# Projects and Areas launch-completion addendum

Projects and Areas are separate top-level destinations. Projects owns Project browsing and Project detail workflows. Areas owns Area browsing, Area detail workflows and deleted Area restoration.

The Projects destination shows active non-deleted, non-archived Projects. Completed Projects are hidden by default and revealed with the shared visibility toggle. Completed Projects are closed, not archived: they retain Tasks, Lists, Area, Tags, colour and stored compatibility icon data, may be opened read-only, may be Reopened, and may still be archived or moved to Trash. The Areas destination shows active Areas ordered manually and offers deleted Area visibility with the shared visibility toggle and restore controls. Deleted Areas do not appear in global Trash.

Projects support title, description, one optional Area, colour, Project-scoped Tags, manual order, completion metadata, archive metadata, deletion metadata and versioned timestamps. Projects do not support status, priority, due date, recurrence, nested Projects or multiple Areas. Areas support title, description, colour, manual order, deletion metadata and versioned timestamps. Areas do not support Tags, completion or archive. Stored Project and Area icon fields remain compatibility data only and are not exposed in launch UI.

Project detail shows a compact header with title, Area context, lifecycle state and progress, followed by Tasks and Reference Lists. Task hierarchy is shown from Project root Tasks without duplicating child Tasks as separate roots. Archived and completed Project detail suppresses new Project-context Task/List creation and Child Task creation; archived Projects also suppress ordinary editing. Reopening a completed Project clears only Project completion metadata and does not reopen descendant Tasks.

Project progress counts non-deleted, non-aggregate actionable Task descendants in the Project at every depth. Aggregate parents are excluded. Completed and Cancelled counts remain distinct, and Projects with no actionable Tasks display `No actionable Tasks` rather than 100 percent progress.

Completing a Project is explicit. If open actionable descendant Tasks exist, confirmation states their count and that they will be marked Completed. Confirmation atomically completes open actionable descendants, preserves Cancelled descendants, closes aggregate ancestors through existing Task rules, marks the Project completed and records Activity History. Reopen clears only the Project completion state.

Area detail shows Projects assigned to the Area, standalone Tasks directly assigned to the Area and direct Reference Lists assigned to the Area. Project-contained Tasks and Lists are reached through their Project and are not duplicated as direct Area contents.

Area deletion is soft deletion. It does not delete Projects, Tasks or Lists. On confirmation it atomically clears Project Area assignments, moves standalone Area Tasks to Inbox, makes direct Area Lists loose, soft deletes the Area and records Activity History. Immediate Undo may restore the Area and former relationships while its receipt is available. Later restore from `Areas > Show deleted Areas` restores only the Area and does not reclaim former relationships.

The shared contextual Add registry remains authoritative. The Areas destination injects `Area` below Task when no concrete Area detail is open. Open Area defaults permanent Project, Task and List creation to that Area. Open active Project defaults permanent Task and List creation to that Project. Completed and archived Project contexts suppress Project-scoped creation defaults. `Child Task` appears only when a concrete Task is the active parent context.

# Task view launch-completion addendum

Core task-containing launch views derive membership through shared selectors rather than screen-owned rules. Active views exclude soft-deleted Tasks, future `Reveal On` Tasks, and aggregate parents as ordinary actionable rows unless a hierarchy/detail context needs the parent to preserve structure. Completed and Cancelled are both Closed and remain distinct by configured Status category.

Today contains revealed Tasks in this precedence: Overdue, Must Do Today, Due Today, High Priority with no Due Date, then Closed when `Show Closed` is enabled. A Task matching multiple Today rules appears once in the highest applicable section. Inbox contains revealed Tasks still located in Inbox. Tasks is the broad all-Tasks view and is the intentional place where future `Reveal On` Tasks appear in a Deferred section. Upcoming contains revealed Tasks with Due Date after today. Overdue contains revealed Tasks with Due Date before today. Someday contains revealed Tasks explicitly located in Someday.

Project detail shows root Project Tasks with hierarchy context and Project Reference Lists; descendants are not duplicated as separate roots. Area detail shows Projects in the Area, standalone Area Tasks, and direct Area Lists; Project-contained records are reached through their Project. Project and Area task sections use shared `project-detail` and `area-detail` preference keys rather than one preference record per entity.

Task views provide a shared control surface for `Show Closed`, sort, grouping, compact/detailed presentation, and transient AND filters. Clear Filters resets only transient filters. Filters reset on route changes and are not exported or persisted. Persisted task-view preferences are sort, grouping, presentation and Show Closed.

Launch sort modes are Default, Due Date, Priority, Manual and Title. Launch grouping is one field at a time: None, Area, Project or special location, Status, Priority, Due Date or Tag, with view-specific option sets. Tag grouping uses one deterministic Tag and does not duplicate a Task.

Routes are GitHub Pages-compatible hash routes. Stable routes include `#/today`, `#/inbox`, `#/tasks`, `#/lists`, `#/lists/:listId`, `#/projects`, `#/projects/:projectId`, `#/areas/:areaId`, `#/upcoming`, `#/overdue`, `#/someday`, `#/trash`, `#/settings`, `#/settings/statuses`, `#/settings/priorities`, `#/settings/tags`, and `#/settings/tag-groups`. Refresh restores the top-level destination and supported List, Project, Area and Settings detail routes. Browser Back/Forward restores hash route state and closes active editor modals.

Activity History is displayed read-only inside Task, Project, Area and Reference List editors. Events are newest first, use Australian local date/time, show summaries, and show old/new display values where recorded. Old/new values must resolve entity IDs such as Area, Project, Status, Priority, Tag, List, Schedule and Task references to user-facing names and must not expose raw database keys where a display label can be derived. Activity Events remain immutable. Undo is represented as a new Activity Event; arbitrary historical rollback is not a launch behaviour.

Bulk Task selection is available in Today, Inbox, Tasks, Upcoming, Overdue, Someday, Project detail and Area detail. Launch bulk actions are Move, Add Tags, Remove Tags, Change Status, Change Priority, Reschedule, Complete, Cancel and Move to Trash. Bulk commands deduplicate selected parent/descendant overlap, calculate cascades for tree operations, apply through one logical mutation, create Activity Events, and clear selection after success. Cascade Complete, Cancel and Trash operations require confirmation when the affected count is large.

# Launch-gap decisions addendum

Recurrence is processed after authenticated canonical startup and is checked again on focus, visibility restoration and the foreground interval. Missed occurrences collapse under the current recurrence rule. Generation while every client is closed is not a launch capability; the next authenticated session performs catch-up. Deterministic occurrence keys plus canonical revision conflict protection are the accepted single-owner launch uniqueness model. A server scheduler or Edge Function recurrence processor is not required for launch.

Archived Reference Lists are read-only for content and configuration. They may be Unarchived or moved directly to Trash. Moving an archived List to Trash clears `archivedAt` and sets `deletedAt`; a List must never be both Archived and Deleted.

Task sibling ordering uses drag handles only. Dragging is limited to the current sibling group and cannot change Parent, Project, Area, Inbox or Someday placement. No visible Move Up or Move Down Task controls are required.

Launch recurrence templates do not expose editable checklist templates. Generated recurring Tasks use the current first active Status in configured order.
# 2026-07-02 launch-gap decisions

- Task Tag filters select active Task-scoped Tags and combine selections with AND logic. Filter selection does not enforce Tag Group exclusivity.
- Filtered hierarchies retain only required ancestors. Those rows are structural context, are visually subdued, and do not count as matches.
- Bulk Status and Cancel operations preserve aggregate cascade semantics, closed descendant distinctions and ancestor consistency.
- Archived Projects expose only Unarchive, Move to Trash and read-only navigation. Completed Projects remain distinct and may be reopened or archived.
- Area detail does not expose Project ordering; ordering remains in the main Projects browser.
- Valid List, Project and Area detail routes show an explicit unavailable state when their entity is missing or deleted.
- Recurrence runs authenticated app-open/foreground catch-up. Generated Tasks use the first active Status in configured order. Schedule templates do not contain editable checklist content and source Task checklists are not copied.
- Archived Lists remain content-read-only but may move directly to Trash; that transition clears Archive and applies Deleted state.
- The first active Status in configured order is the default open Status. Set Default changes ordering; no separate default Status ID exists.
- Export is desktop-only. At mobile breakpoints it uses `display: none`, removing it from layout, focus order and the accessibility tree.

# 2026-07-02 desktop cleanup addendum

The authenticated shell header uses a compact hamburger application menu. The trigger has accessible label `Open application menu`, closes on outside click, Escape, route change and after actions, and restores focus to the trigger. Desktop menu items are Export and Sign out. Bakery remains available through desktop left navigation and must not duplicate as a desktop header action. Mobile menu includes Sign out and Bakery because Bakery is not in the mobile dock; Export remains desktop-only and absent from mobile focus order.

The brand keeps the ToDonut logo, `ToDonut` title and exact tagline `Productivity with sprinkles`. Healthy backend adapter names or dots are not persistent header content. Backend state appears only through loading/signed-out states, Diagnostics, transient feedback, or the persistent mutation recovery banner when actionable.

### Desktop UI cleanup contracts

Task sections use one content column. Section headings, root Task cards, empty states and filtered states align to that column. A root Task at hierarchy depth zero has no hierarchy indentation; descendants, structural ancestors and nested aggregate trees retain deliberate hierarchy indentation.

Compact Task rows use the predictable grid: drag handle, completion ring, title with metadata and one action group. The selected-state pill straddles the card border and does not consume layout width. Drag handles sit close to the card edge while keeping the larger invisible drag hit area. Status, Due and Project metadata render beneath the title as muted `Status:`, `Due:` and `Project:` lines when present, with Status carrying a small status-colour marker and no `Active parent` pill.

Edit, Process and Delete actions appear as one right-aligned icon-only row. All three use the same square outline geometry and visible focus treatment; Delete keeps destructive styling. Open completion rings are empty dark centres with Priority-coloured outer rings. Completed leaf Tasks use the animated check drawing, and hidden Closed rows remain mounted long enough for that animation to finish unless reduced motion is preferred. Show Closed on keeps the completed Task in its Closed presentation.

Task view More stays far right in the control bar. Show Closed sits immediately before More on the default visible bar and uses the existing per-view preference through a two-state EyeClosed/Eye pill toggle rather than a checkbox. The expanded More panel keeps Tags in its final row with a Tags icon and `+ Add`, with selected chips following the Add control.

The desktop application hamburger aligns with the top of the page title block, remains far right and uses an approximately 46px hit target with an approximately 29px visible icon. The desktop sidebar is exactly `10.5rem`; `Productivity with sprinkles` wraps naturally and remains centred beneath the ToDonut title without overlapping main content.

The visible desktop application shell fills the dynamic viewport height. Its sidebar and main workspace scroll independently, so scrolling a long view never displaces the brand or Bakery navigation; if the sidebar itself exceeds the viewport, it scrolls internally. The brand must retain its full content height so Today cannot overlap the tagline, and Bakery follows Settings at the normal navigation-option gap instead of being bottom-pinned. Mobile continues to use document scrolling with the fixed bottom navigation.

Task History is collapsed by default in the Task editor and expands like Details, with a clickable heading and chevron. Shared editor disclosure headings render uppercase, for example `DETAILS` and `HISTORY`; ordinary labels, modal titles, tabs, button labels and body copy keep their natural case.

Desktop navigation uses a compact sidebar near 228px and one selected-state pattern shared with selectable Task rows: a narrow aqua left-edge pill, vertically centred and half outside/half inside the row boundary, without a full aqua border.

Task view controls default to Sort, Group, Show Closed and More. Sort and Group stay visible with Lucide icons and accessible names. Show Closed sits immediately before More and defaults Off. More expands to Rows, Status, Priority, Due and Tags. Compact is the default Task row presentation when no stored preference exists.

Compact Task rows show only the drag handle, Priority-coloured completion ring, title, muted Status/Due Date/Project metadata where present, a minimal Must Do Today marker where needed, and icon-only Edit, Process and Move Task to Trash actions. Edit opens the shared Task editor. Process opens the shared Task Move workflow. Detailed rows may retain richer Status, Priority, Tag, description and checklist metadata.

Task completion uses the ring border for Priority colour and a restrained check/ring animation only when a Task changes from open to Completed. Cancelled Tasks do not play the successful completion animation, and reduced-motion users receive the final state immediately.

Task selection no longer has a standalone Select entry button. Clicking a non-interactive Task row body toggles selection. Completion, reorder, Edit, Process, Delete, links and other interactive children do not toggle selection. Selected rows use the shared left-edge pill. A selected count and compact clear-selection control appear with the bulk-action panel.

Bulk Task actions show a primary row of Move, Reschedule, Complete, Cancel and More. The More row contains Add Tags, Remove Tags, Change Status, Change Priority and Move to Trash. All actions are presented as consistent clickable controls and continue to use the existing domain commands, confirmations, Undo and mutation coordinator.

Task editor Details tabs are Basics, More and Checklist. Basics places Status, Priority and Due Date in one responsive row on desktop with Tags beneath. More places Project and Parent in the first responsive row, then Reveal On and Must Do Today in the second row. An empty Due Date field prefills the current Australia/Sydney date only when first focused and remains clearable/editable without affecting Reveal On.

Transient toasts dismiss after 2.5 seconds and stay selectable/copyable while shown. Hover, keyboard focus or active text selection pauses dismissal. Unresolved mutation failures continue to use the persistent recovery banner below the page title, with Retry, Discard my unsaved change and Reload current version as consistently styled buttons.

# 2026-07-03 launch-candidate UI deferrals

Parent/child Task relationship creation, assignment and movement are disabled in launch-candidate UI. Existing hierarchical data remains readable and restorable through compatibility paths, but new Child Task creation, Parent chooser controls and Parent move destinations are not launch-candidate controls. Parent/child relationships should be reworked as a high-priority roadmap item before being reintroduced.

Must Do Today is disabled in launch-candidate UI and command paths. New and saved Tasks keep the stored compatibility field false, Today no longer has a Must Do Today section, and Task rows/filters do not expose the flag. The feature should be revisited as a high-priority roadmap item with clear interaction rules against due dates and future scheduling.

# 2026-07-23 mobile layout addendum

Mobile Tasks share a two-by-two action grid. Lists place Edit above Archive and Move to Trash. Projects and Areas use a vertically centred hamburger whose labelled actions open to the left and close after selection, outside tap or Escape. Reorder handles use a reduced leading inset and remain centred against the complete card.

Priority configuration places Edit alone in the upper-right with Up and Down beneath it. Status configuration places Up and Edit in the upper row and Down and Delete in the lower row. Both action grids remain right aligned.

Mobile dialogs centre in the current visual viewport: with the software keyboard open this places their centre halfway down the visible upper region; after the keyboard closes they return to screen centre. They are not bottom docked.

Visible product language for schedule generation is `Schedule`. Internal recurrence type names and route keys may remain for compatibility, but user-facing labels should not say `Recurrence` or `recurrence Schedule`. Creating a Schedule from a Task uses the Task only as a prefill source for an independent Schedule template; the Schedule does not belong to the source Task.

Task editor Details now use Basics, More and Checklist. Basics contains Status, Priority, Due Date, Tags and Description. More contains Area/s, Project, Reveal On and an existing-Task `Create Schedule` action where valid. Across editable screens and modals, Area precedes Project/Destination whenever both controls coexist.
