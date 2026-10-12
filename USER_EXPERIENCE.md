# ToDonut user experience

## Purpose and scope

One owner captures and reviews Tasks, organises Projects/Areas, keeps reference Lists and uses optional Bakery progression. Mobile touch and keyboard workflows matter; production is online-first, without implied offline/PWA support. Check the affected journey, not the entire product.

Current source navigation is derived from [navigationRegistry.ts](src/app/navigation/navigationRegistry.ts). Today opens by default. Mobile page one is Today, Inbox, Tasks, Lists, Projects, Upcoming; page two is Areas, Overdue, Someday, Trash, Bakery, Settings. Changing dock page does not change destination. Earlier five-item descriptions are superseded.

## Accepted workflow rules

Related entity context uses the shared `EntityContextLine`: visible Area and Project prefixes are replaced by the established Lucide `LandPlot` and `FolderKanban` icons while accessible labels retain the entity kind, configured colour applies only to the related entity title, and multiple parents render comma-separated in Area, Project, then future-parent order. Icon-bearing entries remain in ordinary inline text flow so their title baselines match neighbouring text. Project locations derive indirect Area context for display without duplicating the stored relationship. A List's own configured colour applies to List titles in browser rows and to the `ListOrdered` icon in the active top-bar heading; that heading's List title remains primary white, and List Items never inherit the List colour.

Schedule Task placement mirrors the ordinary single-location model: Area is blank by default and sits left of Destination; Destination defaults to Inbox and offers active Projects; choosing either replaces the other canonical location. Priority is below the placement row. Entity choices use their configured colours, due-on-occurrence uses the custom Lucide circle toggle, and desktop Trash uses a compact four-column entity tab strip with tabs approximately half their former width.

List Items store required visible text separately from an optional `link`. Only absolute `http://` and `https://` links are considered active links. Legacy URL-only text rows are preserved as visible text and, when structurally valid, migrated into the optional link field. Bulk List Item import supports one item per line, including `Name(https://url)` syntax where the name becomes visible text and the URL becomes the item link. The top-bar application hamburger exposes `Copy` for an open List detail; it writes active Item text in manual order as CRLF-separated clipboard text and never includes links. List and List Item drop indicators clear on drag end as well as drop.

Task creation and editing use the shared `features/tasks/editor` modal. The editor is title-first, stores local draft state, reveals Basics/More/Checklist through Details tabs for new Tasks and Basics/More/Checklist/History through Details tabs for existing Tasks, and submits one Create or Save mutation through the shared coordinator. Basics contains Status, Priority, Due Date and Tags; More contains Area/s, Project, Reveal On and an existing-Task `Create Schedule` action. Area always precedes Project/Destination when both are editable in one modal or screen. Project uses the shared filtered text combobox and resolves unique exact typed titles to canonical Project IDs before save; Area/s uses a compact dropdown selector rather than an always-open multi-select listbox. Empty Due Date fields prefill the current Australia/Sydney date only when first focused. Checklist content is active only for leaf Tasks; existing checklist items appear as a read-only prompt list beneath the Task title in edit mode, while the Checklist tab owns add, edit, delete and chevron reorder controls. Aggregate conversion clears the active checklist while recording prior checklist values in Activity History. Parent/child assignment and Must Do Today are disabled for the launch candidate; keep compatibility paths for existing hierarchical data unless a deliberate migration removes them.

Task date-picker overlays use fixed portal positioning, prefer below then above, and clamp top/left coordinates to the visible viewport. They reposition on resize and scrolling and constrain their own height rather than clipping beyond the screen.

Open leaf completion rings are empty in the centre and do not render a static checkmark. Completed leaf Tasks use the shared check drawing animation. When Show Closed is off, `TaskViewPanel` may keep a short local exiting projection mounted for the CSS completion duration plus a 250ms buffer before removing the row; this must continue to call the existing completion command and must bypass delay under `prefers-reduced-motion`.

Shared modals apply initial focus only once when opened. Subsequent draft-state renders must preserve the user's current focus while focus containment, Escape handling and focus restoration continue through the shared modal primitive.

Mobile modal placement follows `window.visualViewport`. The dialog centre tracks the visible viewport centre while the keyboard is open and returns to the full-screen centre when it closes; do not restore bottom-docked narrow-phone modals. Fixed FAB layers do not add document-flow height, and dock/FAB clearance is reserved once on the workspace.

Creation is driven by one shared contextual Add registry rendered by the persistent lower-right floating Add button. Project, List and Task are permanent actions in visual top-to-bottom order; contextual actions such as List Item, Status, Tag, Tag Group, Area and Schedule are appended closer to the FAB only when the active context and capability support a complete creation flow. Child Task is disabled for the launch candidate. The older top-of-screen quick-add field is intentionally removed.

## Feedback and recovery

Confirmed mutations show one success toast only. A feature callback that presents an action-bearing confirmation, such as an Undo notice, must suppress the generic `commit` success toast for that operation.

The authenticated shell intentionally shows no healthy backend adapter badge. Backend state is surfaced through Diagnostics, loading/signed-out states, toasts and the persistent mutation recovery banner only when actionable. Healthy in-flight saves and view-preference saves should not create top-screen feedback.

Preserve draft context, explain validation corrections and distinguish optimistic work from confirmed success. Unresolved mutations use the shared recovery banner; unsafe export stays blocked. Read-only Activity History resolves IDs through its shared formatter rather than displaying raw keys.

## Review discipline

Use user language, including Schedule rather than Recurrence. Support labels, visible focus, keyboard, touch and reduced motion; state cannot rely on colour alone. For a material new journey, check whether users can find the action, predict its result, see success and recover, then seek practical review before broad polish. Ask before a genuinely undecided interaction model; minor accepted-flow fixes proceed without gates. Do not take screenshots unless directly asked. Device sign-in/keyboard acceptance is human evidence and cannot be inferred from source checks.
