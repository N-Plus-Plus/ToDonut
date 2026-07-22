# ToDonut Visual System

This document is authoritative for ToDonut interface and visual-design work. Future UI changes must reuse these tokens and component primitives unless this document is deliberately updated in the same change.

## Visual Philosophy

ToDonut is dark-only, minimalist, monochrome by default, spacious where screen size permits, and restrained rather than decorative. Interface hierarchy comes from alignment, whitespace, type weight, surface contrast and borders before colour.

## Task hierarchy presentation

Task hierarchies use the shared recursive hierarchy component and shared Task row. Each row has a fixed expand/collapse control column followed by the row content. Expand controls are icon buttons with accessible labels and at least the compact icon-button hit target.

Indentation is capped after four visible levels. Desktop uses the normal spacing scale for the first levels; mobile uses tighter spacing so the content column remains usable at 320px width. Additional depth is still communicated by guide lines and hierarchy grouping rather than consuming more horizontal space.

Tree guide lines use subtle borders, not decorative colour. Children are grouped under their parent and descendants must not render again as separate roots within the same hierarchy.

Aggregate rows suppress inactive leaf-only details. They show title, aggregate state, open descendant count, Completed count, Cancelled count, and percent Closed when actionable descendants exist. Progress is led by the established Lucide `ListTodo` Task icon. Empty aggregate rows display the same icon followed by `No actionable Tasks`.

Leaf rows may show Status, Priority, Due Date, Reveal On, Tags, Project or Area context, and in Detailed mode a compact checklist progress phrase such as `3 of 5 checklist items`. Ordinary rows must not render every checklist item.

Structural-only ancestors retained for hierarchy context during filtering should remain visually quiet: normal row structure, muted metadata, and no implication that the ancestor matched the filter independently.

Subtree confirmation dialogs use concise counts and plain consequences: total Tasks, actionable leaves, aggregate parents, destination or Trash action, and whether the full subtree moves together. Dialog content must wrap within mobile modals.

Trash Task rows represent deleted subtree roots. They may show deleted descendant counts and restore the full deleted subtree. Deleted descendants should not appear as unrelated restoration roots while their deleted parent is present.

Colour is a semantic accent. Ordinary controls, panels and navigation remain monochrome unless colour communicates priority, status, tag identity, project identity, warnings, success, destructive action, selected navigation accent, progress, or brief completion feedback.

## Palette Tokens

Define the chromatic palette locally in CSS. Do not depend on external palette pages at runtime.

- `--palette-grapefruit-light: #ed5565`, `--palette-grapefruit-dark: #da4453`
- `--palette-bittersweet-light: #fc6e51`, `--palette-bittersweet-dark: #e9573f`
- `--palette-sunflower-light: #ffce54`, `--palette-sunflower-dark: #f6bb42`
- `--palette-grass-light: #a0d468`, `--palette-grass-dark: #8cc152`
- `--palette-mint-light: #48cfad`, `--palette-mint-dark: #37bc9b`
- `--palette-aqua-light: #4fc1e9`, `--palette-aqua-dark: #3bafda`
- `--palette-blue-jeans-light: #5d9cec`, `--palette-blue-jeans-dark: #4a89dc`
- `--palette-lavender-light: #ac92ec`, `--palette-lavender-dark: #967adc`
- `--palette-pink-rose-light: #ec87c0`, `--palette-pink-rose-dark: #d770ad`
- `--palette-light-grey-light: #f5f7fa`, `--palette-light-grey-dark: #e6e9ed`
- `--palette-medium-grey-light: #ccd1d9`, `--palette-medium-grey-dark: #aab2bd`
- `--palette-dark-grey-light: #656d78`, `--palette-dark-grey-dark: #434a54`

## Semantic Colours

- Page: `--colour-page: #080808`
- Primary surface: `--colour-surface: #101010`
- Elevated surface: `--colour-surface-elevated: #171717`
- Inset surface: `--colour-surface-inset: #0b0b0b`
- Hover surface: `--colour-surface-hover: #202020`
- Pressed surface: `--colour-surface-pressed: #262626`
- Selected surface: `--colour-surface-selected: #1d1d1d`
- Subtle border: `--colour-border-subtle: #252525`
- Ordinary border: `--colour-border: #363636`
- Strong border: `--colour-border-strong: #555555`
- Primary text: `--colour-text: #f1f1f1`
- Secondary text: `--colour-text-secondary: #b7b7b7`
- Muted text: `--colour-text-muted: #858585`
- Disabled text: `--colour-text-disabled: #5f5f5f`
- Focus ring: `--colour-focus-ring: var(--palette-aqua-light)`
- Overlay: `--colour-overlay: rgb(0 0 0 / 72%)`
- Shadow: `--colour-shadow: rgb(0 0 0 / 35%)`
- Destructive: `--colour-danger: var(--palette-grapefruit-light)`
- Warning: `--colour-warning: var(--palette-sunflower-light)`
- Success: `--colour-success: var(--palette-grass-dark)`
- Information: `--colour-info: var(--palette-aqua-light)`

Component code must prefer semantic colour tokens over raw palette values. Entity colours may be passed as CSS custom properties such as `--tag-colour`, `--priority-colour`, and `--project-colour`.

## Spacing

Use this spacing scale: `--space-1: 4px`, `--space-2: 6px`, `--space-3: 8px`, `--space-4: 10px`, `--space-5: 12px`, `--space-6: 16px`, `--space-7: 20px`, `--space-8: 24px`, `--space-9: 32px`, `--space-10: 40px`, `--space-11: 56px`, `--space-12: 72px`.

Very tight inline gaps use `--space-1` or `--space-2`. Icon-to-label gaps use `--space-3`. Ordinary component gaps use `--space-5` or `--space-6`. Section rhythm uses `--space-7` through `--space-10`. Wide desktop page whitespace may use `--space-11` or `--space-12`.

## Sizing

- Compact control: `--size-control-compact: 32px`
- Ordinary control: `--size-control: 40px`
- Prominent control: `--size-control-prominent: 46px`
- Small icon button: `--size-icon-button-sm: 32px`
- Ordinary icon button: `--size-icon-button: 40px`
- Mobile touch target minimum: `--size-touch: 44px`
- Input height: `--size-input: 40px`
- Navigation row: `--size-nav-row: 42px`
- Floating action button: `--size-fab: 56px`
- Floating action menu row: `--size-fab-menu-row: 44px`
- Mobile bottom dock: `--size-mobile-dock: 72px`
- Tag height: `--size-tag: 24px`
- Desktop sidebar: `--size-sidebar: 10.5rem`
- Content max width: `--size-content-max: 1180px`
- Form/panel max width where needed: `--size-panel-max: 760px`

Do not allow similar controls to acquire different heights because of label length or location.

## Icons

Lucide React is the single primary icon family. Use these sizes:

- Inline metadata icon: `--icon-inline: 14px`
- Standard control icon: `--icon-control: 16px`
- Navigation icon: `--icon-nav: 18px`
- Prominent empty-state icon: `--icon-empty: 28px`

Use `stroke-width: 2` by default. Document any exception. Do not mix emoji, text glyphs and Lucide icons for equivalent controls.

## Radius

- Embedded compact elements: `--radius-xs: 3px`
- Tags and tight metadata: `--radius-sm` or `--radius-tag: 5px`
- Standard controls: `--radius-md: 7px`
- Panels and task rows: `--radius-lg: 8px`
- Circular controls only: `--radius-round: 999px`

Do not make every component pill-shaped. Tags use `--radius-tag`, not button radius.

## Typography

Lexend Deca is the universal ToDonut typeface. Do not introduce any other proportional UI typeface. All ordinary app text, controls, navigation, metadata, badges, forms and headings must inherit from `--font-family-app: "Lexend Deca", ui-sans-serif, system-ui, sans-serif`.

- App title: `--font-app-title: 700 1.15rem/1.15 var(--font-family-app)`
- Page title: `--font-page-title: 600 clamp(1.3rem, 3.25vw, 2.45rem)/1 var(--font-family-app)`
- Section heading: `--font-section-title: 700 0.78rem/1.2 var(--font-family-app)`
- Task title: `--font-task-title: 500 1rem/1.35 var(--font-family-app)`
- Body: `--font-body: 400 0.95rem/1.5 var(--font-family-app)`
- Metadata: `--font-meta: 400 0.8rem/1.35 var(--font-family-app)`
- Label: `--font-label: 700 0.72rem/1.2 var(--font-family-app)`
- Button: `--font-button: 700 0.84rem/1 var(--font-family-app)`
- Badge: `--font-badge: 700 0.7rem/1 var(--font-family-app)`
- Diagnostic monospace: `--font-mono: 400 0.8rem/1.45 "SFMono-Regular", Consolas, monospace`

Avoid excessive font-size variation. Letter spacing is `0` except all-caps section labels, which may use `0.04em`.

Avoid nonstandard text glyphs in the UI. Use ASCII text plus Lucide icons for symbols and actions. Mojibake or replacement characters are defects and must be corrected at the source whenever reasonably possible.

## Borders And Elevation

Prefer surface contrast and borders over shadows. Use `--colour-border-subtle` for separators, `--colour-border` for ordinary components, `--colour-border-strong` for hover or selected emphasis, and a 2px `--colour-focus-ring` outline for keyboard focus.

Elevation is limited to `--shadow-elevated: 0 16px 36px var(--colour-shadow)` for modals or overlays only. Ordinary cards and task rows do not use large shadows.

## Motion

Use restrained motion:

- Hover: `--duration-hover: 140ms`
- Press: `--duration-press: 90ms`
- Panel/modal transition: `--duration-panel: 180ms`
- Completion feedback: `--duration-complete: 640ms`
- Easing: `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`

Respect `prefers-reduced-motion: reduce` by removing meaningful transitions and animations.

## Buttons

Use `.button` for all text buttons. Variants are `.primary`, `.ghost`, and `.danger`; the default is secondary.

Button rules:

- Ordinary height is `40px`.
- Horizontal padding is `--space-6`.
- Icon-to-label gap is `--space-3`.
- Icon size is `16px`.
- Radius is `7px`.
- Focus uses the global focus-visible ring.
- Disabled buttons use muted text, subtle border, non-interactive cursor and no press transform.
- Pressed buttons may move down `1px` or use `--colour-surface-pressed`.
- Destructive buttons are restrained until hover or focus.
- Primary buttons use monochrome inversion, not large saturated colour blocks.

Icon-only buttons use `.icon-button`, remain at least `40px`, and must have an accessible name or tooltip.

## Tags

Tags are compact metadata, not large buttons. Use `.tag`.

- Height: `24px`
- Padding: `0 --space-3`
- Radius: `--radius-tag`
- Border: `1px solid --colour-border-subtle`
- Typography: `--font-badge`
- Colour application: leading 6px marker via `--tag-colour`, plus monochrome surface and readable text.

Selected or removable tag variants must preserve this geometry. Tag Group membership must not introduce unrelated tag styling.

Wrapping Tag pickers keep the Add tag control first, followed immediately by selected Tags. Removal controls remain inside the compact Tag geometry.

## Status, Priority And Project Markers

Each Status has one unique palette colour and one unique selectable Lucide icon from the approved circle-icon set. Used colours and icons do not appear as choices for another Status, while the record's own current choices remain visible during editing. Project browser cards render the configured Status icon in its configured colour immediately before the title. Project card title text uses the primary white text colour at medium weight (`500`); the icon supplements grouping and accessible naming rather than replacing Status text everywhere.

Use `.badge` for status and sync-like labels, `.priority-indicator` for priority, and `.project-marker` for project identity. Each uses a small marker plus text so colour is not the only indicator.

Do not make entire task rows or cards colourful because a task has a status, priority, project, or tag colour.

Status settings rows use the same restrained list-row grammar as other settings records: the configured Lucide icon in its configured colour, status name with compact mapped-state/default metadata inline, and icon-only row actions. Keep this as one desktop row; responsive layouts may wrap only when the available width requires it. Internal numeric order values are not displayed.

## Task Rows

Use one visual grammar for tasks:

- Grid: completion control, main content, actions.
- Completion control is a circular `32px` button.
- Task title uses `--font-task-title`.
- Metadata uses `.task-meta`, wraps, and contains badges/tags/markers.
- Rows use elevated monochrome surface and subtle border.
- Aggregate tasks add a narrow left information accent, not a new component family.
- Closed, deferred, pending and failed states must include text/icon/shape, not opacity alone.
- Avoid surrounding every task field with its own border.

Compact and detailed modes must share this grammar.

## Cards, Panels And Lists

Use `.panel` or `.list-panel` for grouped content. Panel radius is `8px`, padding is `16px`, and border is subtle. Do not nest cards inside cards unless the inner item is a true repeated record. Page sections should not appear as decorative floating cards.

List rows use separators and spacing before extra boxes.

Reference List rows use one compact horizontal card grammar: left reorder handle when reordering is available, title/context text block, and one right-aligned compact icon action group. The handle is vertically centred with the title block, the second line is muted context such as `Loose` or `Project: Shape ToDonut`, and desktop actions stay on the same row. Reorder controls are represented only by the left `GripVertical` handle; do not duplicate Move Up or Move Down buttons on the right. Icon-only actions need accessible labels and tooltips, and destructive delete keeps the ruby/danger treatment.

When an entity is shown as another record's parent context, replace visible `Area:` and `Project:` prefixes with the established Lucide `LandPlot` and `FolderKanban` icons, retain an accessible entity-kind label, and colour only the entity title with that entity's configured colour. Multiple parent contexts share one comma-separated line in hierarchy order: Area, then Project, then any future parent types. A Project-linked record includes the Project's Area as indirect context. Lists with a configured colour render their own title in that colour in List rows and the active List heading; List Item text does not inherit it.

The blank first swatch in List Appearance is the selected no-colour state and clears an existing List colour on Save.

Reference List detail headers use Back, title/location/Tags and compact icon actions. Archived presentation removes edit controls rather than disabling them.

List, Project and Area detail routes show one shared icon-only Lucide ArrowLeft control immediately before the entity name in the application top bar. It represents route history and returns to the actual prior in-app screen; do not add a second feature-local text Back button.

All non-home Settings screens reuse that same top-bar ArrowLeft control immediately before the Settings title. Its accessible label is `Back to Settings`, it returns to Settings home, and Settings feature panels do not render duplicate local Back controls.

Location selectors use a compact segmented control for Loose, Area and Project. Area uses a normal field selector. Project uses the shared text combobox: matching suggestions appear below the field in the anchored portal layer, and an exact typed title has the same selected state as clicking that Project.

## Navigation

Desktop navigation uses a `284px` sidebar and `42px` rows. Mobile navigation becomes a fixed bottom bar with `56px` rows. Selected state is always monochrome selected surface plus the aqua accent marker. Do not give each destination a different accent colour.

Navigation icons use `18px`. Labels must not wrap awkwardly; truncate on desktop and use compact labels on mobile.

Mobile bottom navigation may paginate between two five-item dock pages. Swiping the dock changes only the visible dock page, not the current destination. A restrained two-dot page indicator is acceptable when it uses monochrome inactive dots and the semantic information accent for the active dot.

## Floating Creation

Use `.fab` for the persistent Add action. It is a fixed circular `56px` button in the lower right, elevated above mobile bottom navigation and safe-area insets. Its compact `.fab-menu` expands upward as a vertical list of `44px` action rows. The menu remains monochrome, uses Lucide icons, closes on outside tap or Escape, and must not become a radial or decorative control.

## Forms And Modals

Inputs use `.field`, `40px` height, inset surface, ordinary border and `7px` radius. Text areas use the same border/radius and at least `112px` height. Description textarea content always uses regular `400` body weight rather than inheriting the bold field-label weight.

Form layout must group related fields clearly, use token spacing, keep destructive actions separated from ordinary actions, and place error text near the field. Desktop task editors should be spacious; mobile forms should collapse without clipped controls.

Field-level warnings and validation messages should not change the height of a row of fields. They may overlay below the related field with a higher z-index so the field row remains stable.

Modals, when introduced, must use the overlay token, elevated surface, limited shadow, consistent action placement, focus management and escape/close affordances.

Custom modal dropdowns render in the shared portal layer so they may extend beyond the modal scroll box. They remain anchored to their trigger, prefer below then above, and clamp within a `--space-2` screen margin with internal scrolling where necessary.

### Progressive Disclosure

Where a form remains useful with one or two required fields, present those fields first and hide optional complexity behind a clear disclosure control. Do not fill the initial screen with every available option.

Collapsible Details sections must not discard entered data. Expanded state should preserve the selected tab during the current editing session. Disclosure state must be visually clear through icon direction and `aria-expanded`; spacing and motion use existing form rhythm and respect reduced motion.

Use tabs when several distinct optional feature groups would otherwise create one long form. Tabs keep simultaneously visible controls low, use concise labels, preserve draft state, remain accessible, support keyboard movement and avoid nested tabs.

### Task Editor Layout

The Task editor opens in a minimal title-only state with a collapsed `Details` control and Create or Save actions. Expanding Details shows three tabs in this order: Basics, More, Checklist.

Basics places Status, Priority and Due Date in one shared row where space permits, stacking on narrow screens. Tags use a wrapping row where `Add tag` stays first and selected compact Tags follow immediately. Description uses a restrained multiline text area with internal growth or scrolling. Due Date uses text input, picker trigger, clear action and inline validation; it does not repeat the selected date in secondary helper text.

More contains Area/s and Project, in that order, in the first responsive row, followed by Reveal On and, for existing Tasks that can seed a Schedule, a `Create Schedule` action. Whenever Area and Project/Destination are both editable in one modal or screen, Area precedes Project/Destination in visual and source order. Project uses the shared text combobox with anchored filtered suggestions. Area/s uses a compact dropdown with checkbox rows rather than an always-open multi-select listbox. Parent/child task relationship controls and Must Do Today controls are disabled for the launch candidate. Reveal On uses the same date-control styling as Due Date.

Selectable Area and Project titles use their configured entity colour in native dropdown options, selected controls and typeahead suggestions. When a custom dropdown's selected value is coloured, its Lucide down chevron remains ordinary white. Schedule Task placement puts blank-default Area left of Inbox-default Destination, with Priority below. The `Due Date equals occurrence date` control uses an empty Lucide circle when unchecked and a mint Lucide circle-check when checked, not a native checkbox.

Do not wrap ordinary Project or Area modal fields in a decorative `Details` container when there are no tabs to organise. Render those fields directly in the modal form rhythm; retain fieldsets only where their legend identifies a real semantic group.

All checkbox-driven controls use the shared Lucide circle treatment: `Circle` when unchecked and `CircleCheck` when checked. Checked icons use the adjacent entity's configured colour when the option represents a coloured entity, such as an Area menu item; every other checked icon uses mint. Browser-native checkbox artwork is not shown.

Quantifier selectors use a responsive two-column row and stack on narrow screens. Their labels use the semantic icon followed by the configurable dimension name: Lucide `Zap` for Energy and Lucide `Component` for Context. Selectors always show the full option name. Settings gives every option a companion icon-token field accepting pipe-separated Lucide reference names; explanatory copy must state that spaces are ignored and order and duplicates are preserved. A configured option renders only its ordered icon sequence at `--icon-inline` size immediately after the associated Project, Task or List name, separated by the standard small gap; further configured Quantifiers follow after the same gap in definition order. These title-adjacent icons use the primary white text colour, and the full dimension and option name remains accessible. An unconfigured selected option stays in metadata after Area and Project context and falls back to the dimension icon followed by its muted name. Metadata Quantifier icons use the same secondary foreground colour as ordinary Edit, Promote/Demote and Archive actions. Keep metadata icon-bearing entries in inline text flow with the icon vertically offset, not flex-centred, so text baselines match adjacent icon-free text.

On desktop, the four Trash entity tabs share one row with each tab approximately half its former width. Mobile retains the full-width responsive tab strip.

Tabs inside screens use one clean treatment: no visible parent container border, background or padding; tabs sit side by side with only their own state. Selected tabs have rounded top corners only and a strong blue bottom border.

Checklist rows use a stable seven-part geometry: handle, checkbox, item text, Move Up chevron, Move Down chevron, Edit, Delete. Move controls are icon-only chevron buttons immediately before Edit, not a secondary text-button row. Hit areas must remain tappable on mobile.

### Date Picker

The Task date picker uses seven columns, nine rows and a Monday-first layout. The default window begins on Monday of the current local week. It opens as an overlay anchored to the calendar icon rather than as in-flow form content. It renders below the trigger when it fits, otherwise above, and must not be clipped by modal overflow or resize surrounding fields.

After choosing above or below, clamp the complete date-picker overlay inside a `--space-2` viewport margin on both axes. Recalculate on viewport resize and ancestor/window scrolling. Constrained-height overlays use internal scrolling so their outer bounds remain visible.

Cells from the middle month use a slightly lighter dark neutral surface than surrounding month cells, forming a subtle contiguous underlay through cell backgrounds and edge treatment. The picker remains monochrome except semantic selected, warning or focus accents.

Selected date, today, keyboard focus, hover and out-of-month states must be distinguishable without colour alone. The picker must fit narrow mobile widths without horizontal page scrolling.

### Checklist Rows

Checklist item text remains ordinary body text until checked. Checked rows keep readable text, use muted grey and strikethrough, and remain reversible. Row spacing follows Reference List Item density; drag handles and icon actions use standard control sizes and Lucide icons.

## Empty, Loading, Pending And Error States

Empty states use `.empty`: dashed ordinary border, monochrome surface, muted body text and optional Lucide icon. Loading and skeleton states should use monochrome placeholders. Pending sync uses warning accent with text. Failed sync uses danger accent with text and recoverable action.

## Hidden Lifecycle Surfaces

Trash uses a compact segmented control for Deleted and Archived modes. The selected mode uses the standard selected surface plus the information accent underline. Labels must remain visible at narrow mobile widths and controls must expose accessible selected state.

Entity tabs sit beneath the mode control and reuse the same compact tab geometry. Deleted mode shows Projects, Tasks and Lists. Archived mode shows Projects and Lists only; do not render a disabled empty Tasks tab. Focus and selected states must be clear without relying on colour alone.

Hidden record rows are compact, vertically scrollable and timestamp-led. Each row shows title first, then lifecycle timestamp and concise context in metadata styling. Restore and Unarchive are text-labelled primary actions, may include Lucide RotateCcw or Archive icons, remain at least mobile touch height, and move below the row content on narrow screens.

Archived relationship indicators are subdued but readable, include a Lucide Archive icon where space permits and carry an accessible archived label. They are not styled as errors or broken links.

Archived detail surfaces must look clearly archived without becoming disabled-looking. Required read-only surfaces remove creation and edit controls entirely, suppress contextual Add actions, and keep Unarchive prominent but restrained where it is available.

## Responsive Layout

Desktop content uses `width: min(--size-content-max, 100%)`, centered within the available space, with horizontal padding that grows up to `--space-12`. Wide screens may increase top padding and section rhythm. At a viewport width of `2000px` or more, apply a layout-aware `1.3` root interface scale to the complete application, including overlays and fixed controls. Compensate the full-height shell so it still occupies exactly one visible viewport. Below `2000px`, use the ordinary `1` scale. The application scale supplements normal browser zoom and must not use a zoom-reset value that blocks user adjustment.

Mobile uses a single-column shell, bottom navigation, `--space-4` to `--space-5` side padding, comfortable touch targets, wrapping task titles, and full-width quick-add submit buttons on narrow phones.

Validate at narrow phone, ordinary phone, tablet width, standard desktop, the `2000px` scale boundary and an ultra-wide desktop. Check no horizontal scrolling, clipped controls, inconsistent button heights or tag geometry, poor line lengths, modal usability or anchored-overlay drift.

## Accessibility

All interactive elements must be semantic buttons, links, inputs, or controls. Icon-only controls require accessible names. Focus-visible must be obvious. Text contrast must remain readable in the subdued monochrome theme. Colour-coded state must also include text, icon, shape, or position. Touch targets on mobile must be at least `44px` where the control is primary or frequent.

## Prohibited Patterns

Do not use gradients, glassmorphism, decorative background patterns, glowing effects, oversized rounded cards, arbitrary shadows, thick borders, random radii, saturated large backgrounds without semantic need, multiple competing accents in one local region, one-off raw greys, one-off spacing values, unrelated icon families, or dense mobile layouts stretched unchanged across desktop.

## Extending The System

Before adding a new visual pattern, first check whether `.button`, `.field`, `.tag`, `.badge`, `.priority-indicator`, `.project-marker`, `.panel`, `.task-row`, `.empty`, `.nav-button`, or existing tokens cover it. If a new primitive is necessary, add tokens/classes here and in `src/styles.css` together. Record any deliberate deviation from this document in the task completion report.

# 2026-07-02 desktop cleanup rules

Desktop sidebar width is exactly `10.5rem`. The brand block keeps the ToDonut logo, `ToDonut` title and exact tagline `Productivity with sprinkles`; the tagline may wrap naturally and remains visually centred beneath the title. Healthy backend adapter labels do not occupy ordinary header space.

On desktop, the application shell is exactly one dynamic viewport high. The sidebar and workspace are independent vertical scroll containers: long workspace content must never move the sidebar, while sidebar overflow scrolls internally. The brand and navigation rows do not shrink or overlap at reduced heights, and Bakery follows Settings with the same spacing used between ordinary navigation options rather than being pushed to the viewport bottom. Mobile retains normal document scrolling because the desktop sidebar is hidden.

Selected navigation and selected Task rows use one shared indicator: a narrow aqua pill on the left edge, vertically centred, rounded, and half outside/half inside the element border. Do not replace this with a full aqua border. Focus remains a separate focus-visible outline.

Task view controls show Sort, Group, Show Closed and More by default. Sort and Group use Lucide icons with screen-reader labels and visible selected values. Show Closed is the EyeClosed/Eye toggle and sits immediately before More in the right-aligned control group. More expands to a compact responsive grid for Rows, Status, Priority, Due and Tags.

Compact Task rows are the default presentation when no saved preference exists. Compact rows show the drag handle, Priority-coloured completion ring, title, muted Status, Due Date and Project metadata, and square icon-only Edit, Process and Trash actions. Compact Status metadata uses `Status:` text plus a small status-colour marker rather than a pill. Description, Priority, Active parent and ordinary Tag pills belong in Detailed rows, not Compact rows.

The completion ring uses the configured Priority colour while incomplete. Successful completion animates for `--duration-complete` with a restrained ring/check transition, must not move layout, must not play for Cancelled, and must respect reduced motion. When Closed rows are hidden, the task view keeps a route-scoped exiting row projection mounted for the completion duration plus a short 250ms buffer, disables repeated completion clicks for that temporary row, then removes it if the canonical completed Task no longer belongs in the view. Show Closed keeps the row visible as Closed. Reduced-motion users skip the artificial exit delay, and failed, discarded or undone mutations clear the temporary projection so the row renders from canonical state.

Task drag handles keep the Lucide `GripVertical` glyph compact while providing a transparent practical hit area through the handle column. Section headings align with the left edge of the Task cards beneath them; hierarchy indentation remains inside Task trees.

Bulk selection starts from row-body clicks. When Tasks are selected, show a compact selected count, a clear-selection icon and a bulk panel with primary Move, Reschedule, Complete, Cancel and More actions. More reveals Add Tags, Remove Tags, Change Status, Change Priority and Move to Trash using the same button/action style.

Transient toasts dismiss after 2.5 seconds, remain selectable/copyable and pause while hovered, focused or while text is selected inside them. The persistent mutation recovery banner remains below the page title and uses one compact action row of real buttons for Retry, Discard my unsaved change and Reload current version.

Overlay z-index order is explicit: mobile dock below feedback, feedback below closed FAB, expanded FAB menu above feedback, application menu above the FAB menu, and modals topmost while the FAB is hidden.

## Visual Review Checklist

- Raw colours avoided outside token definitions or entity colour custom properties.
- Button heights, icon sizes, gaps and radii match this guide.
- Tags are compact and consistent.
- Colour is semantic and restrained.
- Focus, hover, active, selected, disabled, pending and failed states are visible.
- Desktop uses deliberate margins and breathing room.
- Mobile remains efficient and touch-friendly.
- Lucide is the only ordinary control icon family.
- Long task titles, many tags, empty states and dense states remain legible.
- `prefers-reduced-motion` is respected.
# Bakery visual extension

Bakery keeps the dark monochrome application shell and uses registered ingredient/product art as restrained focal colour. Its four tabs use the shared accessible tab treatment and may scroll horizontally at narrow widths. Resource, shop, recipe and contract sections use dividers and compact rows rather than nested card grids. Missing art uses one consistent outlined Lucide fallback at the registered asset key, allowing PNG replacement without component changes.
# Bakery catalogue disclosure

Long Bakery catalogues use native collapsible supplier and recipe-category sections. Summary rows retain the standard touch target, show a concise state/count, and cards keep art at the established 40px size. Ingredient and recipe secondary details use muted text; long names wrap rather than forcing horizontal overflow.

# Bakery business disclosure

Business categories and Advertising use collapsible sections with one current or next state per row. Display slots use a responsive grid; locked slots use a subdued dashed boundary. Queue entries state that future prices are not locked. On narrow screens, cost actions become full-width touch targets.
# Bakery charts and progress data

Compact Bakery charts use project-native accessible SVG, observed points only, and a non-visual textual summary. Trend labels always include text and never depend on colour. Statistics use progressive disclosure with paired term/value grids; milestones remain compact rows without celebratory overlays. At narrow widths, statistic pairs stack and Bakery tabs remain touch-sized and horizontally scrollable.

# Configuration controls

Statuses, Priorities, Tags and Tag Groups use one compact configuration-row grammar: drag handle, identity marker, name, concise metadata badges, optional Default badge, Move Up, Move Down, Edit and Delete where deletion is allowed. Status identity markers use the configured coloured icon; other configuration rows may use a colour swatch. Numeric order values are not displayed.

Colour pickers use the established palette as compact labelled swatches. Selected state must include border/surface treatment in addition to colour. Raw hex entry is not exposed.

Stored entity icon fields remain compatibility data only. Do not expose entity icon pickers or show entity icons in launch UI until the roadmap icon-system revisit defines a stronger set and placement rules.

Scope selectors use compact checkbox rows for Tasks, Projects and Reference Lists. There is no List Item scope in launch UI.

Grouped Tag pickers keep `Add tag` first, selected Tags immediately after it, and wrapping rows. Available Tags are grouped by active Tag Group order, then Tag order, with ungrouped Tags last. Mutually exclusive Groups use a concise text indicator. Tag chips retain the standard compact `.tag` geometry.

The Settings Tags tab uses compact Tag Group headings in configured order and a final Loose heading. Member rows retain the shared configuration-row grammar and use one small indentation beneath non-Loose group headings; do not turn groups into decorative cards. Reorder controls operate only within the displayed section.

Loose Tag rows retain their individual left colour marker. A grouped section instead places one colour marker to the left of its Tag Group name. The group name is white, uses the same size as Tag row names and retains the stronger group-heading weight; grouped member names use the inherited group colour and omit their own markers.

Non-Loose Tag Group headings begin with an icon-only Lucide up/down chevron disclosure, followed by the group colour marker and name. Tag name and scope metadata share one wrapping line with a deliberate gap. Tag row names use weight 500; group headings retain weight 700.

Default markers are ordinary `.badge.success` labels beside row metadata. Mutually exclusive indicators are compact metadata labels, not large coloured panels.

# Schedule settings

Schedule settings rows use the same compact settings-row grammar as configuration records: a small monochrome calendar marker, Schedule label, wrapped `.task-meta` metadata, and icon-only Edit, Pause or Resume, and Move to Trash actions. Rows are not cards inside cards.

Active, Paused and Needs Attention states use text badges. Active may use `.badge.success`; Needs Attention may use warning/danger treatment and a short inline warning below metadata. State must not rely on colour alone.

Rule summaries are concise plain text such as `Daily`, `Every 2 weeks on Mon, Wed`, or `Monthly on day 31`. They wrap safely inside row metadata and never force horizontal scrolling.

Next occurrence and last generation dates are metadata, not large headings. Dates use the app's date-only presentation and remain readable on 320px wide screens.

The Schedule editor uses compact tabs or sections for Schedule, Rule, Task and History. It must reuse ordinary `.field`, `.task-tabs`, `.checkbox-row`, shared Tag picker, Priority selector, destination selector and modal action rules.

The weekday selector is a wrapped Monday-first checkbox group. It must keep each checkbox tappable at mobile widths and must not resize the surrounding modal when days are toggled.

Destination warnings use `.inline-warning` near the destination control or row metadata. They explain invalid, deleted, archived or completed destinations without silently implying fallback.

Generated Task provenance is shown only in Task detail or History contexts, not on every compact Task row. The text is concise, for example `Generated by Schedule`.

# Project and Area management

Projects and Areas are separate top-level destinations. Neither destination uses a Projects/Areas tab bar. Both browser screens use the shared compact view-control grammar with Sort and Group on the left and an EyeClosed/Eye visibility toggle on the right. Projects uses the toggle for Closed Projects. Areas uses the toggle for deleted Areas; show deleted and show archived controls must use this toggle pattern rather than checkboxes.

Project and Area browser rows reuse the Reference List row grammar: title or main area is the primary open target, secondary metadata wraps beneath it, and row actions stay compact. Use icon-only actions where the symbol is familiar and accessible names are present. Task promotion uses `PanelTopClose` at the right of each Task action row; Project demotion uses `PanelBottomClose` beside Edit. Both open confirmation modals. Do not place large duplicate buttons on every Project or Area row.

Project create/edit places Area first and Status second in one responsive two-column row, stacking on narrow screens. Status options use their configured colour. Project Status icons are aligned with the title baseline and do not change the Project title colour.

Area colours appear as a small accent or marker, never as a full-card fill. Per-Project colour is dormant compatibility data: Project create/edit has no colour picker and Project browser rows show no Project-colour accent. Keep the stored value and dormant accent styling available for a possible future restoration. Project and Area icons are not configurable; the established navigation icons may represent their kind in inline parent context. The row title, context and lifecycle text must not rely on colour alone.

Project progress is compact metadata. Lead it with the established Lucide `ListTodo` Task icon using the shared baseline-safe inline icon pattern. Show percent closed when actionable Tasks exist, plus open, completed and cancelled counts where space permits. When no actionable Tasks exist, show `No actionable Tasks`. Progress text must wrap before crowding the title or actions.

Project browser-card actions remain in the same row as the title and metadata whenever the card has practical horizontal room. Tablet and wide-mobile layouts retain that row; only narrow layouts stack the action group beneath the text.

Project detail headers use the identity block and compact actions without a local Back shortcut; returning to the Projects browser is available through the Projects destination. Area detail headers may reuse the Reference List Back pattern. Completed and archived Project detail surfaces remove creation/edit affordances that are not allowed rather than leaving disabled controls in place. Archived and completed states use readable lifecycle text and subdued styling without making existing content look broken.

Containment sections for Project Tasks, Project Reference Lists, Area Projects, standalone Area Tasks and direct Area Lists are ordinary full-width sections using shared empty states. Do not nest decorative cards inside these sections.

Deleted Area restoration appears only inside Areas management. Deleted Area rows show title, deletion timestamp and Restore using the same compact hidden-record grammar as Trash, but Areas are not added as a global Trash tab.

# Launch task view controls and history

Task view controls use one compact wrapping control bar. `Show Closed` uses the shared EyeClosed/Eye toggle on the default visible bar, immediately before `More`, while Sort, Group, Presentation and Filters use compact labelled fields. On narrow screens controls wrap into multiple short rows and must not force horizontal scrolling.

Active filters are represented by concise control state and a `Clear Filters` action. Clear Filters resets only transient filters and must not change Sort, Group, Presentation or Show Closed.

Grouping headings use ordinary section-heading typography. Empty groups are omitted. Deferred and Closed sections use section-level structure and a non-colour cue; opacity alone is not sufficient.

Compact and Detailed Task rows share the same task-row grid. Root Tasks align with section headings and receive no hierarchy indentation; only descendants are indented. The compact grid is drag handle, Priority-coloured completion ring, title/metadata and one right-aligned action row. Compact metadata uses muted colon-labelled text such as `Status:`, `Due:` and `Project:`, with a small marker for Status colour. Open completion rings are empty in the centre; completed Tasks use the animated check drawing. Detailed rows may additionally show description preview, Tags, Reveal On, Project/Area context, checklist progress and aggregate progress.

Task row actions are one horizontal icon-only group: Edit, Process, Delete. All three actions use the same square dimensions, outline and corner radius. Delete retains destructive/ruby treatment.

Task view More aligns to the far right of the control bar. Show Closed sits immediately before More with normal control spacing and uses the EyeClosed/Eye pill toggle bound to the existing per-view preference. In the expanded panel, Tags use a Tags icon and `+ Add`.

The application hamburger aligns to the top of the page title block on desktop. Its hit target is about 46px and the visible icon is about 29px; this sizing does not apply to ordinary row action icons.

Shared editor disclosure headings render uppercase through the shared disclosure-heading style. Do not uppercase input labels, modal titles, tabs, buttons or body copy.

Bulk selection adds a checkbox control with a minimum touch target at the start of each Task row. The selected count remains visible. The bulk action bar is sticky, wraps safely, avoids the mobile dock and FAB area, and uses compact fields or overflow-like wrapping rather than nine equal-width mobile buttons.

Activity History appears as a read-only list inside editors. In the Task editor it is a fourth Details tab for existing Tasks rather than a separate persistent disclosure. It shows newest-first entries with local Australian date/time, concise summary, and old/new value pairs where recorded. Long stored values wrap rather than overflowing.

Filtered-empty states distinguish no records from no filter matches. When filters hide all records, show a concise message and Clear Filters. When only Closed records match, show the concise message and rely on the default visible `Show Closed` toggle rather than adding a second action.

# Launch movement and entry controls

Must Do Today is disabled for the launch candidate and must not render in Task editor, Task rows, filters or Today sections until it is reworked.

The List Item editor uses a compact Single Item / Multiple Items segmented control. Multiple Items uses one multiline textarea, a live valid-line count and ordinary modal actions. The draft remains visible after a failed save.

The shared Task Move modal uses one destination selector containing Inbox, Someday, active Areas and active Projects. Parent destinations are disabled for the launch candidate. Subtree impact counts wrap inside the modal.

Task sibling ordering exposes only a Lucide `GripVertical` handle labelled `Reorder Task`. The handle supports pointer/touch dragging and focused Up/Down arrow reordering. Drag styling must not imply horizontal reparenting.

Unsafe Undo uses shared warning feedback with a concise explanation that newer changes prevent reversal. It must not imply that a partial restore occurred.
# 2026-07-02 launch-gap UI rules

- Active filters use concise removable chips in a wrapping container, followed by a separate Clear Filters action.
- Task Tag filters use the shared grouped picker, show selected Tags, and remain horizontally safe on narrow screens.
- Structural-only hierarchy ancestors keep readable titles, use subdued context styling, and omit leaf metadata and actions that imply a match.
- Unavailable entity routes use a compact explanatory state with browser and destination-back actions.
- Archived Project headers show only lifecycle-valid actions.
- Unsupported controls are not rendered. Desktop-only controls use layout removal at mobile breakpoints, never opacity or off-screen positioning.
- Multi-Task aggregate and movement operations show Task totals, actionable-leaf impact, destination and subtree/cascade meaning before commit.

# Launch polish controls and loading

Malformed encoding, mojibake and replacement characters are interface defects. Source and documentation use UTF-8 without a byte-order mark; valid Unicode remains acceptable where it has a clear visual or semantic purpose.

Close controls and reorder handles use Lucide icons. Close controls use `X` with an accessible name. Reorder controls use `GripVertical`, the shared icon size, grab cursor and focus treatment, and must not render where reordering is unavailable. Configuration reorder handles support focused Up/Down arrow operation; Task and List Item handles retain their existing pointer/touch drag behaviour.

Optional destination loading boundaries use the shared restrained empty-state presentation, include visible accessible loading text and preserve the surrounding application shell. They must not present a blank screen or layout-breaking spinner.
